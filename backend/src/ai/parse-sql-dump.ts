import * as fs from 'fs';
import * as readline from 'readline';
import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';
const SQL_FILE = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\aloc-endpoints\\\\storage\\\\backups\\\\2020-08-20.sql';

const TARGET_SUBJECTS = ['english', 'mathematics', 'commerce', 'accounting', 'biology', 'physics', 'chemistry', 'englishlit', 'government', 'crk', 'geography', 'economics', 'irk', 'civiledu', 'insurance', 'currentaffairs', 'history'];

async function parseAndImport() {
  const client = new MongoClient(DB_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection('questions');

  console.log('Starting massive SQL parse...');

  const fileStream = fs.createReadStream(SQL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentTable = '';
  let insertCount = 0;
  
  // This is a naive regex parser. Because MySQL dumps format strings cleanly, we can do some basic parsing.
  // We'll look for: INSERT INTO `table` VALUES (row1),(row2);
  
  // To avoid huge memory spikes, we process line by line.
  
  for await (const line of rl) {
    if (line.startsWith('INSERT INTO')) {
      const match = line.match(/INSERT INTO `([^`]+)` VALUES /);
      if (match) {
        currentTable = match[1];
        
        if (!TARGET_SUBJECTS.includes(currentTable)) continue;

        // Strip the prefix and semicolon
        let valuesStr = line.replace(/INSERT INTO `[^`]+` VALUES /, '').trim();
        if (valuesStr.endsWith(';')) valuesStr = valuesStr.slice(0, -1);
        
        // This regex splits on `),(` but handles standard SQL dump formatting.
        // It's not a perfect SQL parser, but for this ALOC dataset it usually works.
        const rowRegex = /\((.*?)\)(?=(?:,\()|$)/g;
        
        let rowMatch;
        while ((rowMatch = rowRegex.exec(valuesStr)) !== null) {
          const rowData = rowMatch[1];
          // We need to parse CSV-like values, respecting single quotes.
          // Due to complex SQL escaping (e.g., \' ), a simple split by comma doesn't work.
          // Let's use a quick custom parser to extract the columns.
          
          let columns = [];
          let currentVal = '';
          let inQuotes = false;
          let escapeNext = false;
          
          for (let i = 0; i < rowData.length; i++) {
            const char = rowData[i];
            if (escapeNext) {
              currentVal += char;
              escapeNext = false;
              continue;
            }
            if (char === '\\') {
              escapeNext = true;
              currentVal += char;
              continue;
            }
            if (char === "'") {
              inQuotes = !inQuotes;
              currentVal += char;
              continue;
            }
            if (char === ',' && !inQuotes) {
              columns.push(currentVal.trim());
              currentVal = '';
              continue;
            }
            currentVal += char;
          }
          columns.push(currentVal.trim());

          // Clean up the columns (remove enclosing quotes, handle escaped quotes)
          columns = columns.map(col => {
            if (col.startsWith("'") && col.endsWith("'")) col = col.slice(1, -1);
            return col.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
          });

          // Match ALOC schema: id, question, optionA, optionB, optionC, optionD, section, image, answer, solution, examtype, examyear
          if (columns.length >= 12) {
            const external_id = `aloc_${currentTable}_${columns[0]}`;
            
            const questionData = {
              subject: currentTable,
              topic: columns[6] || 'General', // Using section as topic
              question_text: columns[1],
              options: [
                { option_letter: 'a', option_text: columns[2] },
                { option_letter: 'b', option_text: columns[3] },
                { option_letter: 'c', option_text: columns[4] },
                { option_letter: 'd', option_text: columns[5] }
              ],
              correct_option: columns[8].toLowerCase(),
              explanation: columns[9] || null,
              image_url: columns[7] || null,
              has_diagram: !!columns[7],
              diagram_svg: null,
              source: 'real_jamb_past_question',
              external_id: external_id,
              questionId: external_id,
              created_at: new Date(),
              updated_at: new Date()
            };

            // Upsert into DB
            await collection.updateOne(
              { external_id: external_id },
              { $set: questionData },
              { upsert: true }
            );
            insertCount++;
            
            if (insertCount % 500 === 0) {
              console.log(`Processed ${insertCount} questions...`);
            }
          }
        }
      }
    }
  }

  console.log(`\n================================`);
  console.log(`IMPORT COMPLETE! Total extracted: ${insertCount}`);
  console.log(`================================`);
  
  await client.close();
  process.exit(0);
}

parseAndImport().catch(console.error);
