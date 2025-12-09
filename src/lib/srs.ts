import { Word } from './types';

// SM-2 Algorithm Implementation

const MIN_EASE_FACTOR = 1.3;

interface SM2Result {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: string;
}

/**
 * Calculates the next review date for a word based on the SM-2 algorithm.
 * @param word The word to update.
 * @param quality The quality of the user's response (0-5).
 *                0 - "Blackout", complete failure to recall.
 *                1 - Incorrect response, but upon seeing the correct answer it felt familiar.
 *                2 - Incorrect response, but upon seeing the correct answer it seemed easy to remember.
 *                3 - Correct response, but with significant difficulty.
 *                4 - Correct response, after some hesitation.
 *                5 - Correct response with perfect recall.
 */
export function calculateNextReview(word: Word, quality: number): SM2Result {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5.');
  }

  let { repetitions, easeFactor, interval } = word;

  // If the quality of response was poor (e.g., less than 3),
  // start repetitions from the beginning without changing the ease factor.
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    // Correct response, calculate new ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < MIN_EASE_FACTOR) {
      easeFactor = MIN_EASE_FACTOR;
    }

    repetitions += 1;

    // Calculate new interval
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }
  
  // Calculate next review date
  const now = new Date();
  const nextReviewDate = new Date(now.setDate(now.getDate() + interval));

  return {
    repetitions,
    easeFactor,
    interval,
    nextReview: nextReviewDate.toISOString(),
  };
}

/**
 * Creates a new word with default SRS values.
 */
export function createNewWord(text: string, details: any): Word {
    const now = new Date();
    return {
        text,
        details,
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReview: now.toISOString(),
        lastReviewed: null,
    };
}
