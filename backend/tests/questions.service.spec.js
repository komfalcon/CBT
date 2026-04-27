const {
  tokenizeQuestionText,
  computeTfIdfVector,
  cosineSimilarity,
} = require('../dist/questions/questions.service');

describe('QuestionsService duplicate helper functions', () => {
  it('tokenizes and normalizes question text', () => {
    const tokens = tokenizeQuestionText('What is 2 + 2 in Mathematics?');
    expect(tokens).toEqual(expect.arrayContaining(['what', 'is', 'mathematics']));
    expect(tokens).not.toContain('+');
  });

  it('produces deterministic tf-idf vectors', () => {
    const corpus = ['Find the derivative of x squared', 'Solve a linear equation'];
    const v1 = computeTfIdfVector('Find the derivative of x squared', corpus);
    const v2 = computeTfIdfVector('Find the derivative of x squared', corpus);
    expect(v1).toEqual(v2);
    expect(v1.length).toBeGreaterThan(0);
  });

  it('returns high similarity for near-identical vectors', () => {
    const corpus = ['Energy equals mass times speed of light squared'];
    const base = computeTfIdfVector('Energy equals mass times speed of light squared', corpus);
    const near = computeTfIdfVector('Energy equals mass times speed of light squared', corpus);
    const far = computeTfIdfVector('Identify the capital city of France', corpus);

    expect(cosineSimilarity(base, near)).toBeGreaterThanOrEqual(0.95);
    expect(cosineSimilarity(base, far)).toBeLessThan(0.85);
  });
});
