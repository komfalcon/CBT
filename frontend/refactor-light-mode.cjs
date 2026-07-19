const fs = require('fs');
const path = require('path');

function replaceClasses(content) {
  // Convert standard text colors to theme variables
  content = content.replace(/\btext-white\b/g, 'text-text-primary dark:text-white');
  content = content.replace(/\btext-slate-200\b/g, 'text-text-primary dark:text-slate-200');
  content = content.replace(/\btext-slate-300\b/g, 'text-text-secondary dark:text-slate-300');
  content = content.replace(/\btext-slate-400\b/g, 'text-text-muted dark:text-slate-400');
  content = content.replace(/\btext-slate-600\b/g, 'text-text-muted dark:text-slate-600');
  
  // Specifically fix buttons where text-white is correct because background is primary/gradient
  // E.g. 'text-text-primary dark:text-white' inside a button that has a gradient background.
  // Actually, a simpler way is to replace hover:text-white with hover:text-text-primary
  content = content.replace(/\bhover:text-white\b/g, 'hover:text-text-primary dark:hover:text-white');

  return content;
}

const files = [
  path.join(__dirname, 'src/pages/LandingPage.tsx'),
  path.join(__dirname, 'src/features/auth/AuthPage.tsx'),
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = replaceClasses(content);
  // Revert buttons with primary/gradient to text-white
  content = content.replace(/font-bold text-text-primary dark:text-white shadow-xl shadow-primary/g, 'font-bold text-white shadow-xl shadow-primary');
  content = content.replace(/px-5 py-2\.5 text-\[13px\] font-bold text-text-primary dark:text-white/g, 'px-5 py-2.5 text-[13px] font-bold text-white');
  content = content.replace(/bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center font-display font-bold text-\[13px\] text-text-primary dark:text-white/g, 'bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center font-display font-bold text-[13px] text-white');
  
  fs.writeFileSync(file, content);
  console.log('Processed', file);
}
