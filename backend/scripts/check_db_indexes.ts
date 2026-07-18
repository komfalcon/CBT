import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in the environment.');
    return;
  }
  
  console.log('Connecting to MongoDB...');
  await connect(uri);
  
  try {
    const db = connection.db;
    if (!db) {
      console.error('Database connection not established.');
      return;
    }
    
    const collections = ['examsessions', 'examresults', 'questions', 'users'];
    for (const colName of collections) {
      console.log(`\nIndexes for collection: ${colName}`);
      try {
        const indexes = await db.collection(colName).indexes();
        console.log(JSON.stringify(indexes, null, 2));
      } catch (err: any) {
        console.error(`Error getting indexes for ${colName}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
  
  await disconnect();
}

checkIndexes();
