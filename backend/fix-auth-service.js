const fs = require('fs');
let s = fs.readFileSync('src/auth/auth.service.ts', 'utf8');
s = s.replace(/role: user\.role,/g, 'role: user.role as any,');
s = s.replace(/role: 'student',/g, 'role: "student" as any,');
s = s.replace(/role: UserRole\.STUDENT,/g, 'role: "student" as any,');
s = s.replace(/role: newRole,/g, 'role: newRole as any,');
fs.writeFileSync('src/auth/auth.service.ts', s);
