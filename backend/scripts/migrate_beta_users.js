const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  console.log('Migrating all users to Max tier with 20 daily AI messages...');
  const res = await sql`
    UPDATE users 
    SET subscription_tier = 'max', 
        ai_messages_remaining = 20 
    RETURNING id, email, subscription_tier, ai_messages_remaining
  `;
  console.log(`Successfully migrated ${res.length} users:`);
  for (const u of res) {
    console.log(`- ${u.email}: tier=${u.subscription_tier}, ai_remaining=${u.ai_messages_remaining}`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
