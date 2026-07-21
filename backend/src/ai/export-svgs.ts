import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';

async function exportDiagrams() {
  const client = new MongoClient('mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority');
  await client.connect();
  const db = client.db();
  
  // Fetch 20 random questions with diagrams
  const questions = await db.collection('questions')
    .aggregate([
      { $match: { diagram_svg: { $ne: null } } },
      { $sample: { size: 20 } }
    ])
    .toArray();

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Diagram Preview</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; padding: 2rem; color: #111827; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; }
        .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .subject { display: inline-block; padding: 0.25rem 0.75rem; background: #e0e7ff; color: #4338ca; border-radius: 999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; text-transform: uppercase; }
        .question { font-size: 1rem; font-weight: 500; margin-bottom: 1.5rem; line-height: 1.5; }
        .diagram { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 1rem; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 200px; }
        .diagram svg { max-width: 100%; height: auto; }
        h1 { margin-bottom: 2rem; text-align: center; }
      </style>
    </head>
    <body>
      <h1>AI Generated Diagrams Preview (Random Sample)</h1>
      <div class="grid">
  `;

  for (const q of questions) {
    htmlContent += `
        <div class="card">
          <span class="subject">${q.subject || 'Unknown'} - ${q.topic || 'Unknown'}</span>
          <div class="question">${q.question_text || 'No text'}</div>
          <div class="diagram">
            ${q.diagram_svg}
          </div>
        </div>
    `;
  }

  htmlContent += `
      </div>
    </body>
    </html>
  `;

  // Write to artifacts
  const outPath = path.join('C:\\Users\\DELL\\.gemini\\antigravity\\brain\\d131deb9-f35b-4f58-b159-c90cd70d09a1', 'diagrams_preview.html');
  fs.writeFileSync(outPath, htmlContent, 'utf-8');
  
  console.log('Saved preview to:', outPath);

  await client.close();
  process.exit(0);
}

exportDiagrams().catch(console.error);
