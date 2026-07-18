import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function listDbs() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined.');
    return;
  }
  
  console.log('Connecting to MongoDB Atlas Cluster...');
  await connect(uri);
  
  try {
    const adminDb = connection.db?.admin();
    if (!adminDb) {
      console.error('Could not get admin database instance.');
      return;
    }
    
    console.log('Fetching database list...');
    const result = await adminDb.listDatabases();
    console.log('\nAvailable databases in this MongoDB Atlas cluster:');
    
    for (const dbInfo of result.databases) {
      console.log(`- Database: ${dbInfo.name} (Size on disk: ${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      
      // Let's count questions in this database if possible
      try {
        const client = connection.client;
        const dbInstance = client.db(dbInfo.name);
        const collections = await dbInstance.listCollections().toArray();
        console.log('  Collections:');
        for (const col of collections) {
          const count = await dbInstance.collection(col.name).countDocuments();
          console.log(`    * ${col.name}: ${count} documents`);
        }
      } catch (err: any) {
        console.log(`  Could not list collections: ${err.message}`);
      }
    }
  } catch (err: any) {
    console.error('Error listing databases:', err.message);
  }
  
  await disconnect();
}

listDbs();
