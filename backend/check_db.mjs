import { createClient } from '@libsql/client';
import { config } from 'dotenv';
config({ path: 'C:/Users/DELL/AURIKEX/CBT/backend/.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
  const rs = await client.execute('SELECT * FROM chat_sessions ORDER BY created_at DESC LIMIT 3');
  console.log(JSON.stringify(rs.rows, null, 2));
}
run();
