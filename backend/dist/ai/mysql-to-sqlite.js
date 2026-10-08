"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const sqlPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql';
const cleanedPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\cleaned.sql';
const dbPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon.db';
console.log("Cleaning SQL dump for SQLite...");
let sqlContent = fs.readFileSync(sqlPath, 'utf8');
sqlContent = sqlContent.replace(/ENGINE=InnoDB.*?;/g, ';');
sqlContent = sqlContent.replace(/ENGINE=MyISAM.*?;/g, ';');
sqlContent = sqlContent.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
sqlContent = sqlContent.replace(/int\(\d+\)/gi, 'INTEGER');
sqlContent = sqlContent.replace(/tinyint\(\d+\)/gi, 'INTEGER');
sqlContent = sqlContent.replace(/varchar\(\d+\)/gi, 'TEXT');
sqlContent = sqlContent.replace(/char\(\d+\)/gi, 'TEXT');
sqlContent = sqlContent.replace(/ timestamp /gi, ' TEXT ');
sqlContent = sqlContent.replace(/ time /gi, ' TEXT ');
sqlContent = sqlContent.replace(/ ON UPDATE CURRENT_TIMESTAMP/gi, '');
sqlContent = sqlContent.replace(/ DEFAULT '0000-00-00 00:00:00'/gi, '');
sqlContent = sqlContent.replace(/ DEFAULT CURRENT_TIMESTAMP/gi, '');
sqlContent = sqlContent.replace(/ DEFAULT '\w+'/gi, '');
sqlContent = sqlContent.replace(/ COLLATE .*?,/gi, ',');
sqlContent = sqlContent.replace(/ COLLATE .*? /gi, ' ');
sqlContent = sqlContent.replace(/\\'/g, "''");
sqlContent = sqlContent.replace(/\/\*![\s\S]*?\*\//g, '');
fs.writeFileSync(cleanedPath, sqlContent);
console.log("Loading into SQLite...");
if (fs.existsSync(dbPath))
    fs.unlinkSync(dbPath);
try {
    (0, child_process_1.execSync)(`sqlite3 "${dbPath}" < "${cleanedPath}"`);
    console.log("Database created successfully!");
}
catch (e) {
    console.error("Failed to load into sqlite:", e.message);
}
//# sourceMappingURL=mysql-to-sqlite.js.map