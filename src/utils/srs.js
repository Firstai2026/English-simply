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
  if (direction === 'reverse') {
    return { ...card, wrongCount, srsReverse: reviewSide(card.srsReverse, knew) };
  }
  return { ...card, wrongCount, srs: reviewSide(card.srs, knew) };
}