import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, generateCbtKey } from '../users/schemas/user.schema';
import { ExamSession, ExamSessionDocument } from '../exam/schemas/session.schema';
import { PaymentLog, PaymentLogDocument } from '../payments/schemas/payment-log.schema';
import { createHash } from 'crypto';

@Injectable()
export class AdminService {
  private statsCache?: {
    data: any;
    expiresAt: number;
  };
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(ExamSession.name) private readonly sessionModel: Model<ExamSessionDocument>,
    @InjectModel(PaymentLog.name) private readonly paymentLogModel: Model<PaymentLogDocument>,
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
    const totalVouchers = await this.userModel.countDocuments({
      email: /@aurikex\.local$/i,
    }).exec();

    // 2. Total Registered Candidates (students with real emails)
    const totalCandidates = await this.userModel.countDocuments({
      role: 'student',
      email: { $not: /@aurikex\.local$/i },
    }).exec();

    // 3. Subscriptions breakdown
    const activeSubscriptions = await this.userModel.countDocuments({
      subscription_tier: { $ne: 'free' },
    }).exec();

    // 4. Completed mock exams stats
    const totalCompletedExams = await this.sessionModel.countDocuments({
      status: 'completed',
    }).exec();

    const examsToday = await this.sessionModel.countDocuments({
      status: 'completed',
      completedAt: { $gte: startOfToday },
    }).exec();

    const examsYesterday = await this.sessionModel.countDocuments({
      status: 'completed',
      completedAt: { $gte: startOfYesterday, $lte: endOfYesterday },
    }).exec();

    // 5. Total Revenue from PaymentLogs
    const billingAggregation = await this.paymentLogModel.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).exec();
    const totalRevenue = (billingAggregation[0]?.total || 0) / 100; // Divide by 100 to convert from kobo/cents

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
    const query: Record<string, any> = {};

    if (params.role) {
      query.role = params.role;
    }
    if (params.status) {
      query.account_status = params.status;
    }

    if (params.search) {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
      ];
    }

    const total = await this.userModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / params.limit) || 1;
    const skip = (params.page - 1) * params.limit;

    const data = await this.userModel
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(params.limit)
      .exec();

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

    const user = await this.userModel.findOneAndUpdate(
      { userId },
      { $set: { account_status: status } },
      { new: true },
    ).exec();

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return user;
  }

  async generateBulkKeys(count: number): Promise<string[]> {
    if (count < 1 || count > 1000) {
      throw new BadRequestException('Batch size must be between 1 and 1000.');
    }

    const keys: string[] = [];

    // Create keys inside a loop
    for (let i = 0; i < count; i++) {
      const plainKey = generateCbtKey();
      const hash = createHash('sha256').update(plainKey).digest('hex');

      await this.userModel.create({
        fullName: 'CBT Voucher Account',
        email: `voucher-${plainKey.toLowerCase().replace(/-/g, '')}@aurikex.local`,
        role: 'student',
        account_status: 'active', // So voucher users can log in immediately
        cbt_key: plainKey, // AES encrypted
        cbt_key_hash: hash,
        passwordHash: 'cbt-voucher-locked-password',
      });

      keys.push(plainKey);
    }

    return keys;
  }

  async listBillingLogs(params: { page: number; limit: number }) {
    const total = await this.paymentLogModel.countDocuments().exec();
    const totalPages = Math.ceil(total / params.limit) || 1;
    const skip = (params.page - 1) * params.limit;

    const data = await this.paymentLogModel
      .find()
      .sort({ verifiedAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .exec();

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
    };
  }
}
