import { connect, model, Schema } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const QuestionSchema = new Schema({}, { strict: false });
const Question = model('Question', QuestionSchema);

const GARBAGE_KEYWORDS = [
  'cookie', 'pvp', 'gameplay', 'mechanics', 'system architecture', 'database',
  'kernel', 'sql', 'spreadsheet', 'neural network', 'api design', 'distributed',
  'concurrency', 'optimization', 'cluster', 'data ', 'sync', 'availability',
  'string matching', 'biostatistic', 'patient id', 'clinical trial', 'customer data',
  'intellectual property', 'modulation', 'memory management', 'interrupt',
  'algorithm', 'validation', 'infrastructure', 'software', 'configuration',
  'cybersecurity', 'blockchain', 'routing', 'architecture', 'application',
  'backend pipeline', 'cli commands', 'boolean retrieval', 'connectivity',
  'compilation pipeline', 'cognitive load', 'cognitive analysis'
];

async function run() {
  await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cbt');
  console.log('Connected to DB');

  // 1. Delete garbage questions
  let deletedCount = 0;
  for (const keyword of GARBAGE_KEYWORDS) {
    const res = await Question.deleteMany({ topic: { $regex: keyword, $options: 'i' } });
    deletedCount += res.deletedCount;
  }
  console.log(`Deleted ${deletedCount} garbage questions.`);

  // 2. Find remaining topics with < 40 questions and rename to 'General'
  const pipeline = [
    { $group: { _id: { subject: '$subject', topic: '$topic' }, count: { $sum: 1 } } },
    { $match: { count: { $lt: 40 } } }
  ];
  const smallTopics = await Question.aggregate(pipeline);
  
  let updatedCount = 0;
  for (const item of smallTopics) {
    // If the topic is already 'General', skip it
    if (item._id.topic.toLowerCase() === 'general') continue;
    
    // Some subjects have 'General' as their fallback, some might just need it created
    const res = await Question.updateMany(
      { subject: item._id.subject, topic: item._id.topic },
      { $set: { topic: 'General' } }
    );
    updatedCount += res.modifiedCount;
  }
  console.log(`Merged ${updatedCount} questions from ${smallTopics.length} small topics into 'General'.`);
  
  process.exit(0);
}
run();
