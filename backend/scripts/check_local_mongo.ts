import { connect, disconnect, connection } from 'mongoose';

async function checkLocal() {
  const localUri = 'mongodb://localhost:27017/jamb_cbt';
  console.log('Connecting to local MongoDB...');
  
  try {
    await connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log('Successfully connected to local MongoDB!');
    
    const adminDb = connection.db?.admin();
    if (adminDb) {
      const result = await adminDb.listDatabases();
      console.log('\nLocal Databases:');
      for (const dbInfo of result.databases) {
        console.log(`- Database: ${dbInfo.name}`);
        try {
          const client = connection.client;
          const dbInstance = client.db(dbInfo.name);
          const collections = await dbInstance.listCollections().toArray();
          for (const col of collections) {
            const count = await dbInstance.collection(col.name).countDocuments();
            console.log(`  * ${col.name}: ${count} docs`);
          }
        } catch (err: any) {
          console.log(`  Error listing collections: ${err.message}`);
        }
      }
    }
  } catch (err: any) {
    console.log('\nCould not connect to local MongoDB. Error:', err.message);
  }
  
  await disconnect().catch(() => undefined);
}

checkLocal();
