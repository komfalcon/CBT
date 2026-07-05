import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function fix() {
  await connect(process.env.MONGODB_URI as string);
  const col = connection.collection('examresults');
  try {
    await col.dropIndex('questionsSnapshot.questionId_1');
    console.log("Dropped index questionsSnapshot.questionId_1");
  } catch (e) {
    console.log("Index might not exist or error:", e);
  }
  await disconnect();
}
fix();
