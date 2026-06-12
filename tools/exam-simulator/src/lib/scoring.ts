import type { Question, ScoreResult, QuestionResult } from '../types';

/**
 * Compare two arrays as sets (same values regardless of order).
 */
function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

/**
 * Determine if the student's answer is correct for a given question.
 */
function isAnswerCorrect(
  question: Question,
  userAnswer: string | string[] | undefined
): boolean {
  if (userAnswer === undefined || userAnswer === null) return false;

  if (question.type === 'multiple') {
    // Multiple choice: compare as sets
    if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
      return false;
    }
    return setsEqual(userAnswer, question.correctAnswer);
  }

  // Single choice or boolean: string equality
  if (typeof userAnswer !== 'string' || typeof question.correctAnswer !== 'string') {
    return false;
  }
  return userAnswer === question.correctAnswer;
}

/**
 * Calculate the score for an exam given the questions and the student's answers.
 */
export function calculateScore(
  questions: Question[],
  answers: Record<string, string | string[]>
): ScoreResult {
  const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
  let score = 0;
  let correctCount = 0;

  const details: QuestionResult[] = questions.map((question) => {
    const userAnswer = answers[question.id];
    const isCorrect = isAnswerCorrect(question, userAnswer);

    if (isCorrect) {
      score += question.score;
      correctCount++;
    }

    return {
      questionId: question.id,
      content: question.content,
      userAnswer: userAnswer ?? (question.type === 'multiple' ? [] : ''),
      correctAnswer: question.correctAnswer,
      score: question.score,
      isCorrect,
    };
  });

  const correctRate =
    questions.length === 0
      ? 0
      : Math.round((correctCount / questions.length) * 1000) / 10;

  return {
    totalScore,
    score,
    correctRate,
    details,
  };
}
