'use strict';

const assert = require('node:assert/strict');
const ArkK2Progress = require('../js/ark-k2-progress.js');

const oldProgress = {
  version: 1,
  language: 'zhCN',
  levels: {
    'animal-listening': { stars: 2, bestCorrect: 7, playCount: 4, lastPractice: '2026-11-08' },
  },
  mistakes: { 'character:bing': { kind: 'character', id: 'bing', label: '冰', count: 3 } },
  lastPracticeDate: '2026-11-08',
};
const migrated = ArkK2Progress.migrateProgress(oldProgress, 'zhHK');
assert.equal(migrated.language, 'zhCN');
assert.equal(migrated.levels['animal-listening'].stars, 2);
assert.equal(migrated.levels['animal-listening'].playCount, 4);
assert.equal(migrated.mistakes['character:bing'].count, 3);
assert.deepEqual(migrated.stickers, []);
assert.deepEqual(migrated.practiceSecondsByDate, {});

const ice = { key: 'character:bing', kind: 'character', id: 'bing', label: '冰' };
ArkK2Progress.recordSeen(migrated, ice, '2026-11-08');
ArkK2Progress.recordOutcome(migrated, ice, { selfCorrect: true }, '2026-11-08');
assert.equal(migrated.learning['character:bing'].consecutiveSelfCorrectDays, 1);
assert.equal(migrated.learning['character:bing'].mastered, false);
ArkK2Progress.recordSeen(migrated, ice, '2026-11-09');
ArkK2Progress.recordOutcome(migrated, ice, { selfCorrect: true }, '2026-11-09');
assert.equal(migrated.learning['character:bing'].consecutiveSelfCorrectDays, 2);
assert.equal(migrated.learning['character:bing'].mastered, true);

const countEight = { key: 'count:8', kind: 'count', id: '8', label: '數到 8' };
ArkK2Progress.recordOutcome(migrated, countEight, { mistake: true }, '2026-11-09');
assert.equal(migrated.learning['count:8'].daily['2026-11-09'].mistakes, 1);
assert.equal(ArkK2Progress.isDueForNextDay(migrated.learning['count:8'], '2026-11-10'), true);
assert.equal(ArkK2Progress.isDueForNextDay(migrated.learning['character:bing'], '2026-11-10'), false);

assert.equal(ArkK2Progress.reviewDelay(() => 0), 2);
assert.equal(ArkK2Progress.reviewDelay(() => 0.99), 3);
assert.equal(ArkK2Progress.reviewDueAfter(0, 2, 8), 3);
assert.equal(ArkK2Progress.reviewDueAfter(6, 3, 8), 8);
assert.equal(ArkK2Progress.reviewDueAfter(7, 3, 8), 8);

for (const delay of [2, 3]) {
  const dueAfterBase = ArkK2Progress.reviewDueAfter(0, delay, 8);
  const interveningBaseQuestions = dueAfterBase - 1;
  assert.equal(interveningBaseQuestions, delay);
  assert.equal(dueAfterBase > 0, true);
}

const sampleQuestions = [
  { id: 'a' }, { id: 'b' }, { id: 'c' },
];
const prioritized = ArkK2Progress.prioritizeQuestions(
  sampleQuestions,
  question => question.id,
  { learning: { b: { mastered: false, lastSeenDate: '2026-11-08' } } },
  '2026-11-09',
  () => 0.5,
);
assert.equal(prioritized[0].id, 'b');

const animalPool = Array.from({ length: 11 }, (_, index) => ({ id: 'animal-' + index }));
const animalProgress = {
  learning: {
    'animal-0': { mastered: true },
    'animal-1': { mastered: true },
    'animal-2': { mastered: true },
  },
};
const selectedAnimals = ArkK2Progress.selectQuestions(
  animalPool,
  question => question.id,
  animalProgress,
  '2026-11-09',
  8,
  () => 0.5,
  false,
);
assert.equal(selectedAnimals.length, 8);
assert.equal(selectedAnimals.some(question => ['animal-0', 'animal-1', 'animal-2'].includes(question.id)), false);

const writingPool = 'abcdefg'.split('').map(id => ({ id }));
const writingProgress = {
  learning: Object.fromEntries('bcdefg'.split('').map(id => [id, { mastered: true }])),
};
const selectedWriting = ArkK2Progress.selectQuestions(
  writingPool,
  question => question.id,
  writingProgress,
  '2026-11-09',
  8,
  () => 0.5,
  true,
);
assert.equal(selectedWriting.length, 8);
assert.equal(selectedWriting.filter(question => question.id === 'a').length, 2);
assert.equal(selectedWriting.filter(question => question.id !== 'a').length, 6);
const writingAIndices = selectedWriting.flatMap((question, index) => question.id === 'a' ? [index] : []);
assert.deepEqual(writingAIndices, [0, 3], 'the optional eighth writing question repeats the least-practiced item after two intervening questions');

const writingProgressWithSeveralNewItems = {
  learning: Object.fromEntries('efg'.split('').map(id => [id, { mastered: true }])),
};
const selectedWritingWithSeveralNewItems = ArkK2Progress.selectQuestions(
  writingPool,
  question => question.id,
  writingProgressWithSeveralNewItems,
  '2026-11-09',
  8,
  () => 0.5,
  true,
);
assert.equal(selectedWritingWithSeveralNewItems.length, 8);
assert.equal(selectedWritingWithSeveralNewItems.some(question => question.id === 'g'), false, 'a mastered character is omitted when unmastered practice can fill the round');
for (const id of 'abcd') {
  assert.ok(selectedWritingWithSeveralNewItems.filter(question => question.id === id).length >= 1);
}

const selectedWritingWhenAllMastered = ArkK2Progress.selectQuestions(
  writingPool,
  question => question.id,
  { learning: Object.fromEntries('abcdefg'.split('').map(id => [id, { mastered: true }])) },
  '2026-11-09',
  8,
  () => 0.5,
  true,
);
assert.equal(selectedWritingWhenAllMastered.length, 8);
assert.equal(new Set(selectedWritingWhenAllMastered.map(question => question.id)).size, 7);

migrated.stickers.push('cow');
ArkK2Progress.addPracticeSeconds(migrated, '2026-11-09', 61);
assert.deepEqual(migrated.stickers, ['cow']);
assert.equal(migrated.practiceSecondsByDate['2026-11-09'], 61);
console.log('Ark K2 migration, streak, next-day priority, unscored review timing, stickers and play-time checks passed.');
