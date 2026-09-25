const normalizeQuizQuestion = (item) => {
  const options = Array.isArray(item?.answers)
    ? Object.values(item.answers).filter(Boolean)
    : [];

  const answerKey = item?.correct_answer || item?.correctAnswer || null;
  const answerIndex = typeof answerKey === 'string' && answerKey.toLowerCase().startsWith('answer_')
    ? answerKey.slice(-1).toUpperCase().charCodeAt(0) - 65
    : -1;

  return {
    questionId: item?.id || `${Date.now()}-${Math.random()}`,
    question: item?.question || 'Untitled question',
    options: options.length ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: answerIndex >= 0 && options[answerIndex] ? options[answerIndex] : answerKey,
  };
};

export const fetchQuizQuestions = async ({ subject, difficulty, amount, apiClient }) => {
  if (!subject) {
    throw new Error('Subject is required for quiz generation');
  }

  const query = new URLSearchParams({
    apiKey: process.env.QUIZ_API_KEY || '',
    difficulty: difficulty || 'medium',
    limit: String(amount || 10),
    tags: subject,
  });

  const response = await apiClient.get(`${process.env.QUIZ_API_URL || 'https://quizapi.io/api/v1/questions'}?${query.toString()}`);

  if (!response?.data || !Array.isArray(response.data)) {
    throw new Error('Invalid quiz response from external API');
  }

  return response.data
    .slice(0, Number(amount || 10))
    .map(normalizeQuizQuestion);
};

export const computeQuizResult = (submittedAnswers = {}, correctAnswers = {}) => {
  const total = Object.keys(correctAnswers).length || Object.keys(submittedAnswers).length || 0;
  let correct = 0;

  Object.entries(correctAnswers).forEach(([key, value]) => {
    if (submittedAnswers[key] === value) {
      correct += 1;
    }
  });

  const percentage = total ? Math.round((correct / total) * 100) : 0;

  return {
    totalQuestions: total,
    correct,
    wrong: total - correct,
    score: percentage,
    status: percentage >= 70 ? 'PASSED' : 'FAILED',
  };
};
