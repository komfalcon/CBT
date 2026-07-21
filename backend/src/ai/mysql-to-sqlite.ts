import * as fs from 'fs';
import { execSync } from 'child_process';

const sqlPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql';
const cleanedPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\cleaned.sql';
const dbPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon.db';

console.log("Cleaning SQL dump for SQLite...");
let sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Replace MySQL specific syntax to make it SQLite compatible
sqlContent = sqlContent.replace(/ENGINE=InnoDB.*?;/g, ';');
sqlContent = sqlContent.replace(/ENGINE=MyISAM.*?;/g, ';');
sqlContent = sqlContent.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
sqlContent = sqlContent.replace(/int\(\d+\)/gi, 'INTEGER');
sqlContent = sqlContent.replace(/tinyint\(\d+\)/gi, 'INTEGER');
sqlContent = sqlContent.replace(/varchar\(\d+\)/gi, 'TEXT');
sqlContent = sqlContent.replace(/char\(\d+\)/gi, 'TEXT');
sqlContent = sqlContent.replace(/ timestamp /gi, ' TEXT ');
sqlContent = sqlContent.replace(/ time /gi, ' TEXT ');
sqlContent = sqlContent.replace(/ ON UPDATE CURRENT_TIMESTAMP/gi, '');
sqlContent = sqlContent.replace(/ DEFAULT '0000-00-00 00:00:00'/gi, '');
sqlContent = sqlContent.replace(/ DEFAULT CURRENT_TIMESTAMP/gi, '');
sqlContent = sqlContent.replace(/ DEFAULT '\w+'/gi, '');
sqlContent = sqlContent.replace(/ COLLATE .*?,/gi, ',');
sqlContent = sqlContent.replace(/ COLLATE .*? /gi, ' ');
sqlContent = sqlContent.replace(/\\'/g, "''"); // MySQL escaping to SQLite escaping

// Remove all lines starting with /*! ... */
sqlContent = sqlContent.replace(/\/\*![\s\S]*?\*\//g, '');

fs.writeFileSync(cleanedPath, sqlContent);

console.log("Loading into SQLite...");
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

// Execute SQLite
try {
  execSync(`sqlite3 "${dbPath}" < "${cleanedPath}"`);
  console.log("Database created successfully!");
} catch (e: any) {
  console.error("Failed to load into sqlite:", e.message);
}
