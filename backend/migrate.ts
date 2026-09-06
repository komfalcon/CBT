import { createClient } from '@libsql/client';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const libsqlClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function migrate() {
    console.log("Starting migration (with chunking)...");
    
    const tables = [
        'users', 'questions', 'exam_sessions', 'exam_results', 
        'syllabus_trackers', 'timetables', 'payment_logs', 
        'chat_sessions', 'handoffs', 'integration_learning_events'
    ];

    for (const tableName of tables) {
        console.log(`Migrating ${tableName}...`);
        let rows = [];
        try {
            const result = await libsqlClient.execute(`SELECT * FROM ${tableName}`);
            rows = result.rows;
        } catch(e) {
            console.log(`Failed to fetch from Turso for ${tableName}:`, e.message);
            continue;
        }
        
        if (rows.length === 0) {
            console.log(`  No data in ${tableName}, skipping.`);
            continue;
        }

        const formattedRows = rows.map(row => {
            const newRow: any = { ...row };
            
            for (const key in newRow) {
                // Handle booleans
                const boolFields = ['mfa_enabled', 'is_bonus', 'has_diagram', 'exchanged'];
                if (boolFields.includes(key)) {
                    newRow[key] = newRow[key] === 1;
                }

                // Handle JSON
                const jsonFields = ['exam_subject_combination', 'accessibility_preferences', 'device_fingerprints', 'options', 'media', 'versions', 'tags', 'embedding_vector', 'subjects', 'questions', 'answers', 'warnings', 'subject_scores', 'questions_snapshot', 'completed_topics', 'sessions', 'messages', 'scope', 'data'];
                if (jsonFields.includes(key) && typeof newRow[key] === 'string') {
                    try {
                        newRow[key] = JSON.parse(newRow[key]);
                    } catch (e) {}
                }

                // Handle timestamps
                const timeFields = ['verification_code_expires', 'password_reset_expires', 'lockout_until', 'last_login', 'ai_messages_last_reset', 'created_at', 'updated_at', 'approved_at', 'started_at', 'completed_at', 'verified_at', 'expires_at', 'occurred_at'];
                if (timeFields.includes(key) && typeof newRow[key] === 'number') {
                    newRow[key] = new Date(newRow[key] * 1000);
                }
            }
            return newRow;
        });

        // Postgres MAX_PARAMETERS is 65535.
        // We will insert in chunks of 500 rows to be extremely safe.
        const chunkSize = 500;
        let inserted = 0;

        for (let i = 0; i < formattedRows.length; i += chunkSize) {
            const chunk = formattedRows.slice(i, i + chunkSize);
            try {
                await sql`INSERT INTO ${sql(tableName)} ${sql(chunk)} ON CONFLICT DO NOTHING`;
                inserted += chunk.length;
                console.log(`  ...inserted chunk of ${chunk.length}, total: ${inserted}/${formattedRows.length}`);
            } catch (e) {
                console.error(`  Failed to insert chunk into ${tableName}: `, e.message);
            }
        }
        console.log(`  Finished ${tableName}. Total migrated: ${inserted}`);
    }

    console.log("Migration complete!");
    process.exit(0);
}

migrate().catch(console.error);
