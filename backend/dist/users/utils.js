"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_TIERS = exports.ACCOUNT_STATUSES = exports.USER_ROLES = void 0;
exports.encryptFieldValue = encryptFieldValue;
exports.decryptFieldValue = decryptFieldValue;
exports.generateCbtKey = generateCbtKey;
exports.generateAurikrexId = generateAurikrexId;
const crypto_1 = require("crypto");
exports.USER_ROLES = ['super_admin', 'admin', 'examiner', 'proctor', 'student'];
exports.ACCOUNT_STATUSES = [
    'active',
    'locked',
    'suspended',
    'pending_verification',
];
exports.SUBSCRIPTION_TIERS = ['free', 'plus', 'pro', 'max'];
function getFieldEncryptionKey() {
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
function isEncryptedFormat(value) {
    const parts = value.split(':');
    return (parts.length === 3 &&
        parts.every((part) => /^[a-fA-F0-9]+$/.test(part)) &&
        parts[0].length === 24 &&
        parts[1].length === 32);
}
function encryptFieldValue(plainValue) {
    if (!plainValue)
        return plainValue;
    if (isEncryptedFormat(plainValue))
        return plainValue;
    const key = getFieldEncryptionKey();
    const iv = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plainValue, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}
function decryptFieldValue(encryptedValue) {
    if (!encryptedValue)
        return encryptedValue;
    if (!isEncryptedFormat(encryptedValue))
        return encryptedValue;
    const [ivHex, authTagHex, ciphertextHex] = encryptedValue.split(':');
    const key = getFieldEncryptionKey();
    const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(ciphertextHex, 'hex')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}
function generateCbtKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt((0, crypto_1.randomInt)(0, chars.length));
    }
    return `CBT-${code}`;
}
function generateAurikrexId() {
    const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let code = '';
    for (let i = 0; i < 20; i++) {
        code += chars.charAt((0, crypto_1.randomInt)(0, chars.length));
    }
    return `ax_${code}`;
}
//# sourceMappingURL=utils.js.map