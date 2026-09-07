import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(sql);

async function run() {
    const res = await sql`SELECT question_text, explanation FROM questions WHERE question_text LIKE '%orbital velocity%' LIMIT 1`;
    console.log("TEXT:", res[0].question_text);
    console.log("EXPLANATION:", res[0].explanation);
    
    process.exit(0);
}
run();
