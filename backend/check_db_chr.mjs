import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(sql);

async function run() {
    const res = await sql`SELECT explanation FROM questions WHERE explanation LIKE '%' || CHR(13) || 'ight%' LIMIT 3`;
    console.log("EXPLANATIONS:");
    res.forEach(r => {
        // print exactly the char codes around ight
        const idx = r.explanation.indexOf('ight');
        console.log("Chars before 'ight':", r.explanation.charCodeAt(idx-1), r.explanation.charCodeAt(idx-2));
    });
    process.exit(0);
}
run();
