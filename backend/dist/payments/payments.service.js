"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const drizzle_orm_1 = require("drizzle-orm");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const database_module_1 = require("../db/database.module");
const schema = __importStar(require("../db/schema"));
let PaymentsService = class PaymentsService {
    constructor(db) {
        this.db = db;
        this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
        this.planMappings = {
            'PLN_3pu5sd2pl33k7qw': 'plus',
            'PLN_yzw49g99ybur0c1': 'pro',
            'PLN_015edt1c8m9nnow': 'max',
        };
    }
    async verifyTransaction(userId, reference, planCode) {
        if (!this.paystackSecretKey) {
            console.error('[Payment] Paystack secret key is missing in configuration.');
            throw new common_1.InternalServerErrorException('Payment provider configuration is missing. Please contact support.');
        }
        if (!reference) {
            throw new common_1.BadRequestException('Transaction reference is required.');
        }
        const tier = this.planMappings[planCode];
        if (!tier) {
            throw new common_1.BadRequestException('Invalid plan code.');
        }
        const userList = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        const user = userList[0];
        if (!user) {
            throw new common_1.BadRequestException('User not found.');
        }
        const existingLogList = await this.db
            .select()
            .from(schema.payment_logs)
            .where((0, drizzle_orm_1.eq)(schema.payment_logs.reference, reference))
            .limit(1);
        const existingLog = existingLogList[0];
        if (existingLog) {
            if (existingLog.userId === userId) {
                console.log(`[Payment] Idempotent hit: reference ${reference} already verified for user ${userId}.`);
                return user;
            }
            else {
                throw new common_1.BadRequestException('This transaction reference has already been verified by a different account.');
            }
        }
        try {
            const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
                headers: {
                    Authorization: `Bearer ${this.paystackSecretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            const { status, data } = response.data;
            if (!status || !data || data.status !== 'success') {
                throw new common_1.BadRequestException('Transaction was not successful or could not be verified.');
            }
            let paystackPlanCode = null;
            if (data.plan) {
                if (typeof data.plan === 'string') {
                    paystackPlanCode = data.plan;
                }
                else if (typeof data.plan === 'object' && data.plan.plan_code) {
                    paystackPlanCode = data.plan.plan_code;
                }
            }
            if (paystackPlanCode !== planCode) {
                throw new common_1.BadRequestException('Transaction plan code does not match.');
            }
            if (data.customer?.email?.toLowerCase() !== user.email.toLowerCase()) {
                throw new common_1.BadRequestException('Transaction owner email mismatch. Please ensure you are logged into the correct account.');
            }
            const updateData = {
                subscription_tier: tier,
            };
            if (tier === 'max') {
                updateData.ai_messages_remaining = 100;
                updateData.ai_messages_last_reset = new Date();
            }
            await this.db.insert(schema.payment_logs).values({
                reference,
                userId,
                planCode,
                amount: data.amount,
                email: data.customer?.email?.toLowerCase() || user.email.toLowerCase(),
                verifiedAt: new Date(),
            }).returning();
            const updatedUserList = await this.db.update(schema.users).set(updateData).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).returning();
            const updatedUser = updatedUserList[0];
            console.log(`[Payment] Successfully upgraded user ${userId} to ${tier} tier.`);
            return updatedUser;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException || error instanceof common_1.InternalServerErrorException)
                throw error;
            console.error(`[Payment] Provider error for ref ${reference}:`, error.response?.data || error.message);
            throw new common_1.BadRequestException('Payment verification failed. Please try again or contact support.');
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map