import { createClient } from '@libsql/client';
import { config } from 'dotenv';
config({ path: 'C:/Users/DELL/AURIKEX/CBT/backend/.env' });
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/db/schema.js';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});
const db = drizzle(client, { schema });

async function run() {
  const rs = await db.select().from(schema.chat_sessions).limit(1);
  console.log("Type of messages:", typeof rs[0].messages);
  console.log("Is array?", Array.isArray(rs[0].messages));
}
run();
