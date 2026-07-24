const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const original = content;
      content = content.replace(/from-white to-slate-400/g, 'from-slate-800 to-slate-500 dark:from-white dark:to-slate-400');
      content = content.replace(/from-white via-slate-100 to-slate-500/g, 'from-slate-800 via-slate-600 to-slate-500 dark:from-white dark:via-slate-100 dark:to-slate-500');
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed gradients in', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
