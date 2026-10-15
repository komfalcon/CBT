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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../db/database.module");
const schema = __importStar(require("../db/schema"));
const utils_1 = require("../users/utils");
let AdminService = class AdminService {
    constructor(db) {
        this.db = db;
        this.CACHE_TTL_MS = 5 * 60 * 1000;
    }
    async onModuleInit() {
        try {
            await this.db.execute((0, drizzle_orm_1.sql) `
        CREATE TABLE IF NOT EXISTS system_settings (
          key text PRIMARY KEY,
          value text NOT NULL,
          updated_by text,
          updated_at timestamp DEFAULT now()
        );
      `);
            const [existing] = await this.db.select().from(schema.system_settings).where((0, drizzle_orm_1.eq)(schema.system_settings.key, 'maintenance_mode')).limit(1);
            if (!existing) {
                await this.db.insert(schema.system_settings).values({
                    key: 'maintenance_mode',
                    value: 'false',
                });
            }
        }
        catch (err) {
            console.error('[ADMIN] Failed to initialize system_settings table:', err.message);
        }
    }
    async getOverviewStats() {
        const now = Date.now();
        if (this.statsCache && this.statsCache.expiresAt > now) {
            return this.statsCache.data;
        }
        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 3600 * 1000);
        const endOfYesterday = new Date(startOfToday.getTime() - 1);
        const totalVouchersQuery = await this.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema.users).where((0, drizzle_orm_1.like)(schema.users.email, '%@aurikrex.local'));
        const totalVouchers = totalVouchersQuery[0].value;
        const totalCandidatesQuery = await this.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema.users).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.users.role, 'student'), (0, drizzle_orm_1.not)((0, drizzle_orm_1.like)(schema.users.email, '%@aurikrex.local'))));
        const totalCandidates = totalCandidatesQuery[0].value;
        const activeSubscriptionsQuery = await this.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema.users).where((0, drizzle_orm_1.ne)(schema.users.subscription_tier, 'free'));
        const activeSubscriptions = activeSubscriptionsQuery[0].value;
        const totalCompletedExamsQuery = await this.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema.exam_sessions).where((0, drizzle_orm_1.eq)(schema.exam_sessions.status, 'completed'));
        const totalCompletedExams = totalCompletedExamsQuery[0].value;
        const examsTodayQuery = await this.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema.exam_sessions).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exam_sessions.status, 'completed'), (0, drizzle_orm_1.gte)(schema.exam_sessions.completedAt, startOfToday)));
        const examsToday = examsTodayQuery[0].value;
        const examsYesterdayQuery = await this.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema.exam_sessions).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exam_sessions.status, 'completed'), (0, drizzle_orm_1.gte)(schema.exam_sessions.completedAt, startOfYesterday), (0, drizzle_orm_1.lte)(schema.exam_sessions.completedAt, endOfYesterday)));
        const examsYesterday = examsYesterdayQuery[0].value;
        const billingAggregation = await this.db.select({ total: (0, drizzle_orm_1.sum)(schema.payment_logs.amount) }).from(schema.payment_logs);
        const totalRevenue = (Number(billingAggregation[0]?.total) || 0) / 100;
        const data = {
            candidates: {
                total: totalCandidates,
                vouchers: totalVouchers,
            },
            subscriptions: {
                active: activeSubscriptions,
            },
            exams: {
                total: totalCompletedExams,
                today: examsToday,
                yesterday: examsYesterday,
            },
            revenue: {
                total: totalRevenue,
            },
            generatedAt: new Date(),
        };
        this.statsCache = {
            data,
            expiresAt: now + this.CACHE_TTL_MS,
        };
        return data;
    }
    async listUsers(params) {
        const conditions = [];
        if (params.role)
            conditions.push((0, drizzle_orm_1.eq)(schema.users.role, params.role));
        if (params.status)
            conditions.push((0, drizzle_orm_1.eq)(schema.users.account_status, params.status));
        if (params.search) {
            const searchStr = `%${params.search.trim()}%`;
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema.users.fullName, searchStr), (0, drizzle_orm_1.like)(schema.users.email, searchStr)));
        }
        const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const totalQuery = await this.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema.users).where(whereClause);
        const total = totalQuery[0].value;
        const totalPages = Math.ceil(total / params.limit) || 1;
        const skip = (params.page - 1) * params.limit;
        const data = await this.db.select()
            .from(schema.users)
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema.users.createdAt))
            .limit(params.limit)
            .offset(skip);
        return {
            data,
            total,
            page: params.page,
            limit: params.limit,
            totalPages,
        };
    }
    async updateUserStatus(userId, status) {
        const validStatuses = ['active', 'locked', 'suspended', 'pending_verification'];
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException('Invalid account status value.');
        }
        const user = await this.db.update(schema.users)
            .set({ account_status: status })
            .where((0, drizzle_orm_1.eq)(schema.users.id, userId))
            .returning();
        if (!user || user.length === 0) {
            throw new common_1.BadRequestException('User not found.');
        }
        return user[0];
    }
    async generateBulkKeys(countToGenerate) {
        if (countToGenerate < 1 || countToGenerate > 1000) {
            throw new common_1.BadRequestException('Batch size must be between 1 and 1000.');
        }
        const keys = [];
        const valuesToInsert = [];
        for (let i = 0; i < countToGenerate; i++) {
            const plainKey = (0, utils_1.generateCbtKey)();
            const hash = (0, crypto_1.createHash)('sha256').update(plainKey).digest('hex');
            valuesToInsert.push({
                id: (0, crypto_1.randomUUID)(),
                fullName: 'CBT Voucher Account',
                email: `voucher-${plainKey.toLowerCase().replace(/-/g, '')}@aurikrex.local`,
                role: 'student',
                account_status: 'active',
                cbt_key: (0, utils_1.encryptFieldValue)(plainKey),
                cbt_key_hash: hash,
                passwordHash: 'cbt-voucher-locked-password',
            });
            keys.push(plainKey);
        }
        const chunkSize = 100;
        for (let i = 0; i < valuesToInsert.length; i += chunkSize) {
            await this.db.insert(schema.users).values(valuesToInsert.slice(i, i + chunkSize));
        }
        return keys;
    }
    async listBillingLogs(params) {
        const totalQuery = await this.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema.payment_logs);
        const total = totalQuery[0].value;
        const totalPages = Math.ceil(total / params.limit) || 1;
        const skip = (params.page - 1) * params.limit;
        const data = await this.db.select()
            .from(schema.payment_logs)
            .orderBy((0, drizzle_orm_1.desc)(schema.payment_logs.verifiedAt))
            .limit(params.limit)
            .offset(skip);
        return {
            data,
            total,
            page: params.page,
            limit: params.limit,
            totalPages,
        };
    }
    async getMaintenanceStatus() {
        const now = Date.now();
        if (this.maintenanceCache && this.maintenanceCache.expiresAt > now) {
            return this.maintenanceCache;
        }
        try {
            const [setting] = await this.db.select().from(schema.system_settings).where((0, drizzle_orm_1.eq)(schema.system_settings.key, 'maintenance_mode')).limit(1);
            const data = {
                isMaintenance: setting?.value === 'true',
                updatedAt: setting?.updatedAt || null,
                updatedBy: setting?.updated_by || null,
                expiresAt: now + 5000,
            };
            this.maintenanceCache = data;
            return data;
        }
        catch {
            return { isMaintenance: false };
        }
    }
    async toggleMaintenance(adminUserId, password, requestedState) {
        const REQUIRED_PASSWORD = process.env.ADMIN_MAINTENANCE_PASSWORD || 'KorexTonyFalconStark1025$';
        if (password && password !== REQUIRED_PASSWORD) {
            throw new common_1.UnauthorizedException('Invalid maintenance authorization password. Case-sensitive verification failed.');
        }
        const current = await this.getMaintenanceStatus();
        const nextState = requestedState !== undefined ? requestedState : !current.isMaintenance;
        await this.db.insert(schema.system_settings)
            .values({
            key: 'maintenance_mode',
            value: nextState ? 'true' : 'false',
            updated_by: adminUserId,
            updatedAt: new Date(),
        })
            .onConflictDoUpdate({
            target: schema.system_settings.key,
            set: {
                value: nextState ? 'true' : 'false',
                updated_by: adminUserId,
                updatedAt: new Date(),
            },
        });
        this.maintenanceCache = undefined;
        return {
            success: true,
            isMaintenance: nextState,
            message: nextState
                ? 'Platform is now locked in Under Development mode. All non-admin routes are locked.'
                : 'Platform has been released. The entire platform is now live for all candidates.',
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase])
], AdminService);
//# sourceMappingURL=admin.service.js.map