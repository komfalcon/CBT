const fs = require('fs');
let code = fs.readFileSync('C:/Users/DELL/AURIKEX/CBT/backend/src/questions/questions.service.ts', 'utf8');

// Replace constructor
code = code.replace(
  /@InjectModel\(Question\.name\) private readonly questionModel: Model<QuestionDocument>,/,
  '@Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,'
);

// runDuplicateCheck
code = code.replace(
  /const filter: FilterQuery<QuestionDocument> = {[\s\S]*?const corpus = candidates\.map\(\(entry\) => entry\.question_text\);/m,
  `const conditions = [
      eq(schema.questions.subject, params.subject),
      inArray(schema.questions.status, duplicateStatuses)
    ];

    if (params.excludeQuestionId) {
      conditions.push(not(eq(schema.questions.id, params.excludeQuestionId)));
    }

    const candidates = await this.db
      .select({ id: schema.questions.id, question_text: schema.questions.question_text })
      .from(schema.questions)
      .where(and(...conditions));

    const corpus = candidates.map((entry) => entry.question_text);`
);

code = code.replace(/candidate\.questionId/g, 'candidate.id');
code = code.replace(/highestQuestionId = candidate\.questionId;/g, 'highestQuestionId = candidate.id;');

// indexQuestion
code = code.replace(
  /private async indexQuestion\(question: QuestionDocument\): Promise<void> {/,
  'private async indexQuestion(question: any): Promise<void> {'
);
code = code.replace(/questionId: question\.questionId,/g, 'questionId: question.id,');

// createQuestion
code = code.replace(
  /const question = await this\.questionModel\.create\({[\s\S]*?}\);/m,
  `const [question] = await this.db.insert(schema.questions).values({
      id: uuidv4(),
      ...payload,
      options: payload.options,
      tags: this.normalizeTags(payload.tags),
      status: 'draft',
      created_by: this.getActorId(user),
      source: options?.source ?? 'manual',
      import_batch_id: options?.importBatchId,
      embedding_vector: duplicate.embeddingVector,
    }).returning();`
);

// listQuestions
code = code.replace(
  /const query: FilterQuery<QuestionDocument> = {};[\s\S]*?this\.questionModel\.countDocuments\(query\)\.exec\(\),\n    \]\);/m,
  `const conditions = [];

    if (filters.subject) conditions.push(eq(schema.questions.subject, filters.subject));
    if (filters.topic) conditions.push(eq(schema.questions.topic, filters.topic));
    if (filters.subtopic) conditions.push(eq(schema.questions.subtopic, filters.subtopic));
    if (filters.status) conditions.push(eq(schema.questions.status, filters.status));
    if (filters.difficulty_level) conditions.push(eq(schema.questions.difficulty_level, filters.difficulty_level));
    if (filters.year_sourced) conditions.push(eq(schema.questions.year_sourced, filters.year_sourced));
    if (filters.bloom_level) conditions.push(eq(schema.questions.bloom_level, filters.bloom_level));
    if (filters.question_type) conditions.push(eq(schema.questions.question_type, filters.question_type));
    
    if (filters.tags?.length) {
      // Simplistic approach for sqlite json: we'll skip array intersection or just use a basic string search
    }

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

// searchQuestions
code = code.replace(
  /const data = await this\.questionModel\.find\({ questionId: { \$in: esResult\.ids } }\)\.lean\(\)\.exec\(\);/m,
  `const data = await this.db.select().from(schema.questions).where(inArray(schema.questions.id, esResult.ids));`
);

code = code.replace(
  /const allQuestions = await this\.questionModel\.find\(\)\.lean\(\)\.exec\(\);/m,
  `const allQuestions = await this.db.select().from(schema.questions);`
);

code = code.replace(
  /private sanitizeForStudents\(question: QuestionDocument \| \(Question & { \[key: string\]: unknown }\)\) {/m,
  `private sanitizeForStudents(question: any) {`
);

// getQuestionById
code = code.replace(
  /const question = await this\.questionModel\.findOne\({ questionId }\)\.exec\(\);/g,
  `const [question] = await this.db.select().from(schema.questions).where(eq(schema.questions.id, questionId)).limit(1);`
);

// updateQuestion
code = code.replace(
  /question\.versions\.push\({/g,
  `question.versions = [...(question.versions || []), {`
);
code = code.replace(
  /change_reason: payload\.change_reason,\n    }\);/g,
  `change_reason: payload.change_reason,\n    }];`
);

code = code.replace(
  /await question\.save\(\);/g,
  `const [updated] = await this.db.update(schema.questions).set(question).where(eq(schema.questions.id, questionId)).returning(); Object.assign(question, updated);`
);

// retireQuestion
code = code.replace(
  /const question = await this\.questionModel\.findOneAndUpdate\([\s\S]*?{ new: true },\n    \);/m,
  `const [question] = await this.db.update(schema.questions).set({ status: 'retired' }).where(eq(schema.questions.id, questionId)).returning();`
);

// saveDiagramSVG
code = code.replace(
  /await this\.questionModel\.updateOne\({ questionId }, { \$set: { diagram_svg: svg } }\)\.exec\(\);/m,
  `await this.db.update(schema.questions).set({ diagram_svg: svg }).where(eq(schema.questions.id, questionId));`
);

// rollbackQuestion
code = code.replace(
  /change_reason: \`Rollback to version \${versionNumber}\`,\n    }\);/g,
  `change_reason: \`Rollback to version \${versionNumber}\`,\n    }];`
);

// transitionStatus
code = code.replace(
  /Object\.assign\(question, patch \?\? {}\);\n    await question\.save\(\);/m,
  `const [updated] = await this.db.update(schema.questions).set({ status: toStatus, ...(patch ?? {}) }).where(eq(schema.questions.id, questionId)).returning();\n    Object.assign(question, updated);`
);

// getStats
code = code.replace(
  /const \[total, bySubjectAgg, byStatusAgg, byDifficultyAgg, totalPublished, recentlyAdded\] =[\s\S]*?\]\);/m,
  `const [totalRes, totalPublishedRes, recentlyAddedRes, bySubjectAgg, byStatusAgg, byDifficultyAgg] = await Promise.all([
      this.db.select({ count: count() }).from(schema.questions),
      this.db.select({ count: count() }).from(schema.questions).where(eq(schema.questions.status, 'published')),
      this.db.select({ count: count() }).from(schema.questions).where(gt(schema.questions.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))),
      this.db.select({ _id: schema.questions.subject, count: count() }).from(schema.questions).groupBy(schema.questions.subject),
      this.db.select({ _id: schema.questions.status, count: count() }).from(schema.questions).groupBy(schema.questions.status),
      this.db.select({ _id: schema.questions.difficulty_level, count: count() }).from(schema.questions).groupBy(schema.questions.difficulty_level)
    ]);
    const total = totalRes[0].count;
    const totalPublished = totalPublishedRes[0].count;
    const recentlyAdded = recentlyAddedRes[0].count;`
);

