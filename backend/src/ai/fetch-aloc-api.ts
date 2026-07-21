import axios from 'axios';
import { MongoClient } from 'mongodb';

const TOKEN = process.argv[2];
if (!TOKEN) {
  console.error("Please provide the ALOC access token as an argument.");
  process.exit(1);
}

const DB_URI = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';

const SUBJECTS_TO_FETCH = [
  'mathematics',
  'english-language',
  'chemistry',
  'physics',
  'biology',
  'commerce',
  'accounting',
  'economics',
  'government',
  'geography',
  'literature-in-english',
  'christian-religious-studies'
];

const TARGET_PER_SUBJECT = 25000; 
const BATCH_SIZE = 40; 

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAlocApi() {
  console.log(`Connecting to MongoDB...`);
  const client = new MongoClient(DB_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection('questions');

  let totalInserted = 0;

  for (const subject of SUBJECTS_TO_FETCH) {
    console.log(`\n================================`);
    console.log(`Fetching ALOC API for: ${subject.toUpperCase()}`);
    console.log(`Target: Drain entire ALOC database (up to ${TARGET_PER_SUBJECT} max)`);
    console.log(`================================`);

    let subjectCount = 0;
    let cursor = null;
    
    while (subjectCount < TARGET_PER_SUBJECT) {
      const remaining = TARGET_PER_SUBJECT - subjectCount;
      const fetchLimit = remaining > BATCH_SIZE ? BATCH_SIZE : remaining;
      
      let url = `https://dev.aloc.com.ng/api/v1/questions?subject=${subject}&limit=${fetchLimit}`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }
      
      try {
        const res = await axios.get(url, {
          headers: {
            'X-API-Key': TOKEN
          }
        });

        const data = res.data.data;
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log(`\nAPI returned no more data for ${subject}. We've exhausted their DB for this subject! Moving on...`);
          break;
        }

        const bulkOps = [];
        let uniquePulled = 0;
        
        for (const q of data) {
          const options = [];
          if (q.options) {
            for (const key of Object.keys(q.options)) {
              options.push({ option_letter: key.toUpperCase(), option_text: q.options[key] });
            }
          }

          const external_id = `aloc_l1_${q.id}`;
          const questionData = {
            subject: subject,
            topic: q.category || 'General',
            question_text: q.text,
            options: options,
            correct_option: q.correctAnswer ? q.correctAnswer.toUpperCase() : null,
            explanation: null,
            image_url: q.imageUrl || null,
            has_diagram: !!q.imageUrl,
            diagram_svg: null,
            source: 'aloc_api_2026',
            external_id: external_id,
            questionId: external_id,
            created_at: new Date(),
            updated_at: new Date()
          };

          bulkOps.push({
            updateOne: {
              filter: { external_id: external_id },
              update: { $set: questionData },
              upsert: true
            }
          });
          uniquePulled++;
        }

        if (bulkOps.length > 0) {
          await collection.bulkWrite(bulkOps, { ordered: false });
          subjectCount += uniquePulled;
          totalInserted += uniquePulled;
          process.stdout.write(`\r✅ Synced ${subjectCount} unique questions for ${subject}...`);
        }

        cursor = res.data.pagination?.nextCursor;
        if (!cursor || !res.data.pagination?.hasMore) {
           console.log(`\nWe drained ALOC's entire database for ${subject} at ${subjectCount} questions! (No more pages)`);
           break;
        }

        await sleep(1500); 
        
      } catch (err: any) {
        if (err.response) {
          console.error(`\n❌ ALOC API Error [${err.response.status}]:`, err.response.data);
          if (err.response.status === 401 || err.response.status === 406) {
            console.error(`CRITICAL: API Key rejected! Out of credits or deactivated.`);
            process.exit(1);
          }
          if (err.response.status === 429) {
            console.error(`Rate limited! Sleeping for 10 seconds before continuing...`);
            await sleep(10000);
            continue;
          }
        } else {
          console.error(`\n❌ Network Error:`, err.message);
        }
        break; 
      }
    }
    console.log(""); 
  }

  console.log(`\n================================`);
  console.log(`ALOC ABSOLUTE DRAIN SYNC COMPLETE! Total new questions injected: ${totalInserted}`);
  console.log(`================================`);

  await client.close();
}

fetchAlocApi().catch(console.error);
