import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { Question, QuestionSchema } from '../src/questions/schemas/question.schema';
import * as mongoose from 'mongoose';

dotenv.config();

async function check() {
  await connect(process.env.MONGODB_URI as string);
  const qModel = mongoose.model(Question.name, QuestionSchema);
  const aiGeneratedCount = await qModel.countDocuments({ source: 'ai_generated' });
  console.log(`Found ${aiGeneratedCount} AI generated questions.`);
  if (aiGeneratedCount > 0) {
    const q = await qModel.findOne({ source: 'ai_generated' });
    console.log("Sample AI generated question:", JSON.stringify(q, null, 2));
  }
  await disconnect();
}
check();
