import { Question } from '../types';

/**
 * Selects a random subset of questions using the Fisher-Yates (Durstenfeld) shuffle algorithm.
 * O(n) complexity, guarantees no duplicates.
 *
 * @param questions - Array of Question objects to select from
 * @param count - Number of questions to select
 * @param rng - Optional random number generator function (returns [0, 1)), defaults to Math.random
 * @returns Array of exactly `count` distinct questions from the original array
 */
export function selectQuestions(
  questions: Question[],
  count: number,
  rng: () => number = Math.random
): Question[] {
  const n = questions.length;

  // If count >= array length, return all questions shuffled
  const selectCount = Math.min(count, n);

  // Create a shallow copy to avoid mutating the original array
  const shuffled = [...questions];

  // Fisher-Yates (Durstenfeld) shuffle — only need to shuffle `selectCount` positions
  for (let i = n - 1; i > n - 1 - selectCount; i--) {
    const j = Math.floor(rng() * (i + 1));
    // Swap elements at indices i and j
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  // Return the last `selectCount` elements (the shuffled portion)
  return shuffled.slice(n - selectCount);
}
