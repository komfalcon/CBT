const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src').filter(f => f.endsWith('.ts') && !f.includes('schemas\\') && !f.includes('schemas/'));

files.forEach(file => {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let changed = false;
  
  const newLines = [];
  let inMongooseModule = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle mongoose imports
    if (line.includes("from '@nestjs/mongoose'") || line.includes("from 'mongoose'") || line.includes("import * as mongoose")) {
      changed = true;
      continue;
    }
    
    if (line.includes('MongooseModule.forFeature')) {
      changed = true;
      if (!line.includes(']')) {
        inMongooseModule = true;
      }
      continue;
    }
    
    if (inMongooseModule) {
      changed = true;
      if (line.includes(']')) {
        inMongooseModule = false;
      }
      continue;
    }
    
    // Handle user.schema imports
    if (line.includes('schemas/user.schema') || line.includes('schemas\\\\user.schema')) {
      changed = true;
      const match = line.match(/import\s+{([^}]*?)}\s+from/);
      if (match) {
        const imports = match[1];
        let needed = imports.split(',').map(x => x.trim()).filter(x => 
          !['User', 'UserSchema', 'UserDocument'].includes(x)
        );
        if (needed.length > 0) {
          const dirLevels = file.split(/[\/\\\\]/).length - 3;
          const prefix = dirLevels > 0 ? '../'.repeat(dirLevels) : './';
          newLines.push(`import { ${needed.join(', ')} } from '${prefix}users/utils';`);
        }
      }
      continue;
    }
    
    // Handle other schemas
    if (line.includes('schemas/') || line.includes('schemas\\\\')) {
      changed = true;
      continue;
    }
    
    newLines.push(line);
  }
  
  if (changed) {
    fs.writeFileSync(file, newLines.join('\n'));
  }
});
console.log('Fixed imports line by line');
