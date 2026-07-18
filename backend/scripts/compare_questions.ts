import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function compare() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined.');
    return;
  }
  
  await connect(uri);
  
  try {
    const client = connection.client;
    
    // 1. Analyze jamb_cbt
    const dbJamb = client.db('jamb_cbt');
    const totalJamb = await dbJamb.collection('questions').countDocuments();
    const aiJamb = await dbJamb.collection('questions').countDocuments({
      $or: [{ source: 'ai_generated' }, { created_by: 'ai-generator' }]
    });
    const manualJamb = totalJamb - aiJamb;
    
    console.log('--- jamb_cbt (Live Database) ---');
    console.log(`- Total Questions: ${totalJamb}`);
    console.log(`- AI-Generated: ${aiJamb}`);
    console.log(`- Manual/Imported: ${manualJamb}`);
    
    // 2. Analyze test
    const dbTest = client.db('test');
    const totalTest = await dbTest.collection('questions').countDocuments();
    const aiTest = await dbTest.collection('questions').countDocuments({
      $or: [{ source: 'ai_generated' }, { created_by: 'ai-generator' }]
    });
    const manualTest = totalTest - aiTest;
    
    console.log('\n--- test (Test Database) ---');
    console.log(`- Total Questions: ${totalTest}`);
    console.log(`- AI-Generated: ${aiTest}`);
    console.log(`- Manual/Imported: ${manualTest}`);
    
    // 3. Find unique manual questions in test database
    if (manualTest > 0) {
      console.log('\nAnalyzing if there are any manual/imported questions in "test" that are missing in "jamb_cbt"...');
      const testManualDocs = await dbTest.collection('questions').find({
        source: { $ne: 'ai_generated' },
        created_by: { $ne: 'ai-generator' }
      }).toArray();
      
      let missingCount = 0;
      const sampleMissing: any[] = [];
      
      for (const q of testManualDocs) {
        const match = await dbJamb.collection('questions').findOne({
          $or: [
            { questionId: q.questionId },
            { question_text: q.question_text }
          ]
        });
        if (!match) {
          missingCount++;
          if (sampleMissing.length < 5) {
            sampleMissing.push(q);
          }
        }
      }
      
      console.log(`- Found ${missingCount} questions in "test" that are missing in "jamb_cbt".`);
      if (sampleMissing.length > 0) {
        console.log('Sample missing questions from "test":');
        sampleMissing.forEach(q => {
          console.log(`  * ID: ${q.questionId}, Subject: ${q.subject}, Topic: ${q.topic}, Source: ${q.source || 'n/a'}`);
        });
      }
    }
  } catch (err: any) {
    console.error('Error during comparison:', err.message);
  }
  
  await disconnect();
}

compare();
