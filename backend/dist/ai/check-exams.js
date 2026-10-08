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
const sqlContent = fs.readFileSync('C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d131deb9-f35b-4f58-b159-c90cd70d09a1\\\\scratch\\\\codeleom\\\\sql\\\\obidon_2018.sql', 'utf8');
function extractRows(tableName) {
    const rows = [];
    let searchIdx = 0;
    while ((searchIdx = sqlContent.indexOf(`INSERT INTO \`${tableName}\``, searchIdx)) !== -1) {
        const valuesIdx = sqlContent.indexOf('VALUES', searchIdx);
        if (valuesIdx === -1)
            break;
        let i = valuesIdx + 6;
        let inString = false;
        let escapeNext = false;
        let currentRow = [];
        let currentVal = '';
        let inTuple = false;
        for (; i < sqlContent.length; i++) {
            let char = sqlContent[i];
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
                inString = !inString;
                currentVal += char;
                continue;
            }
            if (!inString) {
                if (char === ';') {
                    searchIdx = i + 1;
                    break;
                }
                if (char === '(' && !inTuple) {
                    inTuple = true;
                    currentRow = [];
                    currentVal = '';
                    continue;
                }
                if (char === ')') {
                    if (inTuple) {
                        currentRow.push(currentVal.trim());
                        const cleanRow = currentRow.map(c => {
                            if (c.startsWith("'") && c.endsWith("'"))
                                c = c.slice(1, -1);
                            return c.replace(/\\'/g, "'").replace(/\\\\/g, "\\").replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
                        });
                        rows.push(cleanRow);
                        inTuple = false;
                    }
                    continue;
                }
                if (char === ',') {
                    if (inTuple) {
                        currentRow.push(currentVal.trim());
                        currentVal = '';
                    }
                    continue;
                }
                if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
                    if (inTuple)
                        currentVal += char;
                    continue;
                }
            }
            if (inTuple)
                currentVal += char;
        }
    }
    return rows;
}
console.log(extractRows('exams'));
//# sourceMappingURL=check-exams.js.map