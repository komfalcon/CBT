import * as fs from 'fs';
const sqlPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql';
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

const idx = sqlContent.indexOf('equitable');
if (idx !== -1) {
    console.log(sqlContent.substring(Math.max(0, idx - 100), idx + 100));
} else {
    console.log('Not found');
}
