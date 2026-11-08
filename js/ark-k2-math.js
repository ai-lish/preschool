(function attachArkK2Math(global) {
  'use strict';

  function shuffledCopy(items, random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function buildEquations(settings, operation) {
    const equations = [];
    for (let first = settings.operandMinimum; first <= settings.operandMaximum; first += 1) {
      for (let second = settings.operandMinimum; second <= settings.operandMaximum; second += 1) {
        if (operation === 'subtract' && first <= second) continue;
        const answer = operation === 'add' ? first + second : first - second;
        if (answer < settings.answerMinimum || answer > settings.answerMaximum) continue;
        equations.push({
          id: operation + '-' + first + '-' + second,
          operation,
          first,
          second,
          answer,
        });
      }
    }
    return equations;
  }

  function makeChoices(answer, settings, random) {
    const minimum = settings.answerMinimum;
    const maximum = settings.answerMaximum;
    const nearby = [];
    for (const offset of settings.distractorOffsets) {
      for (const value of [answer - offset, answer + offset]) {
        if (value >= minimum && value <= maximum && value !== answer && !nearby.includes(value)) {
          nearby.push(value);
        }
      }
    }
    const distractors = shuffledCopy(nearby, random).slice(0, 2);
    if (distractors.length < 2) {
      const remaining = [];
      for (let value = minimum; value <= maximum; value += 1) {
        if (value !== answer && !distractors.includes(value)) remaining.push(value);
      }
      distractors.push(...shuffledCopy(remaining, random).slice(0, 2 - distractors.length));
    }
    if (distractors.length !== 2) throw new Error('The answer range cannot provide two distractors.');
    return shuffledCopy([answer, ...distractors], random);
  }

  function generateRound(settings, animals, random, animalRotation = 0) {
    const randomSource = typeof random === 'function' ? random : Math.random;
    const animalList = Array.isArray(animals) ? animals : [];
    const questionCount = settings.questionsPerRound;
    const additionCount = settings.additionQuestionCount;
    const subtractionCount = questionCount - additionCount;
    if (!animalList.length || questionCount < 1 || additionCount < 0 || subtractionCount < 0) {
      throw new Error('Arithmetic generation settings or animal list are invalid.');
    }
    if (additionCount > buildEquations(settings, 'add').length ||
        subtractionCount > buildEquations(settings, 'subtract').length) {
      throw new Error('Arithmetic generation settings exceed the available equations.');
    }

    const operationSlots = shuffledCopy([
      ...Array.from({ length: additionCount }, () => 'add'),
      ...Array.from({ length: subtractionCount }, () => 'subtract'),
    ], randomSource);
    const candidates = {
      add: buildEquations(settings, 'add'),
      subtract: buildEquations(settings, 'subtract'),
    };
    const selected = [];
    const selectedIds = new Set();
    const answerCounts = new Map();

    function selectQuestion(slotIndex) {
      if (slotIndex === operationSlots.length) return true;
      const operation = operationSlots[slotIndex];
      const choices = shuffledCopy(candidates[operation], randomSource);
      for (const candidate of choices) {
        const count = answerCounts.get(candidate.answer) || 0;
        if (count >= settings.maxSameAnswerPerRound || selectedIds.has(candidate.id)) continue;
        selected.push(candidate);
        selectedIds.add(candidate.id);
        answerCounts.set(candidate.answer, count + 1);
        if (selectQuestion(slotIndex + 1)) return true;
        selected.pop();
        selectedIds.delete(candidate.id);
        if (count === 0) answerCounts.delete(candidate.answer);
        else answerCounts.set(candidate.answer, count);
      }
      return false;
    }

    if (!selectQuestion(0)) throw new Error('Unable to create a valid arithmetic round.');

    return selected.map((equation, index) => ({
      ...equation,
      animalId: animalList[(animalRotation + index) % animalList.length].id,
      choices: makeChoices(equation.answer, settings, randomSource),
    }));
  }

  global.ArkK2Math = Object.freeze({ generateRound });
})(window);
