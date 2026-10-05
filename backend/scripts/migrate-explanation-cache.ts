import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must be configured.');
const migrationPath = path.resolve(__dirname, '../drizzle/20261004_question_explanations.up.sql');
const source = fs.readFileSync(migrationPath, 'utf8');
const statements = source.split(';').map((statement) => statement.trim()).filter(Boolean);

async function main() {
  if (!process.argv.includes('--apply')) {
    console.log(`Dry run: ${statements.length} additive PostgreSQL statements are ready.`);
    console.log('Review backend/drizzle/20261004_question_explanations.up.sql; pass --apply to execute against DATABASE_URL.');
    return;
  }
  const db = postgres(databaseUrl!, { ssl: 'require', max: 1 });
  try {
    await db.begin(async (tx) => {
      for (const statement of statements) await tx.unsafe(statement);
    });
    console.log(`Applied ${statements.length} additive PostgreSQL statements.`);
  } finally {
    await db.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(`Explanation cache migration failed (${error?.code || error?.name || 'database_error'}). No credentials were printed.`);
  process.exitCode = 1;
});
