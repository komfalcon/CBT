import { Injectable, BadRequestException, InternalServerErrorException, Inject } from '@nestjs/common';
import axios from 'axios';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';

@Injectable()
export class PaymentsService {
  private readonly paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

  // Map Paystack plan codes to subscription tiers
  private readonly planMappings: Record<string, string> = {
    'PLN_3pu5sd2pl33k7qw': 'plus',
    'PLN_yzw49g99ybur0c1': 'pro',
    'PLN_015edt1c8m9nnow': 'max',
  };

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async verifyTransaction(userId: string, reference: string, planCode: string): Promise<any> {
    if (!this.paystackSecretKey) {
      console.error('[Payment] Paystack secret key is missing in configuration.');
      throw new InternalServerErrorException('Payment provider configuration is missing. Please contact support.');
    }

    if (!reference) {
      throw new BadRequestException('Transaction reference is required.');
    }

    const tier = this.planMappings[planCode];
    if (!tier) {
      throw new BadRequestException('Invalid plan code.');
    }

    const userList = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    const user = userList[0];
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // 1. Idempotent processing: if this reference was already verified for this user, just return success.
    const existingLogList = await this.db
      .select()
      .from(schema.payment_logs)
      .where(eq(schema.payment_logs.reference, reference))
      .limit(1);
    const existingLog = existingLogList[0];

    if (existingLog) {
      if (existingLog.userId === userId) {
        console.log(`[Payment] Idempotent hit: reference ${reference} already verified for user ${userId}.`);
        return user;
      } else {
        throw new BadRequestException('This transaction reference has already been verified by a different account.');
      }
    }

    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const { status, data } = response.data;

      if (!status || !data || data.status !== 'success') {
        throw new BadRequestException('Transaction was not successful or could not be verified.');
      }

      // Verify the plan code in the Paystack transaction matches the requested one
      let paystackPlanCode: string | null = null;
      if (data.plan) {
        if (typeof data.plan === 'string') {
          paystackPlanCode = data.plan;
        } else if (typeof data.plan === 'object' && data.plan.plan_code) {
          paystackPlanCode = data.plan.plan_code;
        }
      }

      if (paystackPlanCode !== planCode) {
        throw new BadRequestException('Transaction plan code does not match.');
      }

      // 2. Prevent Ownership Bypass: Check email matches
      if (data.customer?.email?.toLowerCase() !== user.email.toLowerCase()) {
        throw new BadRequestException('Transaction owner email mismatch. Please ensure you are logged into the correct account.');
      }

      const updateData: any = {
        subscription_tier: tier,
      };

      // If upgrading to max, reset AI messages to a default value (e.g. 50 or 100)
      if (tier === 'max') {
        updateData.ai_messages_remaining = 100;
        updateData.ai_messages_last_reset = new Date();
      }

      // 3. Log the verified reference
      await this.db.insert(schema.payment_logs).values({
        reference,
        userId,
        planCode,
        amount: data.amount,
        email: data.customer?.email?.toLowerCase() || user.email.toLowerCase(),
        verifiedAt: new Date(),
      }).returning();

      const updatedUserList = await this.db.update(schema.users).set(updateData).where(eq(schema.users.id, userId)).returning();
      const updatedUser = updatedUserList[0];

      console.log(`[Payment] Successfully upgraded user ${userId} to ${tier} tier.`);
      return updatedUser;
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) throw error;
      
      // Preserve provider error codes in server logs without exposing secrets to the client
      console.error(`[Payment] Provider error for ref ${reference}:`, error.response?.data || error.message);
      
      throw new BadRequestException('Payment verification failed. Please try again or contact support.');
    }
  }
}
