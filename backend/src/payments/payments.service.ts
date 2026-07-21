import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PaymentLog, PaymentLogDocument } from './schemas/payment-log.schema';
import axios from 'axios';

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
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(PaymentLog.name) private readonly paymentLogModel: Model<PaymentLogDocument>,
  ) {}

  async verifyTransaction(userId: string, reference: string, planCode: string): Promise<UserDocument> {
    if (!this.paystackSecretKey) {
      throw new InternalServerErrorException('Paystack secret key is not configured on the server.');
    }

    if (!reference) {
      throw new BadRequestException('Transaction reference is required.');
    }

    const tier = this.planMappings[planCode];
    if (!tier) {
      throw new BadRequestException('Invalid plan code.');
    }

    // 1. Prevent Replay Attack / Double-spending
    const existingLog = await this.paymentLogModel.findOne({ reference }).exec();
    if (existingLog) {
      throw new BadRequestException('This transaction reference has already been verified.');
    }

    console.log(`Verifying transaction: reference=${reference}, planCode=${planCode}, tier=${tier}`);

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

      // Update the user's subscription tier in the database
      const user = await this.userModel.findOne({ userId }).exec();
      if (!user) {
        throw new BadRequestException('User not found.');
      }

      // 2. Prevent Ownership Bypass: Check email matches
      if (data.customer?.email?.toLowerCase() !== user.email.toLowerCase()) {
        throw new BadRequestException('Transaction owner email mismatch.');
      }

      user.subscription_tier = tier as any;
      
      // If upgrading to max, reset AI messages to a default value (e.g. 50 or 100)
      if (tier === 'max') {
        user.ai_messages_remaining = 100;
        user.ai_messages_last_reset = new Date();
      }

      // 3. Log the verified reference
      await this.paymentLogModel.create({
        reference,
        userId,
        planCode,
        amount: data.amount,
        email: data.customer?.email?.toLowerCase() || user.email.toLowerCase(),
        verifiedAt: new Date(),
      });

      await user.save();
      console.log(`Successfully upgraded user ${userId} to ${tier} tier.`);
      return user;
    } catch (error: any) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      const errMsg = error.response?.data?.message || error.message;
      throw new InternalServerErrorException(`Payment verification failed: ${errMsg}`);
    }
  }
}
