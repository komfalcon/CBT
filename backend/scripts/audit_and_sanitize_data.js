const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

function normalizeLatexBackslashes(text) {
  if (!text || typeof text !== 'string') return '';
  let res = text;
  // Multi-backslash before alphabetic LaTeX commands (e.g. \\frac -> \frac, \\\sqrt -> \sqrt)
  res = res.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1');
  // Multi-backslash before single-character LaTeX commands & escapes (e.g. \\( -> \(, \\[ -> \[, \\, -> \,, \\{ -> \{)
  res = res.replace(/\\{2,}([\(\)\[\]\{\}\,\;\:\!\%\&\_\$\^])/g, '\\$1');
  // 3 or more backslashes elsewhere (e.g. matrix row break \\\\\\\\ -> \\\\)
  res = res.replace(/\\{3,}/g, '\\\\');
  return res;
}

function sanitizeQuestionText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = normalizeLatexBackslashes(rawText.trim());

  // 1. Remove leaked Explanations / Solutions appended to stem
  text = text.replace(/(?:\r?\n|^|\s+)(?:\*\*|__|\*)?(?:Explanation|Solution|Answer Explanation|Detailed Solution)(?:\*\*|__|\*)?\s*:[\s\S]*$/i, '');

  // 2. Remove leaked Correct Option / Answer appended to stem
  text = text.replace(/(?:\r?\n|\s+)(?:\*\*|__|\*|\()?Correct\s*(?:Option|Answer)\s*(?:is\s*)?[:\-]?\s*(?:Option\s*)?\(?[A-Ea-e]\)?(?:\s*[\.\,\;\)]?\s*)?$/i, '');
  text = text.replace(/(?:\r?\n|\s+)(?:\*\*|__|\*|\()?Ans(?:wer)?\s*(?:is\s*)?[:\-]?\s*(?:Option\s*)?\(?[A-Ea-e]\)?(?:\s*[\.\,\;\)]?\s*)?$/i, '');
  text = text.replace(/(?:\r?\n|\s+)(?:\*\*|__|\*|\()?Key\s*[:\-]\s*\(?[A-Ea-e]\)?(?:\s*[\.\,\;\)]?\s*)?$/i, '');
  text = text.replace(/(?:[\s\(\[])(?:Correct\s*(?:Option|Answer)|Ans(?:wer)?|Key)\s*(?:is\s*)?[:\-]?\s*(?:Option\s*)?\(?[A-Ea-e]\)?(?:[\)\]\.\,])?(?=\s*$)/gi, '');

  // 3. Remove leaked Hints (e.g. "*(Hint: ...)*", "(Hint: ...)", "[Hint: ...]", "*Hint: ...*", "Hint: ...")
  text = text.replace(/\s*\*?\s*[\(\[]\s*Hints?\s*:[\s\S]*?[\)\]]\s*\*?/gi, '');
  text = text.replace(/\s*\*Hints?\s*:[\s\S]*?\*\s*/gi, '');
  text = text.replace(/(?:\r?\n|^)\s*(?:\*\*|__|\*)?Hints?\s*:[\s\S]*?(?:\r?\n|$)/gi, '\n');

  // 4. Remove leaked "Options:" list block (e.g. "Options:\nA) random\nB) planned\nC) impulsive\nD) hasty")
  text = text.replace(/(?:\r?\n|\s+)(?:\*\*|__)?Options\s*:(?:\*\*|__)?\s*(?:\r?\n|\s+)(?:[•\-\*]\s*)?\(?[A-Ea-e][\.\)]\s*[\s\S]*$/i, '');

  // 5. Remove bulleted or newline options list at the end of the stem
  text = text.replace(/(?:\r?\n|\s*)(?:(?:[•\-\*]\s*)?\(?[A-Ea-e][\.\)]\s+[^\n\r]+(?:\r?\n|\s*)){2,}$/g, '');

  // 6. Remove inline options at the end of stem
  text = text.replace(/(?:\r?\n|\s+)(?:(?:[\[\(]?[A-Ea-e][\]\)\.]\s+[^\n\r]+?\s+){2,}(?:[\[\(]?[A-Ea-e][\]\)\.]\s+[^\n\r]+?\s*))$/g, '');

  // 7. Remove stray markdown asterisk quotes like `* 'The company...` or `*'The company...`
  text = text.replace(/^\s*\*\s*(['\"][A-Z])/gm, '$1');

  // 8. Remove duplicate "Question:" label at start of stem if present
  text = text.replace(/^(?:\*\*|__)?Question\s*:(?:\*\*|__)?\s*/i, '');

  return text.trim();
}

function cleanOptionText(optText) {
  if (!optText || typeof optText !== 'string') return '';
  let text = normalizeLatexBackslashes(optText.trim());
  text = text.replace(/^(?:[•\-\*]\s*)?(?:Option\s+[A-Ea-e][:\.]?\s*|[\[\(][A-Ea-e][\]\)]\s*|[A-Ea-e][\.\):]\s*)/i, '').trim();
  return text.trim();
}

function sanitizeExplanation(expText) {
  if (!expText || typeof expText !== 'string') return '';
  let text = normalizeLatexBackslashes(expText.trim());
  text = text.replace(/^(?:\*\*|__|\*)?Explanation\s*:(?:\*\*|__|\*)?\s*/i, '');
  return text.trim();
}

function isIncompleteQuestion(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed.length < 8) return true;

  // 1. Unclosed LaTeX inline \( or display \[ delimiters
  const openInline = (trimmed.match(/\\\(/g) || []).length;
  const closeInline = (trimmed.match(/\\\)/g) || []).length;
  if (openInline !== closeInline) return true;

  const openDisplay = (trimmed.match(/\\\[/g) || []).length;
  const closeDisplay = (trimmed.match(/\\\]/g) || []).length;
  if (openDisplay !== closeDisplay) return true;

  // 2. Cut-off passage ending in hanging preposition right before question tag
  if (/\b(?:over the|influenced by|because of the|due to the|as a result of the|in the|of the)\s*(?:\r?\n+\s*(?:\*\*|__)?Question\s*:)/i.test(trimmed)) {
    return true;
  }

  // 3. Truncated mid-year or mid-number at the end (e.g. "during the 1980")
  if (/\b(?:during the|in the|year)\s+\d{1,3}$/i.test(trimmed)) return true;

  // 4. Interrogative or calculation command abruptly ending in hanging conjunction (e.g. "Calculate the total energy when")
  if (/^(?:Calculate|Find|Determine|Evaluate|What|Which|Why|How|Where|When|Identify)\b[\s\S]*\b(?:when|while|if|because|where)\s*$/i.test(trimmed)) {
    return true;
  }

  // 5. Short statement (< 15 chars) with NO terminal punctuation
  if (trimmed.length < 15 && !/[\?\.\!\:\;\"\'\)\]]$/.test(trimmed)) return true;

  return false;
}

let totalQuestions = 0;
let modifiedQuestions = 0;
let incompleteCount = 0;
let doubleBackslashCount = 0;
let optionPrefixCount = 0;
let explanationCleanedCount = 0;

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = data.questions || [];
  let fileModified = 0;

  for (const q of questions) {
    totalQuestions++;
    const originalText = q.question_text || '';
    if (originalText.includes('\\\\')) {
      doubleBackslashCount++;
    }
    if (isIncompleteQuestion(originalText)) {
      incompleteCount++;
    }

    const cleanedText = sanitizeQuestionText(originalText);
    if (cleanedText !== originalText) {
      q.question_text = cleanedText;
      fileModified++;
    }

    if (Array.isArray(q.options)) {
      for (const opt of q.options) {
        const origOpt = opt.text || '';
        const cleanedOpt = cleanOptionText(origOpt);
        if (cleanedOpt !== origOpt) {
          opt.text = cleanedOpt;
          optionPrefixCount++;
          fileModified++;
        }
      }
    }

    if (q.explanation) {
      const origExp = q.explanation;
      const cleanedExp = sanitizeExplanation(origExp);
      if (cleanedExp !== origExp) {
        q.explanation = cleanedExp;
        explanationCleanedCount++;
        fileModified++;
      }
    }
  }

  if (fileModified > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[${file}] Cleaned ${fileModified} question fields.`);
    modifiedQuestions += fileModified;
  }
}

console.log('--- AUDIT & SANITIZATION SUMMARY ---');
console.log('Total files checked:', files.length);
console.log('Total questions checked:', totalQuestions);
console.log('Questions with double-backslash LaTeX found:', doubleBackslashCount);
console.log('Incomplete questions detected:', incompleteCount);
console.log('Option prefixes cleaned:', optionPrefixCount);
console.log('Explanations cleaned:', explanationCleanedCount);
console.log('Total question fields modified:', modifiedQuestions);
