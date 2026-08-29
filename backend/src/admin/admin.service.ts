import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, and, or, not, like, count, sum, desc, gte, lte, ne } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { generateCbtKey, encryptFieldValue } from '../users/utils';

@Injectable()
export class AdminService {
  private statsCache?: {
    data: any;
    expiresAt: number;
  };
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async getOverviewStats(): Promise<any> {
    const now = Date.now();
    if (this.statsCache && this.statsCache.expiresAt > now) {
      return this.statsCache.data;
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 3600 * 1000);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);

    // 1. Total Voucher keys generated (emails ending in @aurikex.local)
    const totalVouchersQuery = await this.db.select({ value: count() }).from(schema.users).where(like(schema.users.email, '%@aurikex.local'));
    const totalVouchers = totalVouchersQuery[0].value;

    // 2. Total Registered Candidates (students with real emails)
    const totalCandidatesQuery = await this.db.select({ value: count() }).from(schema.users).where(and(eq(schema.users.role, 'student'), not(like(schema.users.email, '%@aurikex.local'))));
    const totalCandidates = totalCandidatesQuery[0].value;

    // 3. Subscriptions breakdown
    const activeSubscriptionsQuery = await this.db.select({ value: count() }).from(schema.users).where(ne(schema.users.subscription_tier, 'free'));
    const activeSubscriptions = activeSubscriptionsQuery[0].value;

    // 4. Completed mock exams stats
    const totalCompletedExamsQuery = await this.db.select({ value: count() }).from(schema.exam_sessions).where(eq(schema.exam_sessions.status, 'completed'));
    const totalCompletedExams = totalCompletedExamsQuery[0].value;

    const examsTodayQuery = await this.db.select({ value: count() }).from(schema.exam_sessions).where(and(eq(schema.exam_sessions.status, 'completed'), gte(schema.exam_sessions.completedAt, startOfToday)));
    const examsToday = examsTodayQuery[0].value;

    const examsYesterdayQuery = await this.db.select({ value: count() }).from(schema.exam_sessions).where(and(eq(schema.exam_sessions.status, 'completed'), gte(schema.exam_sessions.completedAt, startOfYesterday), lte(schema.exam_sessions.completedAt, endOfYesterday)));
    const examsYesterday = examsYesterdayQuery[0].value;

    // 5. Total Revenue from PaymentLogs
    const billingAggregation = await this.db.select({ total: sum(schema.payment_logs.amount) }).from(schema.payment_logs);
    const totalRevenue = (Number(billingAggregation[0]?.total) || 0) / 100; // Divide by 100 to convert from kobo/cents

    const data = {
      candidates: {
        total: totalCandidates,
        vouchers: totalVouchers,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
      exams: {
        total: totalCompletedExams,
        today: examsToday,
        yesterday: examsYesterday,
      },
      revenue: {
        total: totalRevenue,
      },
      generatedAt: new Date(),
    };

    this.statsCache = {
      data,
      expiresAt: now + this.CACHE_TTL_MS,
    };

    return data;
  }

  async listUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const conditions = [];
    if (params.role) conditions.push(eq(schema.users.role, params.role));
    if (params.status) conditions.push(eq(schema.users.account_status, params.status));
    if (params.search) {
      const searchStr = `%${params.search.trim()}%`;
      conditions.push(or(like(schema.users.fullName, searchStr), like(schema.users.email, searchStr)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalQuery = await this.db.select({ value: count() }).from(schema.users).where(whereClause);
    const total = totalQuery[0].value;
    const totalPages = Math.ceil(total / params.limit) || 1;
    const skip = (params.page - 1) * params.limit;

    const data = await this.db.select()
      .from(schema.users)
      .where(whereClause)
      .orderBy(desc(schema.users.createdAt))
      .limit(params.limit)
      .offset(skip);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
    };
  }

  async updateUserStatus(userId: string, status: string) {
    const validStatuses = ['active', 'locked', 'suspended', 'pending_verification'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid account status value.');
    }

    const user = await this.db.update(schema.users)
      .set({ account_status: status })
      .where(eq(schema.users.id, userId))
      .returning();

    if (!user || user.length === 0) {
      throw new BadRequestException('User not found.');
    }

    return user[0];
  }

  async generateBulkKeys(countToGenerate: number): Promise<string[]> {
    if (countToGenerate < 1 || countToGenerate > 1000) {
      throw new BadRequestException('Batch size must be between 1 and 1000.');
    }

    const keys: string[] = [];
    const valuesToInsert = [];

    // Create keys inside a loop
    for (let i = 0; i < countToGenerate; i++) {
      const plainKey = generateCbtKey();
      const hash = createHash('sha256').update(plainKey).digest('hex');

      valuesToInsert.push({
        id: randomUUID(),
        fullName: 'CBT Voucher Account',
        email: `voucher-${plainKey.toLowerCase().replace(/-/g, '')}@aurikex.local`,
        role: 'student',
        account_status: 'active', // So voucher users can log in immediately
        cbt_key: encryptFieldValue(plainKey), // AES encrypted
        cbt_key_hash: hash,
        passwordHash: 'cbt-voucher-locked-password',
      });

      keys.push(plainKey);
    }
    
    const chunkSize = 100;
    for (let i = 0; i < valuesToInsert.length; i += chunkSize) {
      await this.db.insert(schema.users).values(valuesToInsert.slice(i, i + chunkSize));
    }

    return keys;
  }

  async listBillingLogs(params: { page: number; limit: number }) {
    const totalQuery = await this.db.select({ value: count() }).from(schema.payment_logs);
    const total = totalQuery[0].value;
    const totalPages = Math.ceil(total / params.limit) || 1;
    const skip = (params.page - 1) * params.limit;

    const data = await this.db.select()
      .from(schema.payment_logs)
      .orderBy(desc(schema.payment_logs.verifiedAt))
      .limit(params.limit)
      .offset(skip);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
    };
  }
}

