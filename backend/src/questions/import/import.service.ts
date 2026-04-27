import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { ImportQuestionsDto } from '../dto/import-questions.dto';
import { QuestionsService } from '../questions.service';

type ParsedImport = {
  importId: string;
  columns: string[];
  rows: Record<string, string>[];
  createdAt: string;
};

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private readonly inMemoryStore = new Map<string, ParsedImport>();

  constructor(
    private readonly configService: ConfigService,
    private readonly questionsService: QuestionsService,
  ) {}

  private getRedisClient() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return null;
    }

    return new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
  }

  private async setImportData(data: ParsedImport): Promise<void> {
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
    } catch {
      this.inMemoryStore.set(key, data);
    } finally {
      await client.quit().catch(() => client.disconnect());
    }
  }

  private async getImportData(importId: string): Promise<ParsedImport | null> {
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
      return JSON.parse(value) as ParsedImport;
    } catch {
      return this.inMemoryStore.get(key) ?? null;
    } finally {
      await client.quit().catch(() => client.disconnect());
    }
  }

  private async parseCsv(content: Buffer): Promise<Record<string, string>[]> {
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  }

  private async parseExcel(content: Buffer): Promise<Record<string, string>[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(content);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return [];
    }

    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values
      .filter((value) => typeof value === 'string')
      .map((value) => String(value).trim());

    const rows: Record<string, string>[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      const data: Record<string, string> = {};
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

  async uploadAndParse(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const extension = path.extname(file.originalname).toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(extension)) {
      throw new BadRequestException('Unsupported file type');
    }

    const rows = extension === '.csv' ? await this.parseCsv(file.buffer) : await this.parseExcel(file.buffer);

    if (rows.length === 0) {
      throw new BadRequestException('No data rows detected in import file');
    }

    const columns = Object.keys(rows[0] ?? {});
    const importId = uuidv4();
    const data: ParsedImport = {
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

  async getPreview(importId: string) {
    const data = await this.getImportData(importId);
    if (!data) {
      throw new NotFoundException('Import data not found or expired');
    }

    return {
      importId: data.importId,
      columns: data.columns,
      preview: data.rows.slice(0, 5),
      totalRows: data.rows.length,
    };
  }

  private mapRow(row: Record<string, string>, mapping: Record<string, string>) {
    const read = (target: string): string => {
      const sourceKey = mapping[target] ?? target;
      return String(row[sourceKey] ?? '').trim();
    };

    const subject = read('subject').toLowerCase().replace(/\s+/g, '_');
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

    return {
      subject,
      topic: read('topic') || 'General',
      subtopic: read('subtopic') || undefined,
      year_sourced: read('year_sourced') ? Number(read('year_sourced')) : undefined,
      question_text: read('question_text'),
      options,
      correct_option: read('correct_option').toUpperCase(),
      explanation: read('explanation') || undefined,
      question_type: read('question_type') || 'mcq_single',
      difficulty_level: read('difficulty_level') ? Number(read('difficulty_level')) : 3,
      bloom_level: read('bloom_level') || undefined,
      estimated_solve_time_seconds: read('estimated_solve_time_seconds')
        ? Number(read('estimated_solve_time_seconds'))
        : 60,
      tags,
    };
  }

  async commitImport(dto: ImportQuestionsDto, actorUserId: string) {
    const data = await this.getImportData(dto.importId);
    if (!data) {
      throw new NotFoundException('Import data not found or expired');
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
        throw new BadRequestException(`Missing required column mapping for ${column}`);
      }
    }

    const importBatchId = uuidv4();
    let createdCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let index = 0; index < data.rows.length; index += 1) {
      const row = data.rows[index];
      const mapped = this.mapRow(row, dto.columnMapping ?? {});
      try {
        await this.questionsService.createQuestion(
          mapped,
          { sub: actorUserId, role: 'admin' },
          { source: 'import', importBatchId },
        );
        createdCount += 1;
      } catch (error) {
        failedCount += 1;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ row: index + 2, message });
      }
    }

    this.logger.log(
      `Import ${dto.importId} committed. created=${createdCount}, failed=${failedCount}, batch=${importBatchId}`,
    );

    return {
      importId: dto.importId,
      importBatchId,
      createdCount,
      failedCount,
      errors,
    };
  }
}
