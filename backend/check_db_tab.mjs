import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(sql);

async function run() {
    const res = await sql`SELECT explanation FROM questions WHERE explanation LIKE '%' || CHR(9) || 'ext%' LIMIT 3`;
    console.log("EXPLANATIONS (TEXT):");
    res.forEach(r => console.log(r.explanation.includes(String.fromCharCode(9))));
    process.exit(0);
}
run();
