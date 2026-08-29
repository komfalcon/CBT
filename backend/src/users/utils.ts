import { randomBytes, createCipheriv, createDecipheriv, randomInt } from 'crypto';

export const USER_ROLES = ['super_admin', 'admin', 'examiner', 'proctor', 'student'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = [
  'active',
  'locked',
  'suspended',
  'pending_verification',
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const SUBSCRIPTION_TIERS = ['free', 'plus', 'pro', 'max'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

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
  if (!plainValue) return plainValue;
  if (isEncryptedFormat(plainValue)) return plainValue;
  const key = getFieldEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainValue, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptFieldValue(encryptedValue?: string): string | undefined {
  if (!encryptedValue) return encryptedValue;
  if (!isEncryptedFormat(encryptedValue)) return encryptedValue;
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

export function generateCbtKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomInt(0, chars.length));
  }
  return `CBT-${code}`;
}
