import { MongoClient } from 'mongodb';

async function checkCounts() {
  const client = new MongoClient('mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority');
  await client.connect();
  const db = client.db();
  
  const aiCount = await db.collection('questions').countDocuments({ source: 'ai_generated' });
  const svgCount = await db.collection('questions').countDocuments({ diagram_svg: { $ne: null } });
  
  console.log('AI Questions Generated:', aiCount);
  console.log('SVG Diagrams Generated:', svgCount);
  
  await client.close();
  process.exit(0);
}

checkCounts().catch(console.error);
