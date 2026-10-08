"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = exports.User = exports.AccessibilityPreferences = exports.SUBSCRIPTION_TIERS = exports.ACCOUNT_STATUSES = exports.USER_ROLES = void 0;
exports.encryptFieldValue = encryptFieldValue;
exports.decryptFieldValue = decryptFieldValue;
exports.generateCbtKey = generateCbtKey;
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
exports.USER_ROLES = ['super_admin', 'admin', 'examiner', 'proctor', 'student'];
exports.ACCOUNT_STATUSES = [
    'active',
    'locked',
    'suspended',
    'pending_verification',
];
exports.SUBSCRIPTION_TIERS = ['free', 'plus', 'pro', 'max'];
let AccessibilityPreferences = class AccessibilityPreferences {
};
exports.AccessibilityPreferences = AccessibilityPreferences;
__decorate([
    Prop(),
    __metadata("design:type", String)
], AccessibilityPreferences.prototype, "fontSize", void 0);
__decorate([
    Prop({ default: false }),
    __metadata("design:type", Boolean)
], AccessibilityPreferences.prototype, "highContrast", void 0);
__decorate([
    Prop({ default: false }),
    __metadata("design:type", Boolean)
], AccessibilityPreferences.prototype, "reducedMotion", void 0);
__decorate([
    Prop({ default: false }),
    __metadata("design:type", Boolean)
], AccessibilityPreferences.prototype, "screenReader", void 0);
exports.AccessibilityPreferences = AccessibilityPreferences = __decorate([
    Schema({ _id: false })
], AccessibilityPreferences);
const AccessibilityPreferencesSchema = SchemaFactory.createForClass(AccessibilityPreferences);
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
    if (!plainValue) {
        return plainValue;
    }
    if (isEncryptedFormat(plainValue)) {
        return plainValue;
    }
    const key = getFieldEncryptionKey();
    const iv = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plainValue, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}
function decryptFieldValue(encryptedValue) {
    if (!encryptedValue) {
        return encryptedValue;
    }
    if (!isEncryptedFormat(encryptedValue)) {
        return encryptedValue;
    }
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
let User = class User {
};
exports.User = User;
__decorate([
    Prop({ default: uuid_1.v4, unique: true }),
    __metadata("design:type", String)
], User.prototype, "userId", void 0);
__decorate([
    Prop({
        unique: true,
        sparse: true,
        set: (value) => (value ? encryptFieldValue(value) : undefined),
        get: (value) => decryptFieldValue(value),
    }),
    __metadata("design:type", String)
], User.prototype, "cbt_key", void 0);
__decorate([
    Prop({ unique: true, index: true, sparse: true, immutable: true }),
    __metadata("design:type", String)
], User.prototype, "cbt_key_hash", void 0);
__decorate([
    Prop({ unique: true, sparse: true }),
    __metadata("design:type", String)
], User.prototype, "jamb_reg_no", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    Prop({ required: true, unique: true, lowercase: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    Prop({ type: String, enum: exports.USER_ROLES, default: 'student', index: true }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    Prop({
        set: (value) => (value ? encryptFieldValue(value) : undefined),
        get: (value) => decryptFieldValue(value),
    }),
    __metadata("design:type", String)
], User.prototype, "mfa_secret", void 0);
__decorate([
    Prop({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "mfa_enabled", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], User.prototype, "profile_photo_url", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], User.prototype, "verification_code", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], User.prototype, "verification_code_expires", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], User.prototype, "password_reset_code", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], User.prototype, "password_reset_expires", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], User.prototype, "state", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], User.prototype, "lga", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], User.prototype, "school", void 0);
__decorate([
    Prop({ type: [String], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "exam_subject_combination", void 0);
__decorate([
    Prop({ type: AccessibilityPreferencesSchema, default: {} }),
    __metadata("design:type", AccessibilityPreferences)
], User.prototype, "accessibility_preferences", void 0);
__decorate([
    Prop({ type: String, enum: exports.ACCOUNT_STATUSES, default: 'pending_verification', index: true }),
    __metadata("design:type", String)
], User.prototype, "account_status", void 0);
__decorate([
    Prop({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "failed_login_attempts", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], User.prototype, "lockout_until", void 0);
__decorate([
    Prop({ type: [String], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "device_fingerprints", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], User.prototype, "last_login", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], User.prototype, "last_login_ip", void 0);
__decorate([
    Prop({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "xp_points", void 0);
__decorate([
    Prop({ default: 1 }),
    __metadata("design:type", Number)
], User.prototype, "level", void 0);
__decorate([
    Prop({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "streak_count", void 0);
__decorate([
    Prop({ type: String, enum: exports.SUBSCRIPTION_TIERS, default: 'max', index: true }),
    __metadata("design:type", String)
], User.prototype, "subscription_tier", void 0);
__decorate([
    Prop({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "ai_messages_remaining", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], User.prototype, "ai_messages_last_reset", void 0);
exports.User = User = __decorate([
    Schema({
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        toJSON: { getters: true },
        toObject: { getters: true },
    })
], User);
exports.UserSchema = SchemaFactory.createForClass(User);
exports.UserSchema.index({ role: 1, account_status: 1 });
exports.UserSchema.index({ created_at: 1 });
//# sourceMappingURL=user.schema.js.map