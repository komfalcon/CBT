import * as dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import axios from 'axios';

async function migrateCbtUsersToCentral() {
  console.log('================================================================');
  console.log('🚀 MIGRATING REMAINING CBT STUDENTS TO AURIKREX-CENTRAL');
  console.log('================================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is missing in CBT .env file');
    process.exit(1);
  }

  const client = postgres(dbUrl, { max: 1 });
  const db = drizzle(client, { schema });
  const centralUrl = process.env.CENTRAL_API_URL || 'https://aurikrex-central.pxxl.click';
  const s2sSecret = process.env.AURIKREX_CENTRAL_S2S_SECRET || '';

  const cbtUsers = await db.select().from(schema.users);
  console.log(`Found ${cbtUsers.length} total CBT user(s) in database.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const user of cbtUsers) {
    let synced = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(` Syncing user [Attempt ${attempt}]: ${user.email} (${user.fullName})...`);
        const syncRes = await axios.post(
          `${centralUrl}/api/v1/auth/sync-user`,
          {
            email: user.email,
            passwordHash: user.passwordHash,
            fullName: user.fullName,
            aurikrexId: user.aurikrex_id || undefined,
            role: user.role || 'student',
            mfaSecret: user.mfa_secret || undefined,
            mfaEnabled: user.mfa_enabled || false,
          },
          {
            headers: {
              'X-Central-Api-Key': s2sSecret,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          },
        );

        console.log(`   ✅ Synced! Central User ID: ${syncRes.data?.id || syncRes.data?.user?.id || 'OK'}`);
        successCount++;
        synced = true;
        break;
      } catch (err: any) {
        if (attempt === 3) {
          console.error(`   ❌ Failed to sync user ${user.email}:`, err?.response?.data || err?.message || err);
          failCount++;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 MIGRATION PASS COMPLETE! Success: ${successCount} | Failed: ${failCount}`);
  console.log('================================================================');

  await client.end();
}

migrateCbtUsersToCentral().catch((err) => {
  console.error('Migration runner error:', err);
  process.exit(1);
});
