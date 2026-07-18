import { connect, disconnect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function backup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined.');
    return;
  }
  
  await connect(uri);
  
  try {
    const client = connection.client;
    const dbTest = client.db('test');
    const dbJamb = client.db('jamb_cbt');
    
    console.log('Fetching all questions from "test" database...');
    const testQuestions = await dbTest.collection('questions').find({}).toArray();
    console.log(`Loaded ${testQuestions.length} questions from "test".`);
    
    console.log('Fetching questionIds from "jamb_cbt" database to find duplicates...');
    const jambQuestions = await dbJamb.collection('questions').find({}, { projection: { questionId: 1 } }).toArray();
    const jambIds = new Set(jambQuestions.map(q => q.questionId));
    console.log(`Loaded ${jambQuestions.length} questions from "jamb_cbt".`);
    
    const remaining = testQuestions.filter(q => !jambIds.has(q.questionId));
    console.log(`Found ${remaining.length} questions that are still missing from "jamb_cbt".`);
    
    const backupPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\f8ccf9be-8a30-439b-9374-75aa4d27a865\\scratch\\remaining_questions.json';
    fs.writeFileSync(backupPath, JSON.stringify(remaining, null, 2));
    console.log(`Successfully backed up remaining ${remaining.length} questions to ${backupPath}.`);
    
  } catch (err: any) {
    console.error('Backup failed:', err.message);
  }
  
  await disconnect();
}

backup();
