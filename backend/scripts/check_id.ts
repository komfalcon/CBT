import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { Question, QuestionSchema } from '../src/questions/schemas/question.schema';
import * as mongoose from 'mongoose';

dotenv.config();

async function check() {
  await connect(process.env.MONGODB_URI as string);
  const qModel = mongoose.model(Question.name, QuestionSchema);
  const total = await qModel.countDocuments();
  const published = await qModel.countDocuments({ status: 'published' });
  const bySubject = await qModel.aggregate([{ $group: { _id: "$subject", count: { $sum: 1 } } }]);
  console.log("Total:", total, "Published:", published);
  console.log("By subject:", bySubject);
  const sample = await qModel.findOne({ status: 'published' });
  console.log("Sample question:", sample);
  await disconnect();
}
check();
