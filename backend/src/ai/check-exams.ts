import * as fs from 'fs';
const sqlContent = fs.readFileSync('C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql', 'utf8');

function extractRows(tableName: string) {
  const rows: string[][] = [];
  let searchIdx = 0;
  while ((searchIdx = sqlContent.indexOf(`INSERT INTO \`${tableName}\``, searchIdx)) !== -1) {
    const valuesIdx = sqlContent.indexOf('VALUES', searchIdx);
    if (valuesIdx === -1) break;
    let i = valuesIdx + 6;
    let inString = false;
    let escapeNext = false;
    let currentRow: string[] = [];
    let currentVal = '';
    let inTuple = false;

    for(; i < sqlContent.length; i++) {
      let char = sqlContent[i];
      if (escapeNext) { currentVal += char; escapeNext = false; continue; }
      if (char === '\\') { escapeNext = true; currentVal += char; continue; }
      if (char === "'") { inString = !inString; currentVal += char; continue; }
      if (!inString) {
        if (char === ';') { searchIdx = i + 1; break; }
        if (char === '(' && !inTuple) { inTuple = true; currentRow = []; currentVal = ''; continue; }
        if (char === ')') {
          if (inTuple) {
            currentRow.push(currentVal.trim());
            const cleanRow = currentRow.map(c => {
              if(c.startsWith("'") && c.endsWith("'")) c = c.slice(1, -1);
              return c.replace(/\\'/g, "'").replace(/\\\\/g, "\\").replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
            });
            rows.push(cleanRow);
            inTuple = false;
          }
          continue;
        }
        if (char === ',') {
          if (inTuple) { currentRow.push(currentVal.trim()); currentVal = ''; }
          continue;
        }
        if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
          if (inTuple) currentVal += char;
          continue;
        }
      }
      if (inTuple) currentVal += char;
    }
  }
  return rows;
}

console.log(extractRows('exams'));
