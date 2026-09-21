const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  const users = await sql`SELECT id, email, full_name, subscription_tier, role, account_status FROM users`;
  console.log('Total users:', users.length);
  for (const u of users) {
    console.log(`- ${u.email} | tier: ${u.subscription_tier} | role: ${u.role} | status: ${u.account_status}`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
