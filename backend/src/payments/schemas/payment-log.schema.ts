import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentLogDocument = HydratedDocument<PaymentLog>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PaymentLog {
  @Prop({ required: true, unique: true, index: true })
  reference!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  planCode!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  email!: string;

  @Prop({ default: Date.now })
  verifiedAt!: Date;
}

export const PaymentLogSchema = SchemaFactory.createForClass(PaymentLog);
