import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(sql);

async function run() {
    console.log("=== ENTHALPY (to) ===");
    const res1 = await sql`SELECT question_text FROM questions WHERE question_text LIKE '%393.5%' LIMIT 1`;
    console.log(JSON.stringify(res1[0]?.question_text));

    console.log("=== ELECTRON CONFIG ===");
    const res2 = await sql`SELECT options FROM questions WHERE options::text LIKE '%textsuperscript%' LIMIT 1`;
    console.log(JSON.stringify(res2[0]?.options));

    console.log("=== AC CIRCUIT (tan, Omega) ===");
    const res3 = await sql`SELECT question_text, explanation FROM questions WHERE question_text LIKE '%phase difference between the current%' LIMIT 1`;
    console.log("Q:", JSON.stringify(res3[0]?.question_text));
    console.log("E:", JSON.stringify(res3[0]?.explanation));

    process.exit(0);
}
run();
