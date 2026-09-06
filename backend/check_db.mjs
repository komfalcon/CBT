import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(sql);

async function run() {
    const res = await sql`SELECT question_text FROM questions WHERE question_text LIKE '%Carnot engine%' LIMIT 1`;
    console.log("Q1:", res[0].question_text);
    
    const res2 = await sql`SELECT question_text FROM questions WHERE question_text LIKE '%radioactive nucleus%' LIMIT 1`;
    console.log("Q2:", res2[0].question_text);
    
    process.exit(0);
}
run();
