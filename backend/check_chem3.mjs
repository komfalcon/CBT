import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(sql);

async function run() {
    console.log("Checking for raw isotopes/superscripts...");
    const res = await sql`SELECT question_text FROM questions WHERE question_text LIKE '%^{%' LIMIT 3`;
    console.log(res.map(r => r.question_text));

    process.exit(0);
}
run();
