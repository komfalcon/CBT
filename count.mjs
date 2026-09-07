import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
c.execute("SELECT count(*) as count FROM questions").then(r => console.log(r.rows[0].count)).catch(console.error);
