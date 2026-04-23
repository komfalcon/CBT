import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export const USER_ROLES = ['super_admin', 'admin', 'examiner', 'proctor', 'student'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = [
  'active',
  'locked',
  'suspended',
  'pending_verification',
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

@Schema({ _id: false })
export class AccessibilityPreferences {
  @Prop()
  fontSize?: string;

  @Prop({ default: false })
  highContrast?: boolean;

  @Prop({ default: false })
  reducedMotion?: boolean;

  @Prop({ default: false })
  screenReader?: boolean;
}

const AccessibilityPreferencesSchema = SchemaFactory.createForClass(AccessibilityPreferences);

function getFieldEncryptionKey(): Buffer {
  const keyHex = process.env.FIELD_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('FIELD_ENCRYPTION_KEY must be a 32-byte hex string');
  }

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must decode to 32 bytes');
  }

  return key;
}

function isEncryptedFormat(value: string): boolean {
  const parts = value.split(':');
  return (
    parts.length === 3 &&
    parts.every((part) => /^[a-fA-F0-9]+$/.test(part)) &&
    parts[0].length === 24 &&
    parts[1].length === 32
  );
}

export function encryptFieldValue(plainValue: string): string {
  if (!plainValue) {
    return plainValue;
  }

  if (isEncryptedFormat(plainValue)) {
    return plainValue;
  }

  const key = getFieldEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainValue, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptFieldValue(encryptedValue?: string): string | undefined {
  if (!encryptedValue) {
    return encryptedValue;
  }

  if (!isEncryptedFormat(encryptedValue)) {
    return encryptedValue;
  }

  const [ivHex, authTagHex, ciphertextHex] = encryptedValue.split(':');
  const key = getFieldEncryptionKey();

  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { getters: true },
  toObject: { getters: true },
})
export class User {
  @Prop({ default: uuidv4, unique: true })
  userId!: string;

  @Prop({ unique: true, sparse: true })
  jamb_reg_no?: string;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: String, enum: USER_ROLES, default: 'student', index: true })
  role!: UserRole;

  @Prop({
    set: (value?: string) => (value ? encryptFieldValue(value) : value),
    get: (value?: string) => decryptFieldValue(value),
  })
  mfa_secret?: string;

  @Prop({ default: false })
  mfa_enabled!: boolean;

  @Prop()
  profile_photo_url?: string;

  @Prop()
  state?: string;

  @Prop()
  lga?: string;

  @Prop()
  school?: string;

  @Prop({ type: [String], default: [] })
  exam_subject_combination!: string[];

  @Prop({ type: AccessibilityPreferencesSchema, default: {} })
  accessibility_preferences?: AccessibilityPreferences;

  @Prop({ type: String, enum: ACCOUNT_STATUSES, default: 'pending_verification', index: true })
  account_status!: AccountStatus;

  @Prop({ default: 0 })
  failed_login_attempts!: number;

  @Prop()
  lockout_until?: Date;

  @Prop({ type: [String], default: [] })
  device_fingerprints!: string[];

  @Prop()
  last_login?: Date;

  @Prop()
  last_login_ip?: string;

  @Prop({ default: 0 })
  xp_points!: number;

  @Prop({ default: 1 })
  level!: number;

  @Prop({ default: 0 })
  streak_count!: number;

  created_at!: Date;
  updated_at!: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ jamb_reg_no: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1, account_status: 1 });
UserSchema.index({ created_at: 1 });
