import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const runMigrate = async () => {
  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const sqlContent = fs.readFileSync('./drizzle/' + fs.readdirSync('./drizzle').find(f => f.endsWith('.sql')), 'utf8');
    const statements = sqlContent
      .split('--> statement-breakpoint')
      .map(s => s.trim().replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS'))
      .filter(s => s);

    console.log('Running raw SQL migrations...');
    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (err) {
        console.error('Failed statement:', stmt);
        throw err;
      }
    }
    console.log('Migrations complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
};

runMigrate();
