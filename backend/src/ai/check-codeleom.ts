import * as fs from 'fs';

const SQL_FILE = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql';

const JAMB_SUBJECTS = {
  'Mathematics': 'mathematics',
  'English Language': 'english',
  'Physics': 'physics',
  'Geography': 'geography',
  'Economics': 'economics',
  'Biology': 'biology',
  'Government': 'government',
  'Lit in English': 'englishlit',
  'Chemistry': 'chemistry',
  'Agricultural Science': 'agriculture',
  'Christian Religion Studies': 'crk',
  'Commerce': 'commerce',
  'History': 'history',
  'Islamic Religious Knowledge': 'irk',
  'Principles of Accounts': 'accounting'
};

async function check() {
  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');

  const subjectsMap = new Map();
  const choicesMap = new Map();
  const qRows: any[] = [];

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

  const sRows = extractRows('subjects');
  sRows.forEach(r => {
    if(r.length >= 2) subjectsMap.set(r[0], r[1]);
  });
  
  const cRows = extractRows('choices');
  cRows.forEach(r => {
    if(r.length >= 6) {
      const key = `${r[1]}_${r[2]}`;
      if(!choicesMap.has(key)) choicesMap.set(key, []);
      choicesMap.get(key).push({ text: r[5], is_correct: r[4] === '1' });
    }
  });

  const qData = extractRows('questions');
  qData.forEach(r => qRows.push(r));

  let missingSubjCount = 0;
  let missingNormCount = 0;
  let missingChoicesCount = 0;
  let successCount = 0;

  for(const r of qRows) {
    if(r.length < 6) continue;
    const qus_no = r[1];
    const course_id = r[5];
    
    const subjectRaw = subjectsMap.get(course_id);
    if(!subjectRaw) { missingSubjCount++; continue; }
    
    const subjectNorm = (JAMB_SUBJECTS as any)[subjectRaw];
    if(!subjectNorm) { missingNormCount++; continue; }

    const key = `${course_id}_${qus_no}`;
    let choices = choicesMap.get(key);
    if(!choices || choices.length < 2) { missingChoicesCount++; continue; }

    successCount++;
  }

  console.log(`Missing raw subject: ${missingSubjCount}`);
  console.log(`Skipped non-JAMB subject: ${missingNormCount}`);
  console.log(`Missing choices: ${missingChoicesCount}`);
  console.log(`Success count: ${successCount}`);
}

check().catch(console.error);
