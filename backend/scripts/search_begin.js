const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('_questions.json'));

for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const questions = data.questions || [];
    
    // Search for questions containing "\begin{" in question_text, latex, diagram_svg, or options
    const matches = questions.filter(q => {
      const text = q.question_text || '';
      const latex = q.latex || '';
      const diag = q.diagram_svg || '';
      const optionsText = (q.options || []).map(o => o.text || '').join(' ');
      return text.includes('\\begin{') || latex.includes('\\begin{') || diag.includes('\\begin{') || optionsText.includes('\\begin{');
    });

    if (matches.length > 0) {
      console.log(`File: ${file} has ${matches.length} matches.`);
      // Print first match detail
      const m = matches[0];
      console.log(`- Match ID: ${m.id}`);
      console.log(`- Question Text: ${m.question_text}`);
      console.log(`- Latex: ${m.latex}`);
      console.log(`- Diagram SVG: ${m.diagram_svg}`);
      console.log('-------------------------------------------');
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}
