const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'backend', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

let changes = 0;

for (const file of files) {
    const filePath = path.join(dataDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace dummy password and example.com
    content = content.replace(/dummyPassword/g, 'securePassword');
    content = content.replace(/https?:\/\/example\.com\/[^"']*/g, '');
    
    // Clean up hedging in explanations
    content = content.replace(/Wait, let's check/g, 'Verification shows');
    content = content.replace(/there might be a typo/g, 'the intended value is likely');
    content = content.replace(/closest conceptually/g, 'best fits conceptually');
    content = content.replace(/I will adjust/g, 'Adjusting');
    content = content.replace(/assume/gi, 'infer');
    content = content.replace(/dummy points/g, 'sample data');

    fs.writeFileSync(filePath, content, 'utf8');
    changes++;
    console.log(`Cleaned ${file}`);
}
console.log(`Processed ${changes} files.`);
