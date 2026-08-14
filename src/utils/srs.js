import { daysFromNow } from './helpers';

export const INTERVAL_DAYS = { 0: 0, 1: 1, 2: 2, 3: 4, 4: 9, 5: 18 };
export const MAX_BOX = 5;
export const LEARNED_BOX = 3;
export const REVERSE_UNLOCK_BOX = 2;

export function isDue(card) {
  const nr = card.srs && card.srs.nextReview;
  return !nr || nr <= Date.now();
}

export function boxOf(card) {
  return (card.srs && card.srs.box) || 0;
}

export function reverseBoxOf(card) {
  return (card.srsReverse && card.srsReverse.box) || 0;
}

export function isReverseUnlocked(card) {
  return boxOf(card) >= REVERSE_UNLOCK_BOX;
}

export function isReverseDue(card) {
  if (!isReverseUnlocked(card)) return false;
  const nr = card.srsReverse && card.srsReverse.nextReview;
  return !nr || nr <= Date.now();
}

export function reviewSide(sideState, knew) {
  const curBox = (sideState && sideState.box) || 0;
  const newBox = knew ? Math.min(curBox + 1, MAX_BOX) : 0;
  return {
    box: newBox,
    nextReview: daysFromNow(INTERVAL_DAYS[newBox]),
    reps: ((sideState && sideState.reps) || 0) + 1,
    lastReviewed: Date.now(),
  };
}

export function reviewCard(card, knew, direction) {
  const wrongCount = (card.wrongCount || 0) + (knew ? 0 : 1);

  let problemActive = !!card.problemActive;
  let problemResolved = !!card.problemResolved;

  let problemForwardCorrect = card.problemForwardCorrect || 0;
  let problemReverseCorrect = card.problemReverseCorrect || 0;

  let problemForwardWrong = card.problemForwardWrong || 0;
  let problemReverseWrong = card.problemReverseWrong || 0;

  if (direction === 'reverse') {
    if (knew) {
      problemReverseCorrect += 1;
      problemReverseWrong = 0;
    } else {
      problemReverseCorrect = 0;
      problemReverseWrong += 1;
    }
  } else {
    if (knew) {
      problemForwardCorrect += 1;
      problemForwardWrong = 0;
    } else {
      problemForwardCorrect = 0;
      problemForwardWrong += 1;
    }
  }

  if (!problemResolved && !problemActive && !knew) {
    problemActive = true;
  }

  if (problemActive) {
    const forwardSolved = problemForwardCorrect >= 3;
    const reverseSolved = problemReverseCorrect >= 3;

    if (forwardSolved && reverseSolved) {
      problemActive = false;
      problemResolved = true;
    }
  } else if (problemResolved && knew === false) {
    const forwardRelapse = direction !== 'reverse' && problemForwardWrong >= 2;
    const reverseRelapse = direction === 'reverse' && problemReverseWrong >= 2;

    if (forwardRelapse || reverseRelapse) {
      problemActive = true;
    }
  }

  const problemData = {
    problemActive,
    problemResolved,
    problemForwardCorrect,
    problemReverseCorrect,
    problemForwardWrong,
    problemReverseWrong,
  };

  if (direction === 'reverse') {
    return {
      ...card,
      wrongCount,
      ...problemData,
      srsReverse: reviewSide(card.srsReverse, knew),
    };
  }

  return {
    ...card,
    wrongCount,
    ...problemData,
    srs: reviewSide(card.srs, knew),
  };
}