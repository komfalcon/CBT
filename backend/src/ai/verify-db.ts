import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';

async function verifyDatabase() {
  const client = new MongoClient(DB_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection('questions');

  console.log("--- FINAL DATABASE VERIFICATION ---\n");

  const totalQuestions = await collection.countDocuments();
  console.log(`Total questions in database: ${totalQuestions}`);

  const aiText = await collection.countDocuments({ source: 'ai_generated', diagram_svg: null });
  console.log(`AI-generated Text Questions: ${aiText}`);

  const aiDiagram = await collection.countDocuments({ source: 'ai_generated', diagram_svg: { $ne: null } });
  console.log(`AI-generated Diagram Questions (should be 0): ${aiDiagram}`);

  const realJamb = await collection.countDocuments({ source: 'real_jamb_past_question' });
  console.log(`Real JAMB Past Questions: ${realJamb}`);

  const realJambWithDiagrams = await collection.countDocuments({ source: 'real_jamb_past_question', has_diagram: true });
  console.log(`Real JAMB Questions WITH diagrams: ${realJambWithDiagrams}`);

  console.log('\nSample Real JAMB Question (to verify format):');
  const sample = await collection.findOne({ source: 'real_jamb_past_question' });
  console.log(JSON.stringify(sample, null, 2));

  await client.close();
  process.exit(0);
}

verifyDatabase().catch(console.error);
