'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/ark-k2.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../audio/ark-k2/manifest.json'), 'utf8'));
const ArkK2Progress = require('../js/ark-k2-progress.js');
const ArkK2Strokes = require('../js/ark-k2-strokes.js');

const expected = [
  ['yi', '一', '2026-09-21', ['橫'], ['horizontal']],
  ['shi', '十', '2026-09-28', ['橫', '豎'], ['horizontal', 'vertical']],
  ['tu', '土', '2026-10-05', ['橫', '豎', '橫'], ['horizontal', 'vertical', 'horizontal']],
  ['gong', '工', '2026-10-12', ['橫', '豎', '橫'], ['horizontal', 'vertical', 'horizontal']],
  ['kou', '口', '2026-10-26', ['豎', '橫折', '橫'], ['vertical', 'horizontalFold', 'horizontal']],
  ['ri', '日', '2026-11-02', ['豎', '橫折', '橫', '橫'], ['vertical', 'horizontalFold', 'horizontal', 'horizontal']],
  ['bai', '白', '2026-11-09', ['撇', '豎', '橫折', '橫', '橫'], ['slant', 'vertical', 'horizontalFold', 'horizontal', 'horizontal']],
];
const zhongwenbu = data.copybook.sets.find(set => set.id === 'zhongwenbu');
const xieqian = data.copybook.sets.find(set => set.id === 'xieqian');
assert.ok(zhongwenbu);
assert.ok(xieqian);
assert.match(data.copybook.strokeDataSource, /依本次任務指定/);
assert.equal(zhongwenbu.items.length, expected.length);
assert.equal(xieqian.items.length, data.characters.length);

const bai = zhongwenbu.items.find(item => item.id === 'bai');
assert.ok(bai);
assert.ok(bai.strokes[0].points.every(point => point[1] <= 300), '白字撇 must stay above the口框頂線');
const gong = zhongwenbu.items.find(item => item.id === 'gong');
assert.ok(gong);
assert.ok(gong.strokes[1].points[0][1] >= gong.strokes[0].points[0][1], '工字豎 must start at or below the上橫');

function checkDirection(stroke, index) {
  const points = stroke.points;
  assert.ok(points.length >= 2, `${stroke.name} needs at least two points`);
  const first = points[0];
  const last = points[points.length - 1];
  if (stroke.type === 'horizontal') {
    assert.ok(last[0] > first[0], `horizontal stroke ${index} must go left to right`);
    assert.ok(Math.abs(last[1] - first[1]) <= 2, `horizontal stroke ${index} must stay level`);
  } else if (stroke.type === 'vertical') {
    assert.ok(last[1] > first[1], `vertical stroke ${index} must go top to bottom`);
    assert.ok(Math.abs(last[0] - first[0]) <= 2, `vertical stroke ${index} must stay upright`);
  } else if (stroke.type === 'slant') {
    assert.ok(last[0] < first[0] && last[1] > first[1], `撇 ${index} must go upper right to lower left`);
  } else if (stroke.type === 'horizontalFold') {
    assert.equal(points.length, 3, `橫折 ${index} must be one continuous stroke`);
    assert.ok(points[1][0] > points[0][0], `橫折 ${index} first segment must go right`);
    assert.ok(Math.abs(points[1][1] - points[0][1]) <= 2, `橫折 ${index} first segment must be horizontal`);
    assert.ok(points[2][1] > points[1][1], `橫折 ${index} second segment must go down`);
    assert.ok(Math.abs(points[2][0] - points[1][0]) <= 2, `橫折 ${index} second segment must be vertical`);
  } else {
    assert.fail(`unsupported stroke type ${stroke.type}`);
  }
}

let previousDate = '';
for (let itemIndex = 0; itemIndex < expected.length; itemIndex += 1) {
  const [id, char, date, strokeNames, strokeTypes] = expected[itemIndex];
  const item = zhongwenbu.items[itemIndex];
  assert.equal(item.id, id);
  assert.equal(item.char, char);
  assert.equal(item.date, date);
  assert.ok(item.date > previousDate, `${char} date must follow the previous item`);
  previousDate = item.date;
  assert.equal(item.strokes.length, strokeNames.length, `${char} stroke count`);
  assert.equal(item.strokeCount, strokeNames.length, `${char} declared stroke count`);
  assert.deepEqual(item.strokes.map(stroke => stroke.name), strokeNames, `${char} stroke sequence`);
  assert.deepEqual(item.strokes.map(stroke => stroke.type), strokeTypes, `${char} stroke types`);
  item.strokes.forEach(checkDirection);

  const chapter = data.story.chapters.find(entry => entry.charId === item.id);
  assert.ok(chapter, `missing story chapter for ${char}`);
  assert.ok(chapter.text.zhHK.includes(char), `Hong Kong story text must include ${char}`);
  assert.ok(chapter.text.zhCN.includes(char), `Simplified story text must include ${char}`);
  assert.equal(chapter.date, date);
  assert.ok(fs.existsSync(path.join(__dirname, '..', chapter.image)), `missing story image ${chapter.image}`);
}

assert.equal(data.story.chapters.length, 7);
assert.equal(manifest.generatedCount, manifest.plannedCount);
const newVoiceKeys = new Set([
  ...zhongwenbu.items.map(item => item.voiceKey),
  ...data.story.chapters.map(chapter => chapter.audio),
]);
const newAudio = manifest.assets.filter(asset => newVoiceKeys.has(asset.key));
assert.equal(newAudio.length, 28);
newAudio.forEach(asset => {
  assert.equal(asset.status, 'generated', `${asset.language}:${asset.key} must be generated`);
  assert.ok(fs.existsSync(path.join(__dirname, '..', asset.path)), `missing audio ${asset.path}`);
});
for (const item of xieqian.items) {
  assert.ok(data.characters.some(character => character.id === item.characterId), `unresolved writing character ${item.characterId}`);
}

const legacyProgress = {
  version: 1,
  language: 'zhCN',
  levels: { 'animal-listening': { stars: 2, playCount: 3, bestCorrect: 7 } },
  mistakes: { 'character:bing': { kind: 'character', id: 'bing', count: 2 } },
  stickers: ['sheep'],
};
const migrated = ArkK2Progress.migrateProgress(legacyProgress, 'zhHK');
assert.equal(migrated.language, 'zhCN');
assert.equal(migrated.levels['animal-listening'].stars, 2);
assert.equal(migrated.levels['animal-listening'].playCount, 3);
assert.equal(migrated.mistakes['character:bing'].count, 2);
assert.deepEqual(migrated.stickers, ['sheep']);
assert.deepEqual(migrated.storyReadDates, {});
assert.deepEqual(migrated.copybookCompletions, {});
ArkK2Progress.recordStoryRead(migrated, 'story_01', '2026-11-10');
ArkK2Progress.recordCopybookCompletion(migrated, 'yi', '2026-11-10');
ArkK2Progress.recordCopybookCompletion(migrated, 'yi', '2026-11-10');
assert.equal(migrated.storyReadDates.story_01, '2026-11-10');
assert.deepEqual(migrated.copybookCompletions.yi, ['2026-11-10']);

assert.equal(ArkK2Strokes.followsStroke([[180, 500], [500, 500], [820, 500]], [[180, 500], [820, 500]]), true);
assert.equal(ArkK2Strokes.followsStroke([[820, 500], [500, 500], [180, 500]], [[180, 500], [820, 500]]), false);

console.log('Copybook data, stroke directions, story links, progress migration, and shared followsStroke checks passed.');
