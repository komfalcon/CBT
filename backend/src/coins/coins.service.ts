import { Injectable, ForbiddenException, NotFoundException, Inject, Logger } from '@nestjs/common';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const COIN_COST_PER_REQUEST = 5;
const MONTHLY_COIN_ALLOWANCE = 5000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class CoinsService {
  private readonly logger = new Logger(CoinsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  public async checkAndResetMonthlyCoins(userId: string) {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const lastReset = user.auri_coins_last_reset ? new Date(user.auri_coins_last_reset).getTime() : 0;
    const isResetDue = !lastReset || (now.getTime() - lastReset >= THIRTY_DAYS_MS);

    if (isResetDue) {
      this.logger.log(`Resetting monthly Auri Coins to 5,000 for user ${userId}`);
      const updatedBalance = MONTHLY_COIN_ALLOWANCE;
      const resetTime = now;

      await this.db
        .update(schema.users)
        .set({
          auri_coins_balance: updatedBalance,
          auri_coins_last_reset: resetTime,
          auri_coins_monthly_allowance: MONTHLY_COIN_ALLOWANCE,
        })
        .where(eq(schema.users.id, userId));

      try {
        await this.db.insert(schema.auriCoinLedger).values({
          id: randomUUID(),
          user_id: userId,
          app_id: 'system',
          feature_name: 'monthly_grant',
          amount: MONTHLY_COIN_ALLOWANCE,
          balance_after: updatedBalance,
          metadata: { note: 'Monthly 5,000 Auri Coins refresh' },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to log monthly coin grant to ledger: ${err.message}`);
      }

      return {
        ...user,
        auri_coins_balance: updatedBalance,
        auri_coins_last_reset: resetTime,
      };
    }

    return user;
  }

  public async findUserByEmail(email: string) {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim())).limit(1);
    return user;
  }

  public async getCoinsBalance(userId: string) {
    let targetId = userId;
    if (userId && userId.includes('@')) {
      const u = await this.findUserByEmail(userId);
      if (u) targetId = u.id;
    }
    const user = await this.checkAndResetMonthlyCoins(targetId);
    const balance = user.auri_coins_balance ?? MONTHLY_COIN_ALLOWANCE;
    const lastReset = user.auri_coins_last_reset ? new Date(user.auri_coins_last_reset) : new Date();
    const nextReset = new Date(lastReset.getTime() + THIRTY_DAYS_MS);

    return {
      balance,
      allowance: MONTHLY_COIN_ALLOWANCE,
      costPerRequest: COIN_COST_PER_REQUEST,
      lastResetDate: lastReset.toISOString(),
      nextResetDate: nextReset.toISOString(),
    };
  }

  public async deductCoins(
    userIdentifier: string,
    appId: string,
    featureName: string,
    amount: number = COIN_COST_PER_REQUEST,
    metadata?: any
  ) {
    let userId = userIdentifier;
    if (userIdentifier && userIdentifier.includes('@')) {
      const userObj = await this.findUserByEmail(userIdentifier);
      if (!userObj) {
        throw new NotFoundException(`User with email ${userIdentifier} not found`);
      }
      userId = userObj.id;
    }
    const user = await this.checkAndResetMonthlyCoins(userId);
    const currentBalance = user.auri_coins_balance ?? MONTHLY_COIN_ALLOWANCE;
    const lastReset = user.auri_coins_last_reset ? new Date(user.auri_coins_last_reset) : new Date();
    const nextResetDate = new Date(lastReset.getTime() + THIRTY_DAYS_MS).toISOString();

    if (currentBalance < amount) {
      throw new ForbiddenException({
        code: 'OUT_OF_COINS',
        message: 'You have used all 5,000 Auri Coins for this month.',
        currentBalance,
        requiredCoins: amount,
        nextResetDate,
      });
    }

    const newBalance = currentBalance - amount;

    await this.db
      .update(schema.users)
      .set({ auri_coins_balance: newBalance })
      .where(eq(schema.users.id, userId));

    try {
      await this.db.insert(schema.auriCoinLedger).values({
        id: randomUUID(),
        user_id: userId,
        app_id: appId,
        feature_name: featureName,
        amount: -amount,
        balance_after: newBalance,
        metadata: metadata || null,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to insert transaction into coin ledger: ${err.message}`);
    }

    return {
      remainingCoins: newBalance,
      deductedCoins: amount,
      nextResetDate,
    };
  }

  public async getCoinsHistory(userId: string, limit: number = 20) {
    await this.checkAndResetMonthlyCoins(userId);
    return this.db
      .select()
      .from(schema.auriCoinLedger)
      .where(eq(schema.auriCoinLedger.user_id, userId))
      .orderBy(desc(schema.auriCoinLedger.createdAt))
      .limit(limit);
  }
}
