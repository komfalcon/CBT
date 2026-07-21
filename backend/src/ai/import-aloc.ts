import { MongoClient } from 'mongodb';
import axios from 'axios';

const ACCESS_TOKEN = 'aloc_4v1oVQKLcCciYczCaxozjk8fam8DIUleDLPJOk2R';
const DB_URI = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';

const SUBJECTS = ['mathematics', 'english'];
const CALLS_PER_SUBJECT = 50; // 50 calls * 2 subjects = 100 calls
const QUESTIONS_PER_CALL = 7; // Max allowed by ALOC API

async function importAloc() {
  const client = new MongoClient(DB_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection('questions');

  let totalImported = 0;
  let totalDuplicates = 0;

  console.log(`Starting ALOC API Import with token: ${ACCESS_TOKEN}`);

  for (const subject of SUBJECTS) {
    console.log(`\n--- Fetching ${subject.toUpperCase()} ---`);
    for (let i = 0; i < CALLS_PER_SUBJECT; i++) {
      try {
        const url = `https://questions.aloc.com.ng/api/q/${QUESTIONS_PER_CALL}?subject=${subject}`;
        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'AccessToken': ACCESS_TOKEN
          }
        });

        const data = response.data.data;
        if (!data || !Array.isArray(data)) {
          console.error(`Call ${i + 1}/${CALLS_PER_SUBJECT} for ${subject} returned unexpected data format.`);
          continue;
        }

        let newCount = 0;
        let dupCount = 0;

        for (const item of data) {
          // Check if question already exists by ALOC id to prevent duplicates across tokens
          const exists = await collection.findOne({ external_id: `aloc_${item.id}` });
          if (exists) {
            dupCount++;
            totalDuplicates++;
            continue;
          }

          // Map ALOC format to our database format
          const newQuestion = {
            subject: subject,
            topic: item.topic || 'General',
            question_text: item.question,
            options: [
              { option_letter: 'a', option_text: item.option.a || '' },
              { option_letter: 'b', option_text: item.option.b || '' },
              { option_letter: 'c', option_text: item.option.c || '' },
              { option_letter: 'd', option_text: item.option.d || '' }
            ],
            correct_option: item.answer ? item.answer.toLowerCase() : 'a',
            explanation: item.solution || null,
            image_url: item.image || null,
            has_diagram: !!item.image,
            diagram_svg: null, // Wipe SVG just in case
            source: 'real_jamb_past_question',
            external_id: `aloc_${item.id}`,
            created_at: new Date(),
            updated_at: new Date()
          };

          await collection.insertOne(newQuestion);
          newCount++;
          totalImported++;
        }

        console.log(`Call ${i + 1}/${CALLS_PER_SUBJECT} for ${subject}: Imported ${newCount}, Skipped ${dupCount} duplicates.`);
        
        // Wait 1 second between calls to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));

      } catch (err: any) {
        console.error(`Call ${i + 1}/${CALLS_PER_SUBJECT} for ${subject} failed: ${err.message}`);
        // If 429 Too Many Requests or 401 Unauthorized, we might be out of credits
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.log(`\n🚨 STOPPING: API returned ${err.response.status}. Your token might be out of credits.`);
          await client.close();
          process.exit(1);
        }
      }
    }
  }

  console.log(`\n======================================`);
  console.log(`IMPORT COMPLETE!`);
  console.log(`Total New Questions Imported: ${totalImported}`);
  console.log(`Total Duplicates Skipped: ${totalDuplicates}`);
  console.log(`======================================\n`);

  await client.close();
  process.exit(0);
}

importAloc();
