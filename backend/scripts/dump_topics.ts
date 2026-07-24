import { connect, model, Schema } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const QuestionSchema = new Schema({}, { strict: false });
const Question = model('Question', QuestionSchema);

async function run() {
  await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cbt');
  const results = await Question.aggregate([
    { $group: { _id: { subject: '$subject', topic: '$topic' }, count: { $sum: 1 } } },
    { $sort: { '_id.subject': 1, count: -1 } }
  ]);
  
  const fs = require('fs');
  let output = '';
  let currentSubject = null;
  for (const res of results) {
    if (res._id.subject !== currentSubject) {
        output += '\n--- ' + res._id.subject + ' ---\n';
        currentSubject = res._id.subject;
    }
    output += res._id.topic + ': ' + res.count + '\n';
  }
  fs.writeFileSync('c:/Users/DELL/AURIKEX/CBT/scratch_topics.txt', output);
  console.log('Done');
  process.exit(0);
}
run();
