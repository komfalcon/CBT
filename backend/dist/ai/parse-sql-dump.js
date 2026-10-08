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
const readline = __importStar(require("readline"));
const mongodb_1 = require("mongodb");
const DB_URI = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';
const SQL_FILE = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\aloc-endpoints\\\\storage\\\\backups\\\\2020-08-20.sql';
const TARGET_SUBJECTS = ['english', 'mathematics', 'commerce', 'accounting', 'biology', 'physics', 'chemistry', 'englishlit', 'government', 'crk', 'geography', 'economics', 'irk', 'civiledu', 'insurance', 'currentaffairs', 'history'];
async function parseAndImport() {
    const client = new mongodb_1.MongoClient(DB_URI);
    await client.connect();
    const db = client.db();
    const collection = db.collection('questions');
    console.log('Starting massive SQL parse...');
    const fileStream = fs.createReadStream(SQL_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    let currentTable = '';
    let insertCount = 0;
    for await (const line of rl) {
        if (line.startsWith('INSERT INTO')) {
            const match = line.match(/INSERT INTO `([^`]+)` VALUES /);
            if (match) {
                currentTable = match[1];
                if (!TARGET_SUBJECTS.includes(currentTable))
                    continue;
                let valuesStr = line.replace(/INSERT INTO `[^`]+` VALUES /, '').trim();
                if (valuesStr.endsWith(';'))
                    valuesStr = valuesStr.slice(0, -1);
                const rowRegex = /\((.*?)\)(?=(?:,\()|$)/g;
                let rowMatch;
                while ((rowMatch = rowRegex.exec(valuesStr)) !== null) {
                    const rowData = rowMatch[1];
                    let columns = [];
                    let currentVal = '';
                    let inQuotes = false;
                    let escapeNext = false;
                    for (let i = 0; i < rowData.length; i++) {
                        const char = rowData[i];
                        if (escapeNext) {
                            currentVal += char;
                            escapeNext = false;
                            continue;
                        }
                        if (char === '\\') {
                            escapeNext = true;
                            currentVal += char;
                            continue;
                        }
                        if (char === "'") {
                            inQuotes = !inQuotes;
                            currentVal += char;
                            continue;
                        }
                        if (char === ',' && !inQuotes) {
                            columns.push(currentVal.trim());
                            currentVal = '';
                            continue;
                        }
                        currentVal += char;
                    }
                    columns.push(currentVal.trim());
                    columns = columns.map(col => {
                        if (col.startsWith("'") && col.endsWith("'"))
                            col = col.slice(1, -1);
                        return col.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                    });
                    if (columns.length >= 12) {
                        const external_id = `aloc_${currentTable}_${columns[0]}`;
                        const questionData = {
                            subject: currentTable,
                            topic: columns[6] || 'General',
                            question_text: columns[1],
                            options: [
                                { option_letter: 'a', option_text: columns[2] },
                                { option_letter: 'b', option_text: columns[3] },
                                { option_letter: 'c', option_text: columns[4] },
                                { option_letter: 'd', option_text: columns[5] }
                            ],
                            correct_option: columns[8].toLowerCase(),
                            explanation: columns[9] || null,
                            image_url: columns[7] || null,
                            has_diagram: !!columns[7],
                            diagram_svg: null,
                            source: 'real_jamb_past_question',
                            external_id: external_id,
                            questionId: external_id,
                            created_at: new Date(),
                            updated_at: new Date()
                        };
                        await collection.updateOne({ external_id: external_id }, { $set: questionData }, { upsert: true });
                        insertCount++;
                        if (insertCount % 500 === 0) {
                            console.log(`Processed ${insertCount} questions...`);
                        }
                    }
                }
            }
        }
    }
    console.log(`\n================================`);
    console.log(`IMPORT COMPLETE! Total extracted: ${insertCount}`);
    console.log(`================================`);
    await client.close();
    process.exit(0);
}
parseAndImport().catch(console.error);
//# sourceMappingURL=parse-sql-dump.js.map