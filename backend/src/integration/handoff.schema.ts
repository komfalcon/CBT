import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HandoffDocument = HydratedDocument<Handoff>;

@Schema({ timestamps: true, collection: 'integration_handoffs' })
export class Handoff {
  @Prop({ required: true, unique: true, index: true })
  jti!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  audience!: string;

  @Prop({ required: true })
  scope!: string[];

  @Prop({ required: true })
  returnUrl!: string;

  @Prop({ required: true })
  nextPath!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  exchanged!: boolean;

  @Prop({ required: true })
  state!: string;
}

export const HandoffSchema = SchemaFactory.createForClass(Handoff);
HandoffSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
