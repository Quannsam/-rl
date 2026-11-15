/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm Implementation
 * Standard Anki / SM-2 mathematical formulation
 */

export const SM2_GRADES = {
  AGAIN: 1, // Complete blackout / failed recall
  HARD: 2,  // Correct response recalled with serious difficulty
  GOOD: 3,  // Correct response recalled with some hesitation
  EASY: 4   // Perfect recall, effortless
};

/**
 * Calculates next review interval, repetitions count, and ease factor using standard SM-2.
 * 
 * Standard SM-2 formula:
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * where q in [0..5].
 * In Anki 4-button scale:
 * Again = 1, Hard = 3, Good = 4, Easy = 5
 * 
 * @param {Object} card Current card object
 * @param {number} grade Quality grade (1 = Again, 2 = Hard, 3 = Good, 4 = Easy)
 * @returns {Object} Updated card attributes
 */
export function calculateSM2(card, grade) {
  let repetitions = card.repetitions || 0;
  let interval = card.interval || 0;
  let easeFactor = card.easeFactor || 2.5;

  // Map 1-4 grade to SM-2 quality (q):
  // 1 (Again) -> 1
  // 2 (Hard)  -> 3
  // 3 (Good)  -> 4
  // 4 (Easy)  -> 5
  let q;
  if (grade === SM2_GRADES.AGAIN) q = 1;
  else if (grade === SM2_GRADES.HARD) q = 3;
  else if (grade === SM2_GRADES.GOOD) q = 4;
  else if (grade === SM2_GRADES.EASY) q = 5;
  else q = grade;

  if (q < 3) {
    // Failed recall: reset repetitions, short interval
    repetitions = 0;
    interval = 1; // 1 day
  } else {
    // Successful recall
    if (repetitions === 0) {
      if (q === 3) interval = 1;      // Hard
      else if (q === 4) interval = 1; // Good
      else interval = 3;              // Easy
    } else if (repetitions === 1) {
      if (q === 3) interval = 2;      // Hard
      else if (q === 4) interval = 6; // Good (standard SM-2 step 2)
      else interval = 7;              // Easy
    } else {
      // repetitions >= 2
      if (q === 3) {
        // Hard: 1.2x multiplier
        interval = Math.max(interval + 1, Math.round(interval * 1.2));
      } else if (q === 4) {
        // Good: standard EF multiplier
        interval = Math.round(interval * easeFactor);
      } else {
        // Easy: bonus multiplier 1.3x
        interval = Math.round(interval * easeFactor * 1.3);
      }
    }
    repetitions += 1;
  }

  // Calculate new Ease Factor:
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  easeFactor = Math.round(easeFactor * 100) / 100;

  const now = Date.now();
  const dueDate = new Date(now + interval * 24 * 60 * 60 * 1000).toISOString();

  return {
    ...card,
    repetitions,
    interval,
    easeFactor,
    lastReviewed: new Date(now).toISOString(),
    dueDate,
    lastGrade: grade
  };
}

/**
 * Preview intervals for the 4 grading buttons for a given card
 * @param {Object} card 
 * @returns {Object} { again: string, hard: string, good: string, easy: string }
 */
export function previewIntervals(card) {
  const again = calculateSM2(card, SM2_GRADES.AGAIN);
  const hard = calculateSM2(card, SM2_GRADES.HARD);
  const good = calculateSM2(card, SM2_GRADES.GOOD);
  const easy = calculateSM2(card, SM2_GRADES.EASY);

  return {
    again: formatInterval(again.interval, true),
    hard: formatInterval(hard.interval),
    good: formatInterval(good.interval),
    easy: formatInterval(easy.interval)
  };
}

function formatInterval(days, isAgain = false) {
  if (isAgain) return '<10m';
  if (days <= 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
