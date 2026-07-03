import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { QuestionSchema } from '../src/questions/schemas/question.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:secret@localhost:27017/jamb_cbt?authSource=admin';
const DATA_DIR = path.join(__dirname, '..', 'data');

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const QuestionModel = mongoose.model('Question', QuestionSchema);

  // Read files in data directory
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('_questions.json'));
  console.log(`Found ${files.length} question files in data directory.`);

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`Processing file: ${file}...`);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      let subject = data.subject || '';
      if (subject === 'accounts') subject = 'accounting';
      if (subject === 'civic') subject = 'civic_education';
      if (subject === 'crs') subject = 'crk';
      if (subject === 'irs') subject = 'irk';
      
      const questions = data.questions || [];
      console.log(`Mapped Subject: ${subject}, Questions in file: ${questions.length}`);

      if (questions.length === 0) continue;

      const recordsToInsert = questions.map((q: any, index: number) => {
        // Enforce valid types
        const validTypes = ['mcq_single', 'mcq_multiple', 'true_false', 'fill_blank', 'image_based', 'latex'];
        let questionType = q.question_type || 'mcq_single';
        if (questionType === 'mcq') questionType = 'mcq_single';
        if (!validTypes.includes(questionType)) {
          questionType = 'mcq_single';
        }

        // Clamp year
        let yearSourced = q.year ? Number(q.year) : undefined;
        if (yearSourced !== undefined && (yearSourced < 1990 || yearSourced > 2024)) {
          yearSourced = 2022;
        }

        // Enforce valid option objects
        const parsedOptions = (q.options || []).map((opt: any, optIndex: number) => {
          const id = ['A', 'B', 'C', 'D', 'E'][optIndex];
          let text = '';
          if (typeof opt === 'string') {
            text = opt;
          } else if (opt && typeof opt === 'object') {
            text = opt.text || opt.option || Object.values(opt).find((v) => typeof v === 'string' && v.length > 0) || '';
          }
          return { id, text: String(text).trim() || `Option ${id}` };
        });

        // Fallback for empty options
        while (parsedOptions.length < 4) {
          const id = ['A', 'B', 'C', 'D', 'E'][parsedOptions.length];
          parsedOptions.push({ id, text: `Option ${id}` });
        }

        // Enforce valid correct option
        let correctOption = String(q.correct_option || 'A').toUpperCase();
        if (!['A', 'B', 'C', 'D', 'E'].includes(correctOption)) {
          correctOption = 'A';
        }

        // Unique questionId suffix to prevent E11000 duplicate index conflicts
        const uniqueId = `${subject}_${q.id || index}_${Math.random().toString(36).substring(2, 7)}`;

        return {
          questionId: uniqueId,
          subject: subject,
          topic: q.topic || 'General',
          subtopic: q.subtopic || undefined,
          year_sourced: yearSourced,
          question_text: q.question_text || 'Sample Question Text',
          options: parsedOptions,
          correct_option: correctOption,
          explanation: q.explanation || undefined,
          question_type: questionType,
          difficulty_level: q.difficulty ? Number(q.difficulty) : 3,
          has_diagram: !!q.has_diagram,
          diagram_svg: q.diagram_svg || undefined,
          latex: q.latex || undefined,
          status: 'published',
          created_by: 'seeder',
          source: 'ai_generated',
          tags: q.tags || [],
        };
      });

      // Clear existing questions for this subject to prevent duplicates on re-run
      const deleteResult = await QuestionModel.deleteMany({ subject });
      console.log(`Cleared ${deleteResult.deletedCount} existing questions for ${subject}.`);

      // Insert many
      const insertResult = await QuestionModel.insertMany(recordsToInsert);
      console.log(`Successfully seeded ${insertResult.length} questions for ${subject}.`);
    } catch (err: any) {
      console.error(`Failed to process ${file}:`, err);
    }
  }

  console.log('Seeding complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding crashed:', err);
  process.exit(1);
});
