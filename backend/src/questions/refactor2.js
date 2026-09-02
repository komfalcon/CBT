const fs = require('fs');
let code = fs.readFileSync('C:/Users/DELL/AURIKREX/CBT/backend/src/questions/questions.service.ts', 'utf8');

code = code.replace(/change_reason: payload\.change_reason,\r?\n\s*\}\);/g, 'change_reason: payload.change_reason\n    }];');
code = code.replace(/change_reason: \`Rollback to version \$\{versionNumber\}\`,\r?\n\s*\}\);/g, 'change_reason: \`Rollback to version \$\{versionNumber\}\`\n    }];');

fs.writeFileSync('C:/Users/DELL/AURIKREX/CBT/backend/src/questions/questions.service.ts', code);
