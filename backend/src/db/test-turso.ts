import * as dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  const url = process.env.TURSO_DATABASE_URL!.replace('libsql://', 'https://');
  const token = process.env.TURSO_AUTH_TOKEN!;

  const stmt = `CREATE TABLE IF NOT EXISTS chat_sessions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    messages text,
    created_at integer,
    updated_at integer
  );`;

  const response = await fetch(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql: stmt } },
        { type: "close" }
      ]
    })
  });

  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text);
};
run();
