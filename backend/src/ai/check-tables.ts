import * as fs from 'fs';
const SQL_FILE = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql';
const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');

const regex = /CREATE TABLE `([^`]+)`/g;
let match;
const tables = [];
while ((match = regex.exec(sqlContent)) !== null) {
  tables.push(match[1]);
}
console.log(tables);
