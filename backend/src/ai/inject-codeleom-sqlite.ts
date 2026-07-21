import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';
const cleanedPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\cleaned.sql';

const JAMB_SUBJECTS = {
  'Mathematics': 'mathematics',
  'English Language': 'english',
  'Physics': 'physics',
  'Geography': 'geography',
  'Economics': 'economics',
  'Biology': 'biology',
  'Government': 'government',
  'Lit in English': 'englishlit',
  'Chemistry': 'chemistry',
  'Agricultural Science': 'agriculture',
  'Christian Religion Studies': 'crk',
  'Commerce': 'commerce',
  'History': 'history',
  'Islamic Religious Knowledge': 'irk',
  'Principles of Accounts': 'accounting'
};

async function run() {
  console.log("Reading SQL...");
  const sqlPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql';
  let sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log("Cleaning MySQL syntax for SQLite...");
  sqlContent = sqlContent.replace(/ENGINE=InnoDB.*?;/g, ';');
  sqlContent = sqlContent.replace(/ENGINE=MyISAM.*?;/g, ';');
  sqlContent = sqlContent.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
  sqlContent = sqlContent.replace(/int\(\d+\)/gi, 'INTEGER');
  sqlContent = sqlContent.replace(/tinyint\(\d+\)/gi, 'INTEGER');
  sqlContent = sqlContent.replace(/varchar\(\d+\)/gi, 'TEXT');
  sqlContent = sqlContent.replace(/char\(\d+\)/gi, 'TEXT');
  sqlContent = sqlContent.replace(/ timestamp /gi, ' TEXT ');
  sqlContent = sqlContent.replace(/ time /gi, ' TEXT ');
  sqlContent = sqlContent.replace(/ ON UPDATE CURRENT_TIMESTAMP/gi, '');
  sqlContent = sqlContent.replace(/ DEFAULT '0000-00-00 00:00:00'/gi, '');
  sqlContent = sqlContent.replace(/ DEFAULT CURRENT_TIMESTAMP/gi, '');
  sqlContent = sqlContent.replace(/ DEFAULT '\w+'/gi, '');
  sqlContent = sqlContent.replace(/ COLLATE .*?,/gi, ',');
  sqlContent = sqlContent.replace(/ COLLATE .*? /gi, ' ');
  
  // Proper MySQL string escaping to SQLite
  sqlContent = sqlContent.replace(/\\\\/g, '__DOUBLE_BACKSLASH__'); // Save escaped backslashes
  sqlContent = sqlContent.replace(/\\'/g, "''"); // Replace escaped quotes with ''
  sqlContent = sqlContent.replace(/__DOUBLE_BACKSLASH__/g, '\\'); // Restore backslashes
  
  sqlContent = sqlContent.replace(/\/\*![\s\S]*?\*\//g, '');
  sqlContent = sqlContent.replace(/^SET .*?;$/gm, '');
  sqlContent = sqlContent.replace(/^START TRANSACTION;$/gm, '');
  sqlContent = sqlContent.replace(/^COMMIT;$/gm, '');

  console.log("Loading into SQLite in-memory DB...");
  const db = new sqlite3.Database(':memory:');

  await new Promise<void>((resolve, reject) => {
    db.exec(sqlContent, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log("Querying data...");
  const questions: any[] = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        q.id as id,
        q.qus_no as qus_no,
        q.text as text,
        s.name as subject_name,
        q.course_id as course_id
      FROM questions q
      JOIN subjects s ON q.course_id = s.id
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const choices: any[] = await new Promise((resolve, reject) => {
    db.all(`SELECT * FROM choices`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log(`Found ${questions.length} valid questions and ${choices.length} choices.`);

  // Map choices to course_id_qus_no
  const choicesMap = new Map();
  for(const c of choices) {
    const key = `${c.course_id}_${c.qus_no}`;
    if (!choicesMap.has(key)) choicesMap.set(key, []);
    choicesMap.get(key).push({
      text: c.text,
      is_correct: c.is_correct == 1
    });
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(DB_URI);
  await client.connect();
  const mdb = client.db();
  const collection = mdb.collection('questions');

  let insertCount = 0;

  for(const q of questions) {
    const subjectNorm = (JAMB_SUBJECTS as any)[q.subject_name];
    if(!subjectNorm) continue; // Skip non-JAMB

    const key = `${q.course_id}_${q.qus_no}`;
    let qChoices = choicesMap.get(key);
    if(!qChoices || qChoices.length < 2) continue; // Skip invalid choices

    const letters = ['a', 'b', 'c', 'd', 'e'];
    let options = [];
    let correctLetter = 'a';
    
    qChoices = qChoices.slice(0, 5);
    for(let i=0; i<qChoices.length; i++) {
      options.push({
        option_letter: letters[i],
        option_text: String(qChoices[i].text)
      });
      if(qChoices[i].is_correct) {
        correctLetter = letters[i];
      }
    }

    const external_id = `codeleom_${subjectNorm}_${q.id}`;

    const questionData = {
      subject: subjectNorm,
      topic: 'General',
      question_text: String(q.text),
      options: options,
      correct_option: correctLetter,
      explanation: null,
      image_url: null,
      has_diagram: false,
      diagram_svg: null,
      source: 'real_jamb_past_question',
      external_id: external_id,
      questionId: external_id,
      created_at: new Date(),
      updated_at: new Date()
    };

    await collection.updateOne(
      { external_id: external_id },
      { $set: questionData },
      { upsert: true }
    );
    insertCount++;
    if (insertCount % 500 === 0) console.log(`Inserted ${insertCount}...`);
  }

  console.log(`\n================================`);
  console.log(`CODELEOM IMPORT COMPLETE! Total injected: ${insertCount}`);
  console.log(`================================`);
  
  await client.close();
  process.exit(0);
}

run().catch(console.error);
