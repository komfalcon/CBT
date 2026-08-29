const fs = require('fs');
let s = fs.readFileSync('src/questions/search/search.service.ts', 'utf8');
s = s.replace(/indexany/g, 'indexQuestion');
s = s.replace(/deleteany/g, 'deleteQuestion');
s = s.replace(/searchanys/g, 'searchQuestions');
fs.writeFileSync('src/questions/search/search.service.ts', s);

let qs = fs.readFileSync('src/questions/questions.service.ts', 'utf8');
qs = qs.replace(/indexQuestionData/g, 'indexQuestion');
qs = qs.replace(/this\.searchService\.search\(/g, 'this.searchService.searchQuestions(');
qs = qs.replace(/removeQuestionFromIndex/g, 'deleteQuestion');
// fix implicit any error
qs = qs.replace(/id, index/g, 'id: any, index: any');
fs.writeFileSync('src/questions/questions.service.ts', qs);

let qr = fs.readFileSync('src/questions/questions.resolver.ts', 'utf8');
qr = qr.replace(/Promise<any>/g, 'Promise<any /* Question */>');
qr = qr.replace(/Object/g, 'String /* ObjectType */');
fs.writeFileSync('src/questions/questions.resolver.ts', qr);

let ai = fs.readFileSync('src/ai/ai.service.ts', 'utf8');
ai = ai.replace(/user\.ai_messages_remaining = \(user\.ai_messages_remaining \|\| 0\) - 1;/g, 'user.ai_messages_remaining = (user.ai_messages_remaining as number || 0) - 1;');
fs.writeFileSync('src/ai/ai.service.ts', ai);

let preSvg = fs.readFileSync('src/ai/pregenerate-svgs.ts', 'utf8');
preSvg = preSvg.replace(/@InjectModel\(Question\.name\)/g, '');
preSvg = preSvg.replace(/private\s+readonly\s+questionModel:\s+Model<any>,/g, '');
fs.writeFileSync('src/ai/pregenerate-svgs.ts', preSvg);

let auth = fs.readFileSync('src/auth/auth.service.ts', 'utf8');
auth = auth.replace(/role:\s*user\.role,/g, 'role: user.role as any,');
auth = auth.replace(/role:\s*UserRole\.STUDENT,/g, 'role: "student" as any,');
auth = auth.replace(/role:\s*newRole,/g, 'role: newRole as any,');
fs.writeFileSync('src/auth/auth.service.ts', auth);

let leader = fs.readFileSync('src/leaderboard/leaderboard.controller.ts', 'utf8');
leader = leader.replace(/@Query/g, '@Query()');
fs.writeFileSync('src/leaderboard/leaderboard.controller.ts', leader);

let mod = fs.readFileSync('src/integration/integration.module.ts', 'utf8');
mod = mod.replace(/import.*?handoff\.schema.*?\\n/g, '');
fs.writeFileSync('src/integration/integration.module.ts', mod);

console.log('Fixed names!');
