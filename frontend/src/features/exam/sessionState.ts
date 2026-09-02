export type QuestionIdentity = {
  questionId?: string;
  id?: string;
};

export type AnswerMap = Record<string, string>;

export function normalizeExamQuestions<T extends QuestionIdentity>(questions: T[]): Array<T & { questionId: string }> {
  return questions.map((question, index) => {
    const questionId = question.questionId || question.id;
    if (!questionId) {
      throw new Error(`Exam question at position ${index + 1} is missing its identifier.`);
    }
    return { ...question, questionId };
  });
}

export function normalizeExamAnswers(
  questions: Array<QuestionIdentity & { questionId: string }>,
  rawAnswers?: Record<string, string | null | undefined> | null,
): AnswerMap {
  const answers = rawAnswers && typeof rawAnswers === 'object' && !Array.isArray(rawAnswers) ? rawAnswers : {};

  return questions.reduce<AnswerMap>((normalizedAnswers, question) => {
    const answer = answers[question.questionId] ?? (question.id ? answers[question.id] : undefined);
    if (typeof answer === 'string' && answer.length > 0) {
      normalizedAnswers[question.questionId] = answer;
    }
    return normalizedAnswers;
  }, {});
}
