import type { Word } from './types';

// SuperMemo 2 (SM-2) algorithm implementation
// See: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

/**
 * Calculates the next review date for a word based on the user's performance.
 * @param word The word object with its current SRS data.
 * @param quality The user's recall quality (0-5 scale). 
 *                0-2: incorrect, 3: correct but difficult, 4: correct with hesitation, 5: perfect recall.
 * @returns An object with the updated SRS fields for the word.
 */
export function getNextReviewDate(
  word: Word, 
  quality: number
): Pick<Word, 'nextReview' | 'interval' | 'easeFactor' | 'repetitions' | 'lastReviewed'> {
  
  if (quality < 3) {
    // Incorrect response. Reset repetitions and interval.
    return {
      repetitions: 0,
      interval: 1, // Reset interval to 1 day
      easeFactor: word.easeFactor, // Ease factor is not changed on incorrect responses
      nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      lastReviewed: new Date().toISOString(),
    };
  }

  // Correct response
  let newEaseFactor = word.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3; // The minimum ease factor is 1.3
  }

  let newRepetitions: number;
  let newInterval: number;

  if (word.repetitions === 0) {
    newInterval = 1;
    newRepetitions = 1;
  } else if (word.repetitions === 1) {
    newInterval = 6;
    newRepetitions = 2;
  } else {
    newInterval = Math.round(word.interval * newEaseFactor);
    newRepetitions = word.repetitions + 1;
  }
  
  const nextReviewDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

  return {
    repetitions: newRepetitions,
    interval: newInterval,
    easeFactor: newEaseFactor,
    nextReview: nextReviewDate.toISOString(),
    lastReviewed: new Date().toISOString(),
  };
}
