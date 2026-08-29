const fs = require('fs');

function replaceFile(path, from, to) {
  let c = fs.readFileSync(path, 'utf8');
  c = c.replace(new RegExp(from, 'g'), to);
  fs.writeFileSync(path, c);
}

replaceFile('src/admin/admin.service.ts', '\\.\\/users\\/utils', '../users/utils');
replaceFile('src/auth/auth.service.ts', '\\.\\/users\\/utils', '../users/utils');
replaceFile('src/questions/questions.controller.ts', '\\.\\/users\\/utils', '../users/utils');
replaceFile('src/questions/questions.service.ts', '\\.\\/users\\/utils', '../users/utils');

replaceFile('src/ai/ai.service.ts', '\\.\\.\\/\\.\\.\\/db\\/database\\.module', '../db/database.module');
replaceFile('src/ai/ai.service.ts', '\\.\\.\\/\\.\\.\\/db\\/schema', '../db/schema');

replaceFile('src/exam/exam.service.ts', '\\.\\.\\/\\.\\.\\/db\\/database\\.module', '../db/database.module');
replaceFile('src/exam/exam.service.ts', '\\.\\.\\/\\.\\.\\/db\\/schema', '../db/schema');

replaceFile('src/results/results.service.ts', '\\.\\.\\/\\.\\.\\/db\\/database\\.module', '../db/database.module');
replaceFile('src/results/results.service.ts', '\\.\\.\\/\\.\\.\\/db\\/schema', '../db/schema');

let authCtrl = fs.readFileSync('src/auth/auth.controller.ts', 'utf8');
authCtrl = authCtrl.replace(/UserDocument/g, 'any');
fs.writeFileSync('src/auth/auth.controller.ts', authCtrl);

let jwtRefresh = fs.readFileSync('src/auth/strategies/jwt-refresh.strategy.ts', 'utf8');
jwtRefresh = jwtRefresh.replace(/@InjectModel\(User\.name\)\s+private\s+readonly\s+userModel:\s+Model<UserDocument>,?/g, '');
jwtRefresh = jwtRefresh.replace(/const\s+user\s*=\s*await\s+this\.userModel\.findOne\(\{.*?\}\)\.lean\(\)\.exec\(\);/g, 'const [user] = await this.db.select().from(users).where(eq(users.id, payload.sub)).limit(1);');
jwtRefresh = jwtRefresh.replace(/import\s+{.*?}\s+from\s+'passport-jwt';/g, "import { ExtractJwt, Strategy } from 'passport-jwt';\nimport { Inject } from '@nestjs/common';\nimport { eq } from 'drizzle-orm';\nimport { DB_CONNECTION } from '../../db/database.module';\nimport { users } from '../../db/schema';");
jwtRefresh = jwtRefresh.replace(/constructor\(/, 'constructor(\n    @Inject(DB_CONNECTION) private readonly db: any,');
fs.writeFileSync('src/auth/strategies/jwt-refresh.strategy.ts', jwtRefresh);

let jwt = fs.readFileSync('src/auth/strategies/jwt.strategy.ts', 'utf8');
jwt = jwt.replace(/@InjectModel\(User\.name\)\s+private\s+readonly\s+userModel:\s+Model<UserDocument>,?/g, '');
jwt = jwt.replace(/const\s+user\s*=\s*await\s+this\.userModel\.findOne\(\{.*?\}\)\.lean\(\)\.exec\(\);/g, 'const [user] = await this.db.select().from(users).where(eq(users.id, payload.sub)).limit(1);');
jwt = jwt.replace(/import\s+{.*?}\s+from\s+'passport-jwt';/g, "import { ExtractJwt, Strategy } from 'passport-jwt';\nimport { Inject } from '@nestjs/common';\nimport { eq } from 'drizzle-orm';\nimport { DB_CONNECTION } from '../../db/database.module';\nimport { users } from '../../db/schema';");
jwt = jwt.replace(/constructor\(/, 'constructor(\n    @Inject(DB_CONNECTION) private readonly db: any,');
fs.writeFileSync('src/auth/strategies/jwt.strategy.ts', jwt);

let leaderCtrl = fs.readFileSync('src/leaderboard/leaderboard.controller.ts', 'utf8');
leaderCtrl = leaderCtrl.replace(/@InjectModel\(User\.name\)\s+private\s+userModel:\s+Model<User>,?/g, '@Inject(DB_CONNECTION) private readonly db: any');
leaderCtrl = leaderCtrl.replace(/import\s+{.*?}\s+from\s+'@nestjs\/common';/, "import { Controller, Get, Inject } from '@nestjs/common';\nimport { desc, eq } from 'drizzle-orm';\nimport { DB_CONNECTION } from '../db/database.module';\nimport { users } from '../db/schema';");
leaderCtrl = leaderCtrl.replace(/await\s+this\.userModel\.find\(.*?\)\.sort\(.*?\)\.limit\(10\)\.exec\(\)/, "await this.db.select().from(users).where(eq(users.role, 'student')).orderBy(desc(users.xp_points)).limit(10)");
fs.writeFileSync('src/leaderboard/leaderboard.controller.ts', leaderCtrl);

let pregenerate = fs.readFileSync('src/ai/pregenerate-svgs.ts', 'utf8');
pregenerate = pregenerate.replace(/@InjectModel\(Question\.name\).*?,/g, '@Inject(DB_CONNECTION) private readonly db: any,');
pregenerate = pregenerate.replace(/import\s+{.*?}\s+from\s+'@nestjs\/common';/, "import { Injectable, Logger, Inject } from '@nestjs/common';\nimport { eq, isNull } from 'drizzle-orm';\nimport { DB_CONNECTION } from '../db/database.module';\nimport { questions } from '../db/schema';");
pregenerate = pregenerate.replace(/await\s+this\.questionModel\.find\(.*?\)\.exec\(\)/, 'await this.db.select().from(questions).where(eq(questions.has_diagram, true))');
pregenerate = pregenerate.replace(/await\s+this\.questionModel\.findByIdAndUpdate\(.*?\)/g, 'await this.db.update(questions).set({ diagram_svg: svg, updated_at: new Date() }).where(eq(questions.id, q.id))');
fs.writeFileSync('src/ai/pregenerate-svgs.ts', pregenerate);

let qResolver = fs.readFileSync('src/questions/questions.resolver.ts', 'utf8');
qResolver = qResolver.replace(/import\s+{.*?}\s+from\s+'@nestjs\/graphql';/, "import { Resolver, Query, Args } from '@nestjs/graphql';\nimport { questions } from '../db/schema';");
qResolver = qResolver.replace(/returns\s*=>\s*\[Question\]/g, 'returns => [Object]');
qResolver = qResolver.replace(/returns\s*=>\s*Question/g, 'returns => Object');
qResolver = qResolver.replace(/:\s*Promise<Question\[\]>/g, ': Promise<any[]>');
qResolver = qResolver.replace(/:\s*Promise<Question>/g, ': Promise<any>');
fs.writeFileSync('src/questions/questions.resolver.ts', qResolver);

let qSearch = fs.readFileSync('src/questions/search/search.service.ts', 'utf8');
qSearch = qSearch.replace(/Question/g, 'any');
fs.writeFileSync('src/questions/search/search.service.ts', qSearch);

console.log('Fixed Drizzle references in neglected files!');
