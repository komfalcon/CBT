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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path = __importStar(require("path"));
const sync_1 = require("csv-parse/sync");
const exceljs_1 = __importDefault(require("exceljs"));
const ioredis_1 = __importDefault(require("ioredis"));
const uuid_1 = require("uuid");
const questions_service_1 = require("../questions.service");
const question_types_1 = require("../types/question.types");
let ImportService = ImportService_1 = class ImportService {
    constructor(configService, questionsService) {
        this.configService = configService;
        this.questionsService = questionsService;
        this.logger = new common_1.Logger(ImportService_1.name);
        this.inMemoryStore = new Map();
    }
    getRedisClient() {
        const redisUrl = this.configService.get('REDIS_URL');
        if (!redisUrl) {
            return null;
        }
        return new ioredis_1.default(redisUrl, {
            lazyConnect: true,
            connectTimeout: 2000,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            retryStrategy: () => null,
        });
    }
    async setImportData(data) {
        const client = this.getRedisClient();
        const key = `import:${data.importId}`;
        if (!client) {
            this.inMemoryStore.set(key, data);
            return;
        }
        client.on('error', () => undefined);
        try {
            await client.connect();
            await client.set(key, JSON.stringify(data), 'EX', 60 * 60 * 6);
        }
        catch {
            this.inMemoryStore.set(key, data);
        }
        finally {
            await client.quit().catch(() => client.disconnect());
        }
    }
    async getImportData(importId) {
        const client = this.getRedisClient();
        const key = `import:${importId}`;
        if (!client) {
            return this.inMemoryStore.get(key) ?? null;
        }
        client.on('error', () => undefined);
        try {
            await client.connect();
            const value = await client.get(key);
            if (!value) {
                return this.inMemoryStore.get(key) ?? null;
            }
            return JSON.parse(value);
        }
        catch {
            return this.inMemoryStore.get(key) ?? null;
        }
        finally {
            await client.quit().catch(() => client.disconnect());
        }
    }
    async parseCsv(content) {
        return (0, sync_1.parse)(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
    }
    async parseExcel(content) {
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.load(content);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return [];
        }
        const headerRow = worksheet.getRow(1);
        const rawValues = Array.isArray(headerRow.values) ? headerRow.values : [];
        const headers = rawValues
            .filter((value) => typeof value === 'string')
            .map((value) => String(value).trim());
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                return;
            }
            const data = {};
            headers.forEach((header, index) => {
                const cellValue = row.getCell(index + 1).value;
                data[header] = cellValue ? String(cellValue).trim() : '';
            });
            if (Object.values(data).some(Boolean)) {
                rows.push(data);
            }
        });
        return rows;
    }
    async uploadAndParse(file) {
        if (!file) {
            throw new common_1.BadRequestException('file is required');
        }
        const extension = path.extname(file.originalname).toLowerCase();
        if (!['.csv', '.xlsx', '.xls'].includes(extension)) {
            throw new common_1.BadRequestException('Unsupported file type');
        }
        const rows = extension === '.csv' ? await this.parseCsv(file.buffer) : await this.parseExcel(file.buffer);
        if (rows.length === 0) {
            throw new common_1.BadRequestException('No data rows detected in import file');
        }
        const columns = Object.keys(rows[0] ?? {});
        const importId = (0, uuid_1.v4)();
        const data = {
            importId,
            columns,
            rows,
            createdAt: new Date().toISOString(),
        };
        await this.setImportData(data);
        return {
            importId,
            columns,
            preview: rows.slice(0, 5),
            totalRows: rows.length,
        };
    }
    async getPreview(importId) {
        const data = await this.getImportData(importId);
        if (!data) {
            throw new common_1.NotFoundException('Import data not found or expired');
        }
        return {
            importId: data.importId,
            columns: data.columns,
            preview: data.rows.slice(0, 5),
            totalRows: data.rows.length,
        };
    }
    mapRow(row, mapping) {
        const read = (target) => {
            const sourceKey = mapping[target] ?? target;
            return String(row[sourceKey] ?? '').trim();
        };
        const subject = read('subject').toLowerCase().replace(/\s+/g, '_');
        if (!question_types_1.QUESTION_SUBJECTS.includes(subject)) {
            throw new common_1.BadRequestException(`Invalid subject value: ${subject}`);
        }
        const options = [
            { id: 'A', text: read('option_a') },
            { id: 'B', text: read('option_b') },
            { id: 'C', text: read('option_c') },
            { id: 'D', text: read('option_d') },
        ];
        const optionE = read('option_e');
        if (optionE) {
            options.push({ id: 'E', text: optionE });
        }
        const tags = read('tags')
            .split(/;|,/)
            .map((entry) => entry.trim())
            .filter(Boolean);
        const bloomValue = read('bloom_level');
        const bloomLevel = bloomValue
            ? (['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].includes(bloomValue)
                ? bloomValue
                : undefined)
            : undefined;
        return {
            subject: subject,
            topic: read('topic') || 'General',
            subtopic: read('subtopic') || undefined,
            year_sourced: read('year_sourced') ? Number(read('year_sourced')) : undefined,
            question_text: read('question_text'),
            options,
            correct_option: read('correct_option').toUpperCase(),
            explanation: read('explanation') || undefined,
            question_type: (read('question_type') || 'mcq_single'),
            difficulty_level: read('difficulty_level') ? Number(read('difficulty_level')) : 3,
            bloom_level: bloomLevel,
            estimated_solve_time_seconds: read('estimated_solve_time_seconds')
                ? Number(read('estimated_solve_time_seconds'))
                : 60,
            tags,
        };
    }
    async commitImport(dto, actorUserId) {
        const data = await this.getImportData(dto.importId);
        if (!data) {
            throw new common_1.NotFoundException('Import data not found or expired');
        }
        const requiredColumns = [
            'question_text',
            'option_a',
            'option_b',
            'option_c',
            'option_d',
            'correct_option',
            'subject',
        ];
        for (const column of requiredColumns) {
            const source = dto.columnMapping?.[column] ?? column;
            if (!data.columns.includes(source)) {
                throw new common_1.BadRequestException(`Missing required column mapping for ${column}`);
            }
        }
        const importBatchId = (0, uuid_1.v4)();
        let createdCount = 0;
        let failedCount = 0;
        const errors = [];
        for (let index = 0; index < data.rows.length; index += 1) {
            const row = data.rows[index];
            const mapped = this.mapRow(row, dto.columnMapping ?? {});
            try {
                await this.questionsService.createQuestion(mapped, { sub: actorUserId, role: 'admin' }, { source: 'import', importBatchId });
                createdCount += 1;
            }
            catch (error) {
                failedCount += 1;
                const message = error instanceof Error ? error.message : 'Unknown error';
                errors.push({ row: index + 2, message });
            }
        }
        this.logger.log(`Import ${dto.importId} committed. created=${createdCount}, failed=${failedCount}, batch=${importBatchId}`);
        return {
            importId: dto.importId,
            importBatchId,
            createdCount,
            failedCount,
            errors,
        };
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = ImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        questions_service_1.QuestionsService])
], ImportService);
//# sourceMappingURL=import.service.js.map