import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function run() {
    const res = await sql`SELECT question_text FROM questions WHERE question_text LIKE '%pmatrix%' LIMIT 2`;
    res.forEach(r => console.log(JSON.stringify(r.question_text)));
    process.exit(0);
}
run();
