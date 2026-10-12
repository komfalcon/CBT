const {
  sanitizeQuestionText,
  cleanOptionText,
  sanitizeExplanation,
  normalizeLatexBackslashes,
  isIncompleteQuestion,
} = require('../dist/questions/utils/question-sanitizer');

describe('Question and Option Sanitizer Suite', () => {
  describe('Screenshot 1: LaTeX and KaTeX formatting issues', () => {
    it('fixes double-backslash LaTeX macros in question stems', () => {
      const q1 =
        "Identify the number of stressed syllables in the word 'RECIPROCAL' using the following stress pattern notation: $\\frac{\\uparrow}{r} \\\\frac{\\downarrow}{e} \\\\frac{\\uparrow}{c} \\\\frac{\\downarrow}{i} \\\\frac{\\uparrow}{p} \\\\frac{\\downarrow}{r} \\\\frac{\\uparrow}{o} \\\\frac{\\downarrow}{c} \\\\frac{\\uparrow}{a} \\\\frac{\\downarrow}{l}$";
      const cleaned = sanitizeQuestionText(q1);
      expect(cleaned).not.toContain('\\\\frac');
      expect(cleaned).not.toContain('\\\\downarrow');
      expect(cleaned).not.toContain('\\\\uparrow');
      expect(cleaned).toContain('\\frac{\\downarrow}{e}');
    });

    it('fixes double backslashes for Greek letters and common math operators', () => {
      const math = 'Given that \\\\alpha + \\\\beta = \\\\pi and \\\\sqrt{4} = 2, find \\\\theta.';
      const cleaned = sanitizeQuestionText(math);
      expect(cleaned).toBe('Given that \\alpha + \\beta = \\pi and \\sqrt{4} = 2, find \\theta.');
    });

    it('fixes non-alphabetic LaTeX macros and math delimiters', () => {
      const latexSymbols = 'Solve \\\\( x + y = 10 \\\\) and \\\\[ \\\\frac{a}{b} = \\\\{1, 2\\\\} \\\\] with spacing \\\\, and \\\\;';
      const cleaned = normalizeLatexBackslashes(latexSymbols);
      expect(cleaned).toContain('\\( x + y = 10 \\)');
      expect(cleaned).toContain('\\[ \\frac{a}{b} = \\{1, 2\\} \\]');
      expect(cleaned).toContain('\\, and \\;');
    });

    it('normalizes multi-backslash row breaks in matrices', () => {
      const matrix = '\\begin{pmatrix} 1 & 2 \\\\\\\\ 3 & 4 \\end{pmatrix}';
      const cleaned = normalizeLatexBackslashes(matrix);
      expect(cleaned).toBe('\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}');
    });
  });

  describe('Screenshot 2: Leaked options, correct option and explanation', () => {
    it('removes bulleted option list, leaked answer, and leaked explanation', () => {
      const q2 = `In the following sentence, identify the word that conveys the same meaning as 'prolific':

The author was known for writing numerous novels, making him a _____ writer.

• A. prolific
• B. lazy
• C. unproductive
• D. diligent Correct Option: A

**Explanation:** 'Prolific' means 'producing much work' or 'highly creative'.`;

      const cleaned = sanitizeQuestionText(q2);
      expect(cleaned).not.toContain('• A. prolific');
      expect(cleaned).not.toContain('• B. lazy');
      expect(cleaned).not.toContain('Correct Option');
      expect(cleaned).not.toContain('Explanation');
      expect(cleaned).toContain('The author was known for writing numerous novels, making him a _____ writer.');
    });
  });

  describe('Screenshot 3: Leaked Options: header and lettered list', () => {
    it('removes Options: header and lettered options from question stem', () => {
      const q3 = `In the following sentence, what does the word 'strategic' mean in context?

*'The company invested in a _____ marketing plan to reach a wider audience...

Options:
A) random
B) planned
C) impulsive
D) hasty`;

      const cleaned = sanitizeQuestionText(q3);
      expect(cleaned).not.toContain('Options:');
      expect(cleaned).not.toContain('A) random');
      expect(cleaned).not.toContain('B) planned');
      expect(cleaned).toContain("what does the word 'strategic' mean in context?");
      expect(cleaned).toContain("'The company invested in a _____ marketing plan");
    });
  });

  describe('Screenshot 4: Incomplete / truncated question detection', () => {
    it('identifies incomplete question cut off mid-thought or mid-sentence', () => {
      const q4 = `Read the following passage and answer the question:
The Nigerian economy has been influenced by both global and domestic factors over the
**Question:** What is one significant economic challenge Nigeria faced during the 1980`;

      expect(isIncompleteQuestion(q4)).toBe(true);
    });

    it('identifies questions ending in hanging prepositions or conjunctions without punctuation', () => {
      expect(isIncompleteQuestion('Calculate the total energy when')).toBe(true);
      expect(isIncompleteQuestion('Short')).toBe(true);
    });

    it('identifies unclosed LaTeX delimiters as incomplete', () => {
      expect(isIncompleteQuestion('If \\( \\log_a(b')).toBe(true);
      expect(isIncompleteQuestion('Solve \\[ x^2 + 1')).toBe(true);
    });

    it('accepts complete standard questions and short questions with punctuation', () => {
      expect(isIncompleteQuestion('What is the SI unit of electric current?')).toBe(false);
      expect(isIncompleteQuestion('Solve for x in the equation 2x + 5 = 15.')).toBe(false);
      expect(isIncompleteQuestion('What is 2 + 2?')).toBe(false);
      expect(isIncompleteQuestion('Define force.')).toBe(false);
    });

    it('accepts authentic multiple-choice sentence completion questions', () => {
      const sentenceCompletion = "In the diagram below, a soil profile is shown. The layer labeled 'A' is most likely to be the";
      expect(isIncompleteQuestion(sentenceCompletion)).toBe(false);

      const civilWar = "The Nigerian Civil War (1967-1970) was fought between the federal government and";
      expect(isIncompleteQuestion(civilWar)).toBe(false);
    });
  });

  describe('Screenshot 5: Leaked inline options and hints', () => {
    it('removes inline options and leaked hint from stem', () => {
      const q5 = `In the word 'ELEPHANT', which consonant sound is pronounced with a voiceless stop?

A) /l/ B) /p/ C) /f/ D) /ŋ/

*(Hint: Voiceless stops include /p/, /t/, and /k/.)`;

      const cleaned = sanitizeQuestionText(q5);
      expect(cleaned).not.toContain('A) /l/');
      expect(cleaned).not.toContain('B) /p/');
      expect(cleaned).not.toContain('Hint:');
      expect(cleaned).toBe("In the word 'ELEPHANT', which consonant sound is pronounced with a voiceless stop?");
    });

    it('removes asterisk-wrapped hints and standalone hints', () => {
      const qHint = 'Find the velocity.\n*Hint: Use conservation of momentum.*';
      expect(sanitizeQuestionText(qHint)).toBe('Find the velocity.');

      const qHint2 = 'Hint: Recall Ohm\'s law.\nFind the current.';
      expect(sanitizeQuestionText(qHint2)).toBe('Find the current.');
    });

    it('removes bracketed inline options lists', () => {
      const qBracket = 'Find the value of x.\n[A] 25 [B] 50 [C] 75 [D] 100';
      expect(sanitizeQuestionText(qBracket)).toBe('Find the value of x.');
    });
  });

  describe('cleanOptionText utility', () => {
    it('strips redundant option letter prefixes and fixes LaTeX', () => {
      expect(cleanOptionText('A. 25 cm')).toBe('25 cm');
      expect(cleanOptionText('• B. prolific')).toBe('prolific');
      expect(cleanOptionText('Option C: 100 N')).toBe('100 N');
      expect(cleanOptionText('D) \\\\frac{1}{2}')).toBe('\\frac{1}{2}');
      expect(cleanOptionText('[A] Nitrogen')).toBe('Nitrogen');
      expect(cleanOptionText('(B) Oxygen')).toBe('Oxygen');
      expect(cleanOptionText('normal text')).toBe('normal text');
      expect(cleanOptionText('A - B')).toBe('A - B');
      expect(cleanOptionText('A')).toBe('A');
    });
  });

  describe('sanitizeExplanation utility', () => {
    it('preserves full explanation body and removes redundant label', () => {
      const exp1 = "**Explanation:** 'Prolific' means 'producing much work' or 'highly creative'.";
      expect(sanitizeExplanation(exp1)).toBe("'Prolific' means 'producing much work' or 'highly creative'.");
    });

    it('does NOT delete explanations describing options or answers', () => {
      const exp2 = "The correct answer is Option A because prolific means producing much work.";
      expect(sanitizeExplanation(exp2)).toBe(exp2);

      const exp3 = "Correct Option: B is chosen because of gravity: \\\\frac{GM}{r^2}.";
      expect(sanitizeExplanation(exp3)).toBe("Correct Option: B is chosen because of gravity: \\frac{GM}{r^2}.");
    });
  });
});
