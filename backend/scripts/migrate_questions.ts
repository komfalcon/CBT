import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined.');
    return;
  }
  
  console.log('Connecting to MongoDB Atlas Cluster...');
  await connect(uri);
  
  try {
    const client = connection.client;
    const dbTest = client.db('test');
    const dbJamb = client.db('jamb_cbt');
    
    console.log('Fetching questions from "test" database...');
    const questions = await dbTest.collection('questions').find({}).toArray();
    console.log(`Found ${questions.length} questions in "test.questions".`);
    
    if (questions.length === 0) {
      console.log('No questions found to migrate.');
      return;
    }
    
    console.log('Starting migration to "jamb_cbt.questions"...');
    
    const batchSize = 1000;
    let successCount = 0;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      try {
        // Use insertMany with ordered: false to skip duplicates if any exist
        const result = await dbJamb.collection('questions').insertMany(batch, { ordered: false });
        successCount += result.insertedCount;
      } catch (err: any) {
        if (err.code === 11000) {
          // Some duplicate key errors occurred, but other documents were inserted
          successCount += err.result?.nInserted || 0;
        } else {
          console.error(`Error inserting batch starting at index ${i}:`, err.message);
        }
      }
      console.log(`Migrated ${Math.min(i + batchSize, questions.length)} / ${questions.length} questions...`);
    }
    
    console.log(`\nMigration completed! Successfully copied ${successCount} questions into "jamb_cbt.questions".`);
  } catch (err: any) {
    console.error('Migration failed:', err.message);
  }
  
  await disconnect();
}

migrate();