// getPublishedSubjectCounts
code = code.replace(
  /const rows = await this\.questionModel\n      \.aggregate\(\[\n        { \$match: { status: 'published' } },\n        { \$group: { _id: '\$subject', count: { \$sum: 1 } } },\n        { \$sort: { _id: 1 } },\n      \]\)\n      \.exec\(\);/m,
  `const rows = await this.db.select({ _id: schema.questions.subject, count: count() }).from(schema.questions).where(eq(schema.questions.status, 'published')).groupBy(schema.questions.subject).orderBy(asc(schema.questions.subject));`
);

// getTopics
code = code.replace(
  /const rows = await this\.questionModel\n      \.aggregate\(\[\n        { \$match: { subject, status: 'published', topic: { \$exists: true, \$ne: null } } },\n        { \$group: { _id: '\$topic', count: { \$sum: 1 } } },\n        { \$sort: { _id: 1 } },\n      \]\)\n      \.exec\(\);/m,
  `const rows = await this.db.select({ _id: schema.questions.topic, count: count() }).from(schema.questions).where(and(eq(schema.questions.subject, subject), eq(schema.questions.status, 'published'))).groupBy(schema.questions.topic).orderBy(asc(schema.questions.topic));`
);

// updateTags
code = code.replace(
  /const doc = await this\.questionModel\.findOneAndUpdate\({ questionId: id }, { tags }, { new: true }\)\.exec\(\);/m,
  `const [doc] = await this.db.update(schema.questions).set({ tags }).where(eq(schema.questions.id, id)).returning();`
);
code = code.replace(/Promise<QuestionDocument>/g, 'Promise<any>');

// insertGeneratedQuestions
code = code.replace(
  /const inserted = await this\.questionModel\.insertMany\(documentsToInsert, { ordered: false }\);/m,
  `const inserted = await this.db.insert(schema.questions).values(documentsToInsert as any).returning();`
);
code = code.replace(/return inserted as unknown as QuestionDocument\[\];/g, 'return inserted as any;');
code = code.replace(/Promise<QuestionDocument\[\]>/g, 'Promise<any[]>');

// getVersions
code = code.replace(
  /const question = await this\.questionModel\.findOne\({ questionId }\)\.select\({ versions: 1 }\)\.lean\(\)\.exec\(\);/m,
  `const [question] = await this.db.select({ versions: schema.questions.versions }).from(schema.questions).where(eq(schema.questions.id, questionId)).limit(1);`
);

// bulkTagUpdate
code = code.replace(
  /await this\.questionModel\.updateMany\([\s\S]*?{ \$addToSet: { tags: { \$each: tags } } },\n      \);/m,
  `// NOTE: For SQLite, appending to JSON array is complex, skip or implement a manual select/update loop
      const rows = await this.db.select({ id: schema.questions.id, tags: schema.questions.tags }).from(schema.questions).where(inArray(schema.questions.id, payload.questionIds));
      for (const row of rows) {
        const newTags = Array.from(new Set([...(row.tags as string[] || []), ...tags]));
        await this.db.update(schema.questions).set({ tags: newTags }).where(eq(schema.questions.id, row.id));
      }`
);
code = code.replace(
  /await this\.questionModel\.updateMany\([\s\S]*?{ \$pullAll: { tags } },\n      \);/m,
  `const rows = await this.db.select({ id: schema.questions.id, tags: schema.questions.tags }).from(schema.questions).where(inArray(schema.questions.id, payload.questionIds));
      for (const row of rows) {
        const newTags = (row.tags as string[] || []).filter(t => !tags.includes(t));
        await this.db.update(schema.questions).set({ tags: newTags }).where(eq(schema.questions.id, row.id));
      }`
);

// correctQuestionError
code = code.replace(
  /await this\.questionModel\.updateOne\({ questionId }, { \$set: updatePayload }\)\.exec\(\);/m,
  `await this.db.update(schema.questions).set(updatePayload).where(eq(schema.questions.id, questionId));`
);

// Fix question.questionId where missed
code = code.replace(/question\.questionId/g, 'question.id');
code = code.replace(/a\.questionId/g, 'a.id');
code = code.replace(/b\.questionId/g, 'b.id');
code = code.replace(/doc\.questionId/g, 'doc.id');

fs.writeFileSync('C:/Users/DELL/AURIKEX/CBT/backend/src/questions/questions.service.ts', code);
console.log('Script written correctly');
