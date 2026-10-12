/**
 * Comprehensive Question & Option Sanitizer Utility
 * Sanitizes exam questions, options, and explanations to eliminate:
 * 1. Leaked answers / correct options in question stems
 * 2. Leaked explanations and solution rationales in stems
 * 3. Leaked hints and cheat clues in stems
 * 4. Leaked option lists in stems (bulleted, numbered, or inline)
 * 5. Double-backslash LaTeX and KaTeX rendering corruptions (both alphabetic and non-alphabetic)
 * 6. Incomplete / truncated stems and passages (without rejecting sentence-completion questions)
 * 7. Preserving explanations without stripping solution rationales
 */

/**
 * Normalizes multi-backslash LaTeX escapes back into standard valid LaTeX
 */
export function normalizeLatexBackslashes(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  let res = text;
  // Multi-backslash before alphabetic LaTeX command (e.g. \\frac -> \frac, \\\sqrt -> \sqrt)
  res = res.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1');
  // Multi-backslash before single-character LaTeX commands & escapes (e.g. \\( -> \(, \\[ -> \[, \\, -> \,, \\{ -> \{)
  res = res.replace(/\\{2,}([\(\)\[\]\{\}\,\;\:\!\%\&\_\$\^])/g, '\\$1');
  // 3 or more backslashes elsewhere (e.g. matrix row break \\\\\\\\ -> \\\\)
  res = res.replace(/\\{3,}/g, '\\\\');
  return res;
}

/**
 * Sanitizes question stem text to remove leaked answers, explanations, hints, and duplicate option lists
 */
export function sanitizeQuestionText(rawText: string | null | undefined): string {
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

  // 5. Remove bulleted or newline options list at the end of the stem (e.g. "• A. prolific\n• B. lazy\n• C. unproductive\n• D. diligent")
  text = text.replace(/(?:\r?\n|\s*)(?:(?:[•\-\*]\s*)?\(?[A-Ea-e][\.\)]\s+[^\n\r]+(?:\r?\n|\s*)){2,}$/g, '');

  // 6. Remove inline options at the end of stem (e.g. "A) /l/ B) /p/ C) /f/ D) /ŋ/" or "[A] 25 [B] 50 [C] 75 [D] 100")
  text = text.replace(/(?:\r?\n|\s+)(?:(?:[\[\(]?[A-Ea-e][\]\)\.]\s+[^\n\r]+?\s+){2,}(?:[\[\(]?[A-Ea-e][\]\)\.]\s+[^\n\r]+?\s*))$/g, '');

  // 7. Remove stray markdown asterisk quotes like `* 'The company...` or `*'The company...`
  text = text.replace(/^\s*\*\s*(['\"][A-Z])/gm, '$1');

  // 8. Remove duplicate "Question:" label at start of stem if present
  text = text.replace(/^(?:\*\*|__)?Question\s*:(?:\*\*|__)?\s*/i, '');

  return text.trim();
}

/**
 * Cleans individual option choices:
 * - Strips redundant leading prefixes like "A. ", "(B) ", "[C] ", "Option D: "
 * - Normalizes LaTeX backslashes
 */
export function cleanOptionText(optText: string | null | undefined): string {
  if (!optText || typeof optText !== 'string') return '';
  let text = normalizeLatexBackslashes(optText.trim());
  // Strip duplicate option prefix
  text = text.replace(/^(?:[•\-\*]\s*)?(?:Option\s+[A-Ea-e][:\.]?\s*|[\[\(][A-Ea-e][\]\)]\s*|[A-Ea-e][\.\):]\s*)/i, '').trim();
  return text.trim();
}

/**
 * Cleans explanation text:
 * - Normalizes LaTeX backslashes
 * - Strips redundant leading "**Explanation:** " prefix
 * - Preserves complete explanation body without deleting solutions or rationales
 */
export function sanitizeExplanation(expText: string | null | undefined): string {
  if (!expText || typeof expText !== 'string') return '';
  let text = normalizeLatexBackslashes(expText.trim());
  text = text.replace(/^(?:\*\*|__|\*)?Explanation\s*:(?:\*\*|__|\*)?\s*/i, '');
  return text.trim();
}

/**
 * Identifies genuine incomplete/truncated questions:
 * - Unclosed LaTeX delimiters \(, \[
 * - Cut-off reading passages before question tags
 * - Truncated years/numbers at end
 * - Short statements lacking terminal punctuation
 * - Preserves authentic multiple-choice sentence completion questions ending in "the", "a", "is", etc.
 */
export function isIncompleteQuestion(text: string | null | undefined): boolean {
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

  // 2. Cut-off passage ending in hanging preposition right before question tag (Screenshot 4)
  if (/\b(?:over the|influenced by|because of the|due to the|as a result of the|in the|of the)\s*(?:\r?\n+\s*(?:\*\*|__)?Question\s*:)/i.test(trimmed)) {
    return true;
  }

  // 3. Truncated mid-year or mid-number at the end of stem (e.g. "during the 1980")
  if (/\b(?:during the|in the|year)\s+\d{1,3}$/i.test(trimmed)) return true;

  // 4. Interrogative or calculation command abruptly ending in hanging conjunction (e.g. "Calculate the total energy when")
  if (/^(?:Calculate|Find|Determine|Evaluate|What|Which|Why|How|Where|When|Identify)\b[\s\S]*\b(?:when|while|if|because|where)\s*$/i.test(trimmed)) {
    return true;
  }

  // 5. Short statement (< 15 chars) with NO terminal punctuation
  if (trimmed.length < 15 && !/[\?\.\!\:\;\"\'\)\]]$/.test(trimmed)) return true;

  return false;
}
