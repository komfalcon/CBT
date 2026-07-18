import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';
import { Question, QuestionSchema } from '../src/questions/schemas/question.schema';
import * as mongoose from 'mongoose';

dotenv.config();

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in the environment.');
    return;
  }
  
  await connect(uri);
  
  try {
    const QuestionModel = mongoose.model<Question>('Question', QuestionSchema);
    
    // Total count of AI questions
    const totalAiQuestions = await QuestionModel.countDocuments({
      $or: [{ source: 'ai_generated' }, { created_by: 'ai-generator' }]
    }).exec();
    
    console.log(`Total AI-generated questions in database: ${totalAiQuestions}`);
    
    // Total count of questions of any source
    const totalAllQuestions = await QuestionModel.countDocuments({}).exec();
    console.log(`Total questions of any source: ${totalAllQuestions}`);
    
    // Find the latest generated questions
    const latestQuestions = await QuestionModel.find({
      $or: [{ source: 'ai_generated' }, { created_by: 'ai-generator' }]
    })
    .sort({ created_at: -1 })
    .limit(5)
    .exec();
    
    if (latestQuestions.length > 0) {
      console.log('\nLatest 5 AI-generated questions:');
      latestQuestions.forEach(q => {
        console.log(`- ID: ${q.questionId}, Subject: ${q.subject}, Topic: ${q.topic}, Created At: ${q.created_at || (q as any).createdAt}`);
      });
    } else {
      console.log('\nNo AI-generated questions found.');
    }
  } catch (err: any) {
    console.error('Error during query:', err.message);
  }
  
  await disconnect();
}

check();
