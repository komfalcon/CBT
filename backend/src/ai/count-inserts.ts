import * as fs from 'fs';
const sqlPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql';
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

const qMatch = sqlContent.match(/INSERT INTO `questions`/g) || [];
console.log(`Found ${qMatch.length} INSERT INTO questions statements`);

const cMatch = sqlContent.match(/INSERT INTO `choices`/g) || [];
console.log(`Found ${cMatch.length} INSERT INTO choices statements`);
