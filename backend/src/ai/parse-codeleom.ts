import * as fs from 'fs';
import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';
const SQL_FILE = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql';

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

async function parseCodeLeom() {
  console.log("Loading SQL file into memory...");
  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');

  // Simple custom parser for INSERT statements
  const subjectsMap = new Map();
  const questions = [];
  const choicesMap = new Map(); // key: course_id_qus_no

  console.log("Extracting records...");
  
  function extractRows(tableName: string) {
    const regex = new RegExp(`INSERT INTO \`${tableName}\` [\\s\\S]*? VALUES\\s*([\\s\\S]*?);`, 'g');
    const rows = [];
    let match;
    while ((match = regex.exec(sqlContent)) !== null) {
      const valuesStr = match[1];
      
      // Robust state machine to split rows like (...),(...) handling quotes and nested parens
      let inString = false;
      let escapeNext = false;
      let depth = 0;
      let currentTuple = '';
      
      for(let i = 0; i < valuesStr.length; i++) {
        let char = valuesStr[i];
        if (escapeNext) {
          currentTuple += char;
          escapeNext = false;
          continue;
        }
        if (char === '\\') {
          escapeNext = true;
          currentTuple += char;
          continue;
        }
        if (char === "'") {
          inString = !inString;
          currentTuple += char;
          continue;
        }
        
        if (!inString) {
          if (char === '(') depth++;
          else if (char === ')') depth--;
          
          if (depth === 0 && char === ')') {
            // End of tuple
            // Parse currentTuple columns
            let cols = [];
            let inQ = false;
            let esc = false;
            let cur = '';
            for(let j=0; j<currentTuple.length; j++) {
              let c = currentTuple[j];
              if(esc) { cur += c; esc = false; continue; }
              if(c === '\\') { esc = true; cur += c; continue; }
              if(c === "'") { inQ = !inQ; cur += c; continue; }
              if(c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
              cur += c;
            }
            cols.push(cur.trim());
            cols = cols.map(c => {
              if(c.startsWith("'") && c.endsWith("'")) c = c.slice(1, -1);
              return c.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
            });
            rows.push(cols);
            currentTuple = '';
            continue;
          }
          
          if (depth === 0 && (char === ',' || char === ' ' || char === '\n' || char === '\r')) {
            continue;
          }
        }
        
        if (depth > 0 || inString) {
          if (depth === 1 && char === '(' && !inString && currentTuple === '') {
            // skip the leading paren of the tuple
            continue;
          }
          currentTuple += char;
        }
      }
    }
    return rows;
  }

  const sRows = extractRows('subjects');
  sRows.forEach(r => {
    if(r.length >= 2) subjectsMap.set(r[0], r[1]);
  });
  console.log(`Parsed ${subjectsMap.size} subjects.`);

  const cRows = extractRows('choices');
  cRows.forEach(r => {
    if(r.length >= 6) {
      const key = `${r[1]}_${r[2]}`; // course_id _ qus_no
      if(!choicesMap.has(key)) choicesMap.set(key, []);
      choicesMap.get(key).push({
        text: r[5],
        is_correct: r[4] === '1'
      });
    }
  });
  console.log(`Parsed ${cRows.length} choices.`);

  const qRows = extractRows('questions');
  console.log(`Parsed ${qRows.length} questions.`);

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(DB_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection('questions');

  let insertCount = 0;
  
  for(const r of qRows) {
    if(r.length < 6) continue;
    const id = r[0];
    const qus_no = r[1];
    const text = r[3];
    const course_id = r[5];
    
    const subjectRaw = subjectsMap.get(course_id);
    if(!subjectRaw) continue;
    const subjectNorm = (JAMB_SUBJECTS as any)[subjectRaw];
    if(!subjectNorm) continue; // Skip PHP, Java, etc.

    const key = `${course_id}_${qus_no}`;
    let choices = choicesMap.get(key);
    if(!choices || choices.length < 2) continue; // Need valid choices

    // Map to A, B, C, D
    const letters = ['a', 'b', 'c', 'd', 'e'];
    let options = [];
    let correctLetter = 'a';
    
    // Only take up to 4 or 5 options
    choices = choices.slice(0, 5);
    for(let i=0; i<choices.length; i++) {
      options.push({
        option_letter: letters[i],
        option_text: choices[i].text
      });
      if(choices[i].is_correct) {
        correctLetter = letters[i];
      }
    }

    const external_id = `codeleom_${subjectNorm}_${id}`;

    const questionData = {
      subject: subjectNorm,
      topic: 'General',
      question_text: text,
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
    
    if(insertCount % 100 === 0) console.log(`Inserted ${insertCount} questions...`);
  }

  console.log(`\n================================`);
  console.log(`CODELEOM IMPORT COMPLETE! Total injected: ${insertCount}`);
  console.log(`================================`);
  
  await client.close();
  process.exit(0);
}

parseCodeLeom().catch(console.error);
