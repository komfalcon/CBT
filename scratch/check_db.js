const postgres = require('postgres');
const sql = postgres('postgresql://falcon:Korex1025%24@cbtaurikex-db.postgres.database.azure.com:5432/postgres?sslmode=require');

async function check() {
  const total = await sql`SELECT COUNT(*) FROM questions`;
  const withDiagram = await sql`SELECT COUNT(*) FROM questions WHERE has_diagram = true OR diagram_svg IS NOT NULL`;
  const bySubject = await sql`SELECT subject, COUNT(*) as total, COUNT(CASE WHEN has_diagram = true OR diagram_svg IS NOT NULL THEN 1 END) as diagram_count FROM questions GROUP BY subject ORDER BY diagram_count DESC`;
  
  const sampleDiagramQ = await sql`SELECT id, subject, topic, question_text, has_diagram, SUBSTRING(diagram_svg FROM 1 FOR 60) as svg_snippet FROM questions WHERE has_diagram = true OR diagram_svg IS NOT NULL LIMIT 5`;
  
  const targetQ = await sql`SELECT id, subject, topic, question_text, has_diagram, diagram_svg FROM questions WHERE question_text LIKE '%first-order linear differential equation%' OR id = 'Q-13' LIMIT 5`;

  const furtherMathsDiagrams = await sql`SELECT id, subject, topic, question_text, has_diagram, SUBSTRING(diagram_svg FROM 1 FOR 60) as svg_snippet FROM questions WHERE LOWER(subject) LIKE '%further%' AND (has_diagram = true OR diagram_svg IS NOT NULL) LIMIT 5`;

  console.log('--- TOTAL QUESTIONS IN DB ---', total[0].count);
  console.log('--- TOTAL WITH DIAGRAM IN DB ---', withDiagram[0].count);
  console.log('--- BY SUBJECT BREAKDOWN ---');
  console.table(bySubject);
  console.log('--- TARGET QUESTION CHECK (Q-13 / Differential Equations) ---', JSON.stringify(targetQ, null, 2));
  console.log('--- FURTHER MATHS DIAGRAM SAMPLE ---', JSON.stringify(furtherMathsDiagrams, null, 2));
  await sql.end();
}

check().catch(console.error);
