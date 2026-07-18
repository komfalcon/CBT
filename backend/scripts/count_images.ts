import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();
async function run() {
  await connect(process.env.MONGODB_URI as string);
  const count = await connection.collection('questions').countDocuments({ has_diagram: true });
  const total = await connection.collection('questions').countDocuments();
  console.log(`Total questions: ${total}, with images: ${count}`);
  await disconnect();
}
run();
