import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';

async function run() {
  const client = new MongoClient(DB_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection('questions');

  console.log("--- SUBJECT & TOPIC COUNT BREAKDOWN ---");

  const pipeline = [
    {
      $group: {
        _id: { subject: "$subject", topic: "$topic" },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.subject": 1, "count": -1 }
    }
  ];

  const results = await collection.aggregate(pipeline).toArray();

  const breakdown: Record<string, { total: number; topics: Record<string, number> }> = {};

  for (const item of results) {
    const subject = item._id.subject || 'unknown';
    const topic = item._id.topic || 'General';
    const count = item.count;

    if (!breakdown[subject]) {
      breakdown[subject] = { total: 0, topics: {} };
    }
    breakdown[subject].total += count;
    breakdown[subject].topics[topic] = count;
  }

  for (const [subject, data] of Object.entries(breakdown)) {
    console.log(`\nSubject: ${subject.toUpperCase()} (Total: ${data.total})`);
    for (const [topic, count] of Object.entries(data.topics)) {
      console.log(`  - ${topic}: ${count}`);
    }
  }

  await client.close();
  process.exit(0);
}

run().catch(console.error);
