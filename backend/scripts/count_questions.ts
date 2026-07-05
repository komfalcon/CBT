import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';
import { Question, QuestionSchema } from '../src/questions/schemas/question.schema';
import * as mongoose from 'mongoose';

dotenv.config();

async function count() {
  await connect(process.env.MONGODB_URI as string);
  const QuestionModel = mongoose.model(Question.name, QuestionSchema);
  const total = await QuestionModel.countDocuments();
  const published = await QuestionModel.countDocuments({ status: 'published' });
  const bySubject = await QuestionModel.aggregate([{ $group: { _id: "$subject", count: { $sum: 1 } } }]);
  console.log(`Total: ${total}, Published: ${published}`);
  console.log("By Subject:", bySubject);
  await disconnect();
}
count();
