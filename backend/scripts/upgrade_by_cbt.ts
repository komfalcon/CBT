import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';

dotenv.config();

async function upgrade() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
  });

  const cbtKey = process.argv[2] || 'CBT-NM9AEA';
  const formattedKey = cbtKey.trim().toUpperCase();
  const hash = createHash('sha256').update(formattedKey).digest('hex');

  const res = await client.execute({
    sql: 'UPDATE users SET subscription_tier = ?, ai_messages_remaining = ? WHERE cbt_key_hash = ? RETURNING email, cbt_key, subscription_tier',
    args: ['max', 50, hash]
  });

  if (res.rows.length > 0) {
    console.log('Upgraded:', res.rows[0].email, cbtKey, res.rows[0].subscription_tier);
  } else {
    console.log('User with CBT Key', cbtKey, 'not found.');
  }
}
upgrade().catch(console.error);
