import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function findMissing() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined.');
    return;
  }
  
  await connect(uri);
  
  try {
    const client = connection.client;
    const dbJamb = client.db('jamb_cbt');
    const dbTest = client.db('test');
    
    console.log('Comparing questions between "test" and "jamb_cbt" databases...');
    
    // Fetch all questionIds from test database
    console.log('Fetching questions from "test" database...');
    const testQuestions = await dbTest.collection('questions').find({}, { projection: { questionId: 1, question_text: 1 } }).toArray();
    console.log(`Loaded ${testQuestions.length} questions from "test".`);
    
    // Fetch all questionIds from jamb_cbt database
    console.log('Fetching questions from "jamb_cbt" database...');
    const jambQuestions = await dbJamb.collection('questions').find({}, { projection: { questionId: 1 } }).toArray();
    console.log(`Loaded ${jambQuestions.length} questions from "jamb_cbt".`);
    
    const jambIds = new Set(jambQuestions.map(q => q.questionId));
    
    let missingCount = 0;
    const missingSamples: any[] = [];
    
    for (const q of testQuestions) {
      if (!jambIds.has(q.questionId)) {
        missingCount++;
        if (missingSamples.length < 5) {
          missingSamples.push(q);
        }
      }
    }
    
    console.log(`\nResults:`);
    console.log(`- Total questions in "test": ${testQuestions.length}`);
    console.log(`- Total questions in "jamb_cbt": ${jambQuestions.length}`);
    console.log(`- Questions in "test" that are MISSING in "jamb_cbt": ${missingCount}`);
    
    if (missingSamples.length > 0) {
      console.log('\nSample missing questions:');
      missingSamples.forEach(q => {
        console.log(`  * ID: ${q.questionId}, Text: "${q.question_text.substring(0, 60)}..."`);
      });
    }
  } catch (err: any) {
    console.error('Error comparing databases:', err.message);
  }
  
  await disconnect();
}

findMissing();
