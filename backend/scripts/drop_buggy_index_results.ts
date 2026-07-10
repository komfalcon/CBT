import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixIndex() {
  await connect(process.env.MONGODB_URI as string);
  
  try {
    const coll = connection.collection('examresults');
    await coll.dropIndex('questionsSnapshot.questionId_1');
    console.log('Index dropped successfully from examresults!');
  } catch (err: any) {
    console.log('Error dropping index (maybe it does not exist?):', err.message);
  }
  
  await disconnect();
}
fixIndex();
