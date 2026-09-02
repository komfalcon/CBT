const fs = require('fs');
let code = fs.readFileSync('C:/Users/DELL/AURIKREX/CBT/backend/src/questions/questions.service.ts', 'utf8');

code = code.replace(
  /import \{[\s\S]*?\} from '@nestjs\/common';\r?\nimport \{ InjectModel \} from '@nestjs\/mongoose';\r?\nimport \{ Model, FilterQuery \} from 'mongoose';/m,
  `import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';`
);

code = code.replace(
  /import \{ Question, QuestionDocument \} from '\.\/schemas\/question\.schema';/m,
  `import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, inArray, and, not, desc, asc, count, sum, or, gt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';`
);

code = code.replace(
  /const query: FilterQuery<QuestionDocument> = {};[\s\S]*?this\.questionModel\.countDocuments\(query\)\.exec\(\),\r?\n\s*\]\);/m,
  `const conditions = [];

    if (filters.subject) conditions.push(eq(schema.questions.subject, filters.subject));
    if (filters.topic) conditions.push(eq(schema.questions.topic, filters.topic));
    if (filters.subtopic) conditions.push(eq(schema.questions.subtopic, filters.subtopic));
    if (filters.status) conditions.push(eq(schema.questions.status, filters.status));
    if (filters.difficulty_level) conditions.push(eq(schema.questions.difficulty_level, filters.difficulty_level));
    if (filters.year_sourced) conditions.push(eq(schema.questions.year_sourced, filters.year_sourced));
    if (filters.bloom_level) conditions.push(eq(schema.questions.bloom_level, filters.bloom_level));
    if (filters.question_type) conditions.push(eq(schema.questions.question_type, filters.question_type));
    
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const sortBy = filters.sortBy ?? 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? asc : desc;

    const dbQuery = conditions.length ? and(...conditions) : undefined;
    
    const [data, totalRes] = await Promise.all([
      this.db.select().from(schema.questions).where(dbQuery).orderBy(sortOrder((schema.questions as any)[sortBy] || schema.questions.createdAt)).limit(limit).offset((page - 1) * limit),
      this.db.select({ count: count() }).from(schema.questions).where(dbQuery)
    ]);
    const total = totalRes[0].count;`
);

code = code.replace(
  /private sanitizeForStudents\(question: QuestionDocument \| \(Question & \{ \[key: string\]: unknown \}\)\) \{/m,
  `private sanitizeForStudents(question: any) {`
);
code = code.replace(
  /typeof \(question as QuestionDocument\)\.toObject === 'function'\r?\n\s*\? \(question as QuestionDocument\)\.toObject\(\)\r?\n\s*: question;/m,
  `question;`
);
code = code.replace(/patch\?: Partial<Question>/, 'patch?: any');

code = code.replace(
  /@InjectModel\(Question\.name\) private readonly questionModel: Model<QuestionDocument>,/,
  '@Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,'
);

// other cleanup
code = code.replace(/question\.options\.some/g, '(question.options as any[]).some');
code = code.replace(/question\.versions\.length/g, '(question.versions as any[]).length');
code = code.replace(/question\.versions\.find/g, '(question.versions as any[]).find');

fs.writeFileSync('C:/Users/DELL/AURIKREX/CBT/backend/src/questions/questions.service.ts', code);
