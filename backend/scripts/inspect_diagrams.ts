import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await connect(process.env.MONGODB_URI as string);
  const duplicates = await connection.collection('questions')
    .aggregate([
      { $match: { subject: 'english' } },
      { $group: { _id: "$question_text", count: { $sum: 1 }, ids: { $push: "$questionId" } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
    .toArray();

  console.log('Duplicate question texts:');
  for (const dup of duplicates) {
    console.log(`Count: ${dup.count}, Text: ${dup._id.slice(0, 100)}...`);
    console.log(`IDs:`, dup.ids.slice(0, 3));
  }
  await disconnect();
}
run();
