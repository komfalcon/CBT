import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';
import { Question, QuestionSchema } from '../src/questions/schemas/question.schema';
import * as mongoose from 'mongoose';

dotenv.config();

async function check() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in the environment.');
    return;
  }
  if (uri.includes('@mongodb:')) {
    uri = uri.replace('@mongodb:', '@localhost:');
  } else if (uri.includes('//mongodb:')) {
    uri = uri.replace('//mongodb:', '//localhost:');
  }
  
  await connect(uri);
  
  try {
    const QuestionModel = mongoose.model<Question>('Question', QuestionSchema);
    
    // Find questions where has_diagram is true OR diagram_svg is not empty OR question_text contains tikz
    const questions = await QuestionModel.find({
      $or: [
        { diagram_svg: { $exists: true, $ne: '' } },
        { question_text: /tikz/i },
        { question_text: /\\begin/i }
      ]
    })
    .limit(10)
    .exec();
    
    console.log(`Found ${questions.length} matching questions.`);
    for (const q of questions) {
      const doc = q as any;
      console.log('====================================');
      console.log(`ID: ${doc.questionId}`);
      console.log(`Subject: ${doc.subject}`);
      console.log(`Topic: ${doc.topic}`);
      console.log(`Has Diagram: ${doc.has_diagram}`);
      console.log(`Diagram SVG length: ${doc.diagram_svg?.length ?? 0}`);
      console.log(`Diagram SVG starts with: ${doc.diagram_svg ? doc.diagram_svg.substring(0, 100) : 'none'}`);
      console.log(`Question Text: ${doc.question_text}`);
      console.log(`Latex field: ${doc.latex}`);
    }
  } catch (err: any) {
    console.error('Error during query:', err.message);
  }
  
  await disconnect();
}

check();
