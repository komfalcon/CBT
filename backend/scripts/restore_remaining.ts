import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function restore() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined.');
    return;
  }
  
  const backupPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\f8ccf9be-8a30-439b-9374-75aa4d27a865\\scratch\\remaining_questions.json';
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at ${backupPath}`);
    return;
  }
  
  const questions = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log(`Loaded ${questions.length} questions from local backup.`);
  
  if (questions.length === 0) {
    console.log('No questions to restore.');
    return;
  }
  
  console.log('Connecting to MongoDB Atlas Cluster...');
  await connect(uri);
  
  try {
    const client = connection.client;
    const dbJamb = client.db('jamb_cbt');
    
    console.log('Starting import of remaining questions to "jamb_cbt.questions"...');
    
    const batchSize = 1000;
    let successCount = 0;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      try {
        const result = await dbJamb.collection('questions').insertMany(batch, { ordered: false });
        successCount += result.insertedCount;
      } catch (err: any) {
        if (err.code === 11000) {
          successCount += err.result?.nInserted || 0;
        } else {
          console.error(`Error inserting batch starting at index ${i}:`, err.message);
        }
      }
      console.log(`Imported ${Math.min(i + batchSize, questions.length)} / ${questions.length} questions...`);
    }
    
    console.log(`\nImport completed! Successfully imported ${successCount} questions into "jamb_cbt.questions".`);
  } catch (err: any) {
    console.error('Import failed:', err.message);
  }
  
  await disconnect();
}

restore();
