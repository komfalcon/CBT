"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLatexBackslashes = normalizeLatexBackslashes;
exports.sanitizeQuestionText = sanitizeQuestionText;
exports.cleanOptionText = cleanOptionText;
exports.sanitizeExplanation = sanitizeExplanation;
exports.isIncompleteQuestion = isIncompleteQuestion;
function normalizeLatexBackslashes(text) {
    if (!text || typeof text !== 'string')
        return '';
    let res = text;
    res = res.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1');
    res = res.replace(/\\{2,}([\(\)\[\]\{\}\,\;\:\!\%\&\_\$\^])/g, '\\$1');
    res = res.replace(/\\{3,}/g, '\\\\');
    return res;
}
function sanitizeQuestionText(rawText) {
    if (!rawText || typeof rawText !== 'string')
        return '';
    let text = normalizeLatexBackslashes(rawText.trim());
    text = text.replace(/(?:\r?\n|^|\s+)(?:\*\*|__|\*)?(?:Explanation|Solution|Answer Explanation|Detailed Solution)(?:\*\*|__|\*)?\s*:[\s\S]*$/i, '');
    text = text.replace(/(?:\r?\n|\s+)(?:\*\*|__|\*)?Difficulty\s*Level\s*(?:\*\*|__|\*)?\s*:\s*\d+[\s\S]*$/i, '');
    text = text.replace(/(?:\r?\n|\s+)(?:\*\*|__|\*|\()?Correct\s*(?:Option|Answer)\s*(?:is\s*)?[:\-]?\s*(?:Option\s*)?\(?[A-Ea-e]\)?(?:\s*[\.\,\;\)]?\s*)?[\s\r\n]*$/i, '');
    text = text.replace(/(?:\r?\n|\s+)(?:\*\*|__|\*|\()?Ans(?:wer)?\s*(?:is\s*)?[:\-]?\s*(?:Option\s*)?\(?[A-Ea-e]\)?(?:\s*[\.\,\;\)]?\s*)?[\s\r\n]*$/i, '');
    text = text.replace(/(?:\r?\n|\s+)(?:\*\*|__|\*|\()?Key\s*[:\-]\s*\(?[A-Ea-e]\)?(?:\s*[\.\,\;\)]?\s*)?[\s\r\n]*$/i, '');
    text = text.replace(/(?:[\s\(\[])(?:Correct\s*(?:Option|Answer)|Ans(?:wer)?|Key)\s*(?:is\s*)?[:\-]?\s*(?:Option\s*)?\(?[A-Ea-e]\)?(?:[\)\]\.\,])?(?=\s*$)/gi, '');
    text = text.replace(/\s*\*?\s*[\(\[]\s*Hints?\s*:[\s\S]*?[\)\]]\s*\*?/gi, '');
    text = text.replace(/\s*\*Hints?\s*:[\s\S]*?\*\s*/gi, '');
    text = text.replace(/(?:\r?\n|^)\s*(?:\*\*|__|\*)?Hints?\s*:[\s\S]*?(?:\r?\n|$)/gi, '\n');
    text = text.replace(/(?:\r?\n|\s+)(?:The\s+)?(?:\*\*|__)?Options\s*(?:are\s*)?:(?:\*\*|__)?\s*(?:\r?\n|\s+)(?:[•\-\*]\s*)?\(?[A-Ea-e][\.\)]\s*[\s\S]*$/i, '');
    text = text.replace(/(?:\r?\n|\s+)(?:The\s+)?(?:\*\*|__)?Options\s*(?:are\s*)?:(?:\*\*|__)?[\s\S]*$/i, '');
    text = text.replace(/(?:\r?\n|\s*)(?:(?:[•\-\*]\s*)?\(?[A-Ea-e][\.\)]\s+[^\n\r]+(?:\r?\n|\s*)){2,}$/g, '');
    text = text.replace(/(?:\r?\n|\s+)(?:(?:[\[\(]?[A-Ea-e][\]\)\.]\s+[^\n\r]+?\s+){2,}(?:[\[\(]?[A-Ea-e][\]\)\.]\s+[^\n\r]+?\s*))$/g, '');
    text = text.replace(/^\s*\*\s*(['\"][A-Z])/gm, '$1');
    text = text.replace(/^(?:\*\*|__)?Question\s*:(?:\*\*|__)?\s*/i, '');
    return text.trim();
}
function cleanOptionText(optText) {
    if (!optText || typeof optText !== 'string')
        return '';
    let text = normalizeLatexBackslashes(optText.trim());
    text = text.replace(/^(?:[•\-\*]\s*)?(?:Option\s+[A-Ea-e][:\.]?\s*|[\[\(][A-Ea-e][\]\)]\s*|[A-Ea-e][\.\):]\s*)/i, '').trim();
    return text.trim();
}
function sanitizeExplanation(expText) {
    if (!expText || typeof expText !== 'string')
        return '';
    let text = normalizeLatexBackslashes(expText.trim());
    text = text.replace(/^(?:\*\*|__|\*)?Explanation\s*:(?:\*\*|__|\*)?\s*/i, '');
    return text.trim();
}
function isIncompleteQuestion(text) {
    if (!text || typeof text !== 'string')
        return true;
    const trimmed = text.trim();
    if (trimmed.length < 8)
        return true;
    const openInline = (trimmed.match(/\\\(/g) || []).length;
    const closeInline = (trimmed.match(/\\\)/g) || []).length;
    if (openInline !== closeInline)
        return true;
    const openDisplay = (trimmed.match(/\\\[/g) || []).length;
    const closeDisplay = (trimmed.match(/\\\]/g) || []).length;
    if (openDisplay !== closeDisplay)
        return true;
    if (/\b(?:over the|influenced by|because of the|due to the|as a result of the|in the|of the)\s*(?:\r?\n+\s*(?:\*\*|__)?Question\s*:)/i.test(trimmed)) {
        return true;
    }
    if (/\b(?:during the|in the|year)\s+\d{1,3}$/i.test(trimmed))
        return true;
    if (/^(?:Calculate|Find|Determine|Evaluate|What|Which|Why|How|Where|When|Identify)\b[\s\S]*\b(?:when|while|if|because|where)\s*$/i.test(trimmed)) {
        return true;
    }
    if (trimmed.length < 15 && !/[\?\.\!\:\;\"\'\)\]]$/.test(trimmed))
        return true;
    return false;
}
//# sourceMappingURL=question-sanitizer.js.map