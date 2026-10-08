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
const mongodb_1 = require("mongodb");
const DB_URI = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';
const SQL_FILE = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql';
const JAMB_SUBJECTS = {
    'Mathematics': 'mathematics',
    'English Language': 'english',
    'Physics': 'physics',
    'Geography': 'geography',
    'Economics': 'economics',
    'Biology': 'biology',
    'Government': 'government',
    'Lit in English': 'englishlit',
    'Chemistry': 'chemistry',
    'Agricultural Science': 'agriculture',
    'Christian Religion Studies': 'crk',
    'Commerce': 'commerce',
    'History': 'history',
    'Islamic Religious Knowledge': 'irk',
    'Principles of Accounts': 'accounting'
};
async function parseCodeLeom() {
    console.log("Loading SQL file into memory...");
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    const subjectsMap = new Map();
    const questions = [];
    const choicesMap = new Map();
    console.log("Extracting records...");
    function extractRows(tableName) {
        const regex = new RegExp(`INSERT INTO \`${tableName}\` [\\s\\S]*? VALUES\\s*([\\s\\S]*?);`, 'g');
        const rows = [];
        let match;
        while ((match = regex.exec(sqlContent)) !== null) {
            const valuesStr = match[1];
            let inString = false;
            let escapeNext = false;
            let depth = 0;
            let currentTuple = '';
            for (let i = 0; i < valuesStr.length; i++) {
                let char = valuesStr[i];
                if (escapeNext) {
                    currentTuple += char;
                    escapeNext = false;
                    continue;
                }
                if (char === '\\') {
                    escapeNext = true;
                    currentTuple += char;
                    continue;
                }
                if (char === "'") {
                    inString = !inString;
                    currentTuple += char;
                    continue;
                }
                if (!inString) {
                    if (char === '(')
                        depth++;
                    else if (char === ')')
                        depth--;
                    if (depth === 0 && char === ')') {
                        let cols = [];
                        let inQ = false;
                        let esc = false;
                        let cur = '';
                        for (let j = 0; j < currentTuple.length; j++) {
                            let c = currentTuple[j];
                            if (esc) {
                                cur += c;
                                esc = false;
                                continue;
                            }
                            if (c === '\\') {
                                esc = true;
                                cur += c;
                                continue;
                            }
                            if (c === "'") {
                                inQ = !inQ;
                                cur += c;
                                continue;
                            }
                            if (c === ',' && !inQ) {
                                cols.push(cur.trim());
                                cur = '';
                                continue;
                            }
                            cur += c;
                        }
                        cols.push(cur.trim());
                        cols = cols.map(c => {
                            if (c.startsWith("'") && c.endsWith("'"))
                                c = c.slice(1, -1);
                            return c.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                        });
                        rows.push(cols);
                        currentTuple = '';
                        continue;
                    }
                    if (depth === 0 && (char === ',' || char === ' ' || char === '\n' || char === '\r')) {
                        continue;
                    }
                }
                if (depth > 0 || inString) {
                    if (depth === 1 && char === '(' && !inString && currentTuple === '') {
                        continue;
                    }
                    currentTuple += char;
                }
            }
        }
        return rows;
    }
    const sRows = extractRows('subjects');
    sRows.forEach(r => {
        if (r.length >= 2)
            subjectsMap.set(r[0], r[1]);
    });
    console.log(`Parsed ${subjectsMap.size} subjects.`);
    const cRows = extractRows('choices');
    cRows.forEach(r => {
        if (r.length >= 6) {
            const key = `${r[1]}_${r[2]}`;
            if (!choicesMap.has(key))
                choicesMap.set(key, []);
            choicesMap.get(key).push({
                text: r[5],
                is_correct: r[4] === '1'
            });
        }
    });
    console.log(`Parsed ${cRows.length} choices.`);
    const qRows = extractRows('questions');
    console.log(`Parsed ${qRows.length} questions.`);
    console.log("Connecting to MongoDB...");
    const client = new mongodb_1.MongoClient(DB_URI);
    await client.connect();
    const db = client.db();
    const collection = db.collection('questions');
    let insertCount = 0;
    for (const r of qRows) {
        if (r.length < 6)
            continue;
        const id = r[0];
        const qus_no = r[1];
        const text = r[3];
        const course_id = r[5];
        const subjectRaw = subjectsMap.get(course_id);
        if (!subjectRaw)
            continue;
        const subjectNorm = JAMB_SUBJECTS[subjectRaw];
        if (!subjectNorm)
            continue;
        const key = `${course_id}_${qus_no}`;
        let choices = choicesMap.get(key);
        if (!choices || choices.length < 2)
            continue;
        const letters = ['a', 'b', 'c', 'd', 'e'];
        let options = [];
        let correctLetter = 'a';
        choices = choices.slice(0, 5);
        for (let i = 0; i < choices.length; i++) {
            options.push({
                option_letter: letters[i],
                option_text: choices[i].text
            });
            if (choices[i].is_correct) {
                correctLetter = letters[i];
            }
        }
        const external_id = `codeleom_${subjectNorm}_${id}`;
        const questionData = {
            subject: subjectNorm,
            topic: 'General',
            question_text: text,
            options: options,
            correct_option: correctLetter,
            explanation: null,
            image_url: null,
            has_diagram: false,
            diagram_svg: null,
            source: 'real_jamb_past_question',
            external_id: external_id,
            questionId: external_id,
            created_at: new Date(),
            updated_at: new Date()
        };
        await collection.updateOne({ external_id: external_id }, { $set: questionData }, { upsert: true });
        insertCount++;
        if (insertCount % 100 === 0)
            console.log(`Inserted ${insertCount} questions...`);
    }
    console.log(`\n================================`);
    console.log(`CODELEOM IMPORT COMPLETE! Total injected: ${insertCount}`);
    console.log(`================================`);
    await client.close();
    process.exit(0);
}
parseCodeLeom().catch(console.error);
//# sourceMappingURL=parse-codeleom.js.map