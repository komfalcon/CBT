const fs = require('fs');
const path = require('path');

const filesToUpdate = ['src/features/auth/AuthPage.tsx', 'src/pages/ExamArenaLanding.tsx'];

for (const file of filesToUpdate) {
    const filePath = path.join(__dirname, 'frontend', file);
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove false demo numbers and add beta messaging
    content = content.replace(/100K\+ students/g, 'Beta Access');
    content = content.replace(/4\.9 average rating/g, 'Early Preview');
    content = content.replace(/4\.9 rating/g, 'Early Preview');
    content = content.replace(/0\+ practice questions/g, 'Growing Question Bank');
    content = content.replace(/1M\+ questions/g, 'Growing Question Bank');
    content = content.replace(/0\+ average score boost/g, 'AI-Powered Explanations');
    content = content.replace(/2,481 learners online/g, 'Beta Test Arena');
    content = content.replace(/68\/100/g, 'Beta');
    content = content.replace(/EXAM ARENA/g, 'Aurikrex Exam Arena');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated metrics in ${file}`);
}
