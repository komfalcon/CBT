import postgres from 'postgres';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is missing from .env');
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require', max: 5 });

async function run() {
  const email = 'falcon@aurikrex.com';
  const plainPassword = 'KoRex1025$';
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const now = new Date();

  console.log(`[CBT Seed] Upserting admin account for ${email}...`);

  try {
    const existing = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;

    if (existing.length > 0) {
      await sql`
        UPDATE users
        SET password_hash = ${passwordHash},
            role = 'super_admin',
            account_status = 'active',
            updated_at = ${now}
        WHERE LOWER(email) = LOWER(${email})
      `;
      console.log(`[CBT Seed] Successfully updated admin account ${email} password & role to super_admin.`);
    } else {
      const id = uuidv4();
      const aurikrexId = 'AKX-FALCON1';
      await sql`
        INSERT INTO users (
          id, aurikrex_id, full_name, email, password_hash, role, account_status, auri_coins_balance, created_at, updated_at
        ) VALUES (
          ${id}, ${aurikrexId}, 'Falcon Omotosho', ${email}, ${passwordHash}, 'super_admin', 'active', 50000, ${now}, ${now}
        )
      `;
      console.log(`[CBT Seed] Successfully created super_admin account for ${email}.`);
    }
  } catch (err: any) {
    console.error('[CBT Seed] Database error:', err.message);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
