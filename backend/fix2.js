const fs = require('fs');

function replaceFile(path, from, to) {
  let c = fs.readFileSync(path, 'utf8');
  c = c.replace(new RegExp(from, 'g'), to);
  fs.writeFileSync(path, c);
}

replaceFile('src/auth/decorators/roles.decorator.ts', '\\.\\.\\/users\\/utils', '../../users/utils');
replaceFile('src/auth/guards/roles.guard.ts', '\\.\\.\\/users\\/utils', '../../users/utils');
replaceFile('src/auth/types/jwt-payload.type.ts', '\\.\\.\\/users\\/utils', '../../users/utils');

replaceFile('src/auth/strategies/jwt-refresh.strategy.ts', 'DB_CONNECTION', 'DRIZZLE');
replaceFile('src/auth/strategies/jwt.strategy.ts', 'DB_CONNECTION', 'DRIZZLE');
replaceFile('src/leaderboard/leaderboard.controller.ts', 'DB_CONNECTION', 'DRIZZLE');
replaceFile('src/ai/pregenerate-svgs.ts', 'DB_CONNECTION', 'DRIZZLE');

replaceFile('src/integration/integration.module.ts', 'import.*?handoff.schema.*?;\\n', '');
replaceFile('src/integration/integration.module.ts', 'import.*?MongooseModule.*?;\\n', '');
replaceFile('src/integration/integration.module.ts', 'MongooseModule\\.forFeature.*?\\);\\n', '');

let preSvg = fs.readFileSync('src/ai/pregenerate-svgs.ts', 'utf8');
preSvg = preSvg.replace(/import { getModelToken } from '@nestjs\/mongoose';/g, '');
preSvg = preSvg.replace(/import { Model } from 'mongoose';/g, '');
fs.writeFileSync('src/ai/pregenerate-svgs.ts', preSvg);

let leader = fs.readFileSync('src/leaderboard/leaderboard.controller.ts', 'utf8');
leader = leader.replace(/import { Query } from 'mongoose';\n?/g, '');
leader = leader.replace(/this\.userModel/g, 'this.db');
fs.writeFileSync('src/leaderboard/leaderboard.controller.ts', leader);

let resolver = fs.readFileSync('src/questions/questions.resolver.ts', 'utf8');
resolver = resolver.replace(/import { Resolver, Query, Args } from '@nestjs\/graphql';/, "import { Resolver, Query, Args, ObjectType, Field, Int } from '@nestjs/graphql';");
fs.writeFileSync('src/questions/questions.resolver.ts', resolver);

let qService = fs.readFileSync('src/questions/questions.service.ts', 'utf8');
qService = qService.replace(/indexQuestion\(/g, 'indexQuestionData(');
qService = qService.replace(/searchQuestions/g, 'search');
qService = qService.replace(/deleteQuestion/g, 'removeQuestionFromIndex');
fs.writeFileSync('src/questions/questions.service.ts', qService);

let aiService = fs.readFileSync('src/ai/ai.service.ts', 'utf8');
aiService = aiService.replace(/user\.ai_messages_remaining -= 1;/g, 'user.ai_messages_remaining = (user.ai_messages_remaining || 0) - 1;');
fs.writeFileSync('src/ai/ai.service.ts', aiService);

console.log('Fixed more errors!');
