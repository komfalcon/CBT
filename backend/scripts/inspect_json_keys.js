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
    if (questions.length > 0) {
      console.log(`File: ${file}`);
      console.log(`- Total Questions: ${questions.length}`);
      console.log(`- Keys in first question:`, Object.keys(questions[0]));
      
      // Let's check if any question has a non-null latex or diagram_svg field
      const withLatex = questions.filter(q => q.latex);
      const withDiagram = questions.filter(q => q.diagram_svg);
      console.log(`- With latex: ${withLatex.length}`);
      console.log(`- With diagram_svg: ${withDiagram.length}`);
      
      if (withLatex.length > 0) {
        console.log(`  * Sample latex:`, withLatex[0].latex.substring(0, 100));
      }
      if (withDiagram.length > 0) {
        console.log(`  * Sample diagram_svg:`, withDiagram[0].diagram_svg.substring(0, 100));
      }
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}
