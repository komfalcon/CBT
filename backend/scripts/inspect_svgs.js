const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const files = ['physics_questions.json', 'mathematics_questions.json'];

for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const questions = data.questions || [];
    
    // Find questions with diagram_svg
    const withDiagram = questions.filter(q => q.diagram_svg);
    console.log(`===========================================`);
    console.log(`File: ${file}`);
    console.log(`Total questions with diagram_svg: ${withDiagram.length}`);
    
    for (let i = 0; i < Math.min(3, withDiagram.length); i++) {
      const q = withDiagram[i];
      console.log(`- Question ID: ${q.id}`);
      console.log(`- Question Text: ${q.question_text}`);
      console.log(`- Diagram SVG: ${q.diagram_svg}`);
      console.log(`- Latex: ${q.latex}`);
      console.log('-------------------------------------------');
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}
