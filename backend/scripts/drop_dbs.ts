import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function dropDbs() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined.');
    return;
  }
  
  console.log('Connecting to MongoDB Atlas Cluster...');
  await connect(uri);
  
  try {
    const client = connection.client;
    
    // 1. Drop test database
    console.log('Dropping "test" database...');
    const dbTest = client.db('test');
    await dbTest.dropDatabase();
    console.log('"test" database dropped successfully!');
    
    // 2. Drop sample_mflix database
    console.log('Dropping "sample_mflix" database...');
    const dbMflix = client.db('sample_mflix');
    await dbMflix.dropDatabase();
    console.log('"sample_mflix" database dropped successfully!');
    
    console.log('\nAll requested databases dropped. Storage space reclaimed.');
  } catch (err: any) {
    console.error('Failed to drop databases:', err.message);
  }
  
  await disconnect();
}

dropDbs();
