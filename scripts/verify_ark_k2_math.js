#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/ark-k2.json'), 'utf8'));
const source = fs.readFileSync(path.join(root, 'js/ark-k2-math.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: 'js/ark-k2-math.js' });
const generateRound = sandbox.window.ArkK2Math.generateRound;

function seededRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

const answerDistribution = Object.fromEntries(
  Array.from({ length: 10 }, (_, index) => [String(index + 1), 0]),
);
const operationCounts = { add: 0, subtract: 0 };
const answerPositionCounts = [0, 0, 0];
const animalIds = new Set(data.animals.map(animal => animal.id));
let previousRoundSignature = '';

for (let roundIndex = 0; roundIndex < 1000; roundIndex += 1) {
  const questions = generateRound(
    data.arithmetic,
    data.animals,
    seededRandom(0x0a7c0000 + roundIndex + 1),
    roundIndex * data.arithmetic.questionsPerRound,
  );
  assert.equal(questions.length, 8, 'every round has eight questions');
  const equationIds = new Set();
  const answerCounts = new Map();
  for (const question of questions) {
    assert.ok(question.answer >= 1 && question.answer <= 10, 'answer range is 1–10');
    assert.ok(question.first >= 1 && question.first <= 9, 'first operand range is 1–9');
    assert.ok(question.second >= 1 && question.second <= 9, 'second operand range is 1–9');
    assert.ok(!equationIds.has(question.id), 'no repeated equation in a round');
    equationIds.add(question.id);
    answerCounts.set(question.answer, (answerCounts.get(question.answer) || 0) + 1);
    assert.ok(answerCounts.get(question.answer) <= 2, 'an answer appears at most twice');
    assert.equal(question.choices.length, 3, 'three answer choices');
    assert.equal(new Set(question.choices).size, 3, 'answer choices are distinct');
    assert.ok(question.choices.includes(question.answer), 'choices include the correct answer');
    assert.ok(question.choices.every(value => value >= 1 && value <= 10), 'choice range is 1–10');
    assert.ok(animalIds.has(question.animalId), 'animal comes from the existing list');
    operationCounts[question.operation] += 1;
    answerDistribution[String(question.answer)] += 1;
    answerPositionCounts[question.choices.indexOf(question.answer)] += 1;
  }
  assert.equal(questions.filter(question => question.operation === 'add').length, 4, 'four additions');
  assert.equal(questions.filter(question => question.operation === 'subtract').length, 4, 'four subtractions');
  const signature = questions.map(question => question.id).join(',');
  assert.notEqual(signature, previousRoundSignature, 'consecutive rounds differ');
  previousRoundSignature = signature;
}

console.log(JSON.stringify({
  rounds: 1000,
  questions: 8000,
  operationCounts,
  answerDistribution,
  answerPositionCounts,
  constraints: {
    operands: '1–9',
    answersAndChoices: '1–10',
    repeatedEquationsPerRound: 0,
    maximumSameAnswerPerRound: 2,
    additionsPerRound: 4,
    subtractionsPerRound: 4,
  },
}, null, 2));
