import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(sql);

async function run() {
    console.log("Checking for \ce...");
    const res1 = await sql`SELECT question_text FROM questions WHERE question_text LIKE '%\\ce{%' LIMIT 2`;
    console.log(res1.map(r => r.question_text));

    console.log("Checking for standard H_2O...");
    const res2 = await sql`SELECT question_text FROM questions WHERE question_text LIKE '%H_2O%' LIMIT 2`;
    console.log(res2.map(r => r.question_text));
    
    console.log("Checking for \rightarrow...");
    const res3 = await sql`SELECT question_text FROM questions WHERE question_text LIKE '%\\rightarrow%' LIMIT 2`;
    console.log(res3.map(r => r.question_text));

    process.exit(0);
}
run();
