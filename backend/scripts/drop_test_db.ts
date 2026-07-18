import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function dropDb() {
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
    
    console.log('Dropping "test" database...');
    await dbTest.dropDatabase();
    console.log('"test" database dropped successfully! Storage space reclaimed.');
  } catch (err: any) {
    console.error('Failed to drop "test" database:', err.message);
  }
  
  await disconnect();
}

dropDb();
