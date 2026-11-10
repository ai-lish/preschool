(function attachArkK2Progress(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ArkK2Progress = api;
})(typeof window !== 'undefined' ? window : globalThis, function createArkK2Progress() {
  'use strict';

  function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function isDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function previousHKDate(date) {
    const parts = date.split('-').map(Number);
    const prior = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] - 1));
    return prior.toISOString().slice(0, 10);
  }

  function migrateProgress(saved, defaultLanguage) {
    const source = isRecord(saved) && saved.version === 1 ? saved : {};
    const migrated = {
      version: 1,
      language: defaultLanguage || 'zhHK',
      levels: {},
      mistakes: {},
      lastPracticeDate: '',
      learning: {},
      characterPracticeCount: {},
      stickers: [],
      practiceSecondsByDate: {},
      storyReadDates: {},
      copybookCompletions: {},
      ...source,
      version: 1,
    };
    migrated.language = ['zhHK', 'zhCN'].includes(source.language) ? source.language : (defaultLanguage || 'zhHK');
    migrated.levels = isRecord(source.levels) ? source.levels : {};
    migrated.mistakes = isRecord(source.mistakes) ? source.mistakes : {};
    migrated.learning = isRecord(source.learning) ? source.learning : {};
    migrated.characterPracticeCount = isRecord(source.characterPracticeCount) ? source.characterPracticeCount : {};
    migrated.stickers = Array.isArray(source.stickers) ? [...new Set(source.stickers.filter(item => typeof item === 'string'))] : [];
    migrated.practiceSecondsByDate = isRecord(source.practiceSecondsByDate) ? source.practiceSecondsByDate : {};
    migrated.storyReadDates = {};
    if (isRecord(source.storyReadDates)) {
      Object.entries(source.storyReadDates).forEach(([id, date]) => {
        if (typeof id === 'string' && id && isDate(date)) migrated.storyReadDates[id] = date;
      });
    }
    migrated.copybookCompletions = {};
    if (isRecord(source.copybookCompletions)) {
      Object.entries(source.copybookCompletions).forEach(([id, dates]) => {
        if (typeof id !== 'string' || !id || !Array.isArray(dates)) return;
        migrated.copybookCompletions[id] = [...new Set(dates.filter(isDate))].sort();
      });
    }
    Object.keys(migrated.practiceSecondsByDate).forEach(date => {
      const seconds = Number(migrated.practiceSecondsByDate[date]);
      migrated.practiceSecondsByDate[date] = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    });
    Object.keys(migrated.characterPracticeCount).forEach(id => {
      const count = Number(migrated.characterPracticeCount[id]);
      migrated.characterPracticeCount[id] = Number.isInteger(count) && count > 0 ? count : 0;
    });
    Object.keys(migrated.learning).forEach(key => {
      const old = isRecord(migrated.learning[key]) ? migrated.learning[key] : {};
      migrated.learning[key] = {
        kind: typeof old.kind === 'string' ? old.kind : '',
        id: typeof old.id === 'string' ? old.id : '',
        label: typeof old.label === 'string' ? old.label : key,
        lastSeenDate: typeof old.lastSeenDate === 'string' ? old.lastSeenDate : '',
        lastSelfCorrectDate: typeof old.lastSelfCorrectDate === 'string' ? old.lastSelfCorrectDate : '',
        consecutiveSelfCorrectDays: Number.isInteger(old.consecutiveSelfCorrectDays) ? Math.max(0, old.consecutiveSelfCorrectDays) : 0,
        mastered: old.mastered === true,
        daily: isRecord(old.daily) ? old.daily : {},
      };
    });
    return migrated;
  }

  function ensureLearningRecord(progress, item) {
    if (!isRecord(progress.learning)) progress.learning = {};
    const key = item.key;
    const previous = isRecord(progress.learning[key]) ? progress.learning[key] : {};
    const record = {
      kind: item.kind,
      id: String(item.id),
      label: item.label,
      lastSeenDate: previous.lastSeenDate || '',
      lastSelfCorrectDate: previous.lastSelfCorrectDate || '',
      consecutiveSelfCorrectDays: Number.isInteger(previous.consecutiveSelfCorrectDays) ? previous.consecutiveSelfCorrectDays : 0,
      mastered: previous.mastered === true,
      daily: isRecord(previous.daily) ? previous.daily : {},
    };
    progress.learning[key] = record;
    return record;
  }

  function recordSeen(progress, item, date) {
    const record = ensureLearningRecord(progress, item);
    record.lastSeenDate = date;
    return record;
  }

  function recordOutcome(progress, item, outcome, date) {
    const record = ensureLearningRecord(progress, item);
    const daily = isRecord(record.daily[date]) ? record.daily[date] : { mistakes: 0, selfCorrect: 0 };
    record.daily[date] = daily;
    record.lastSeenDate = date;
    if (outcome.mistake) {
      daily.mistakes = (Number(daily.mistakes) || 0) + 1;
      if (record.lastSelfCorrectDate !== date) record.consecutiveSelfCorrectDays = 0;
    }
    if (outcome.selfCorrect && record.lastSelfCorrectDate !== date) {
      daily.selfCorrect = (Number(daily.selfCorrect) || 0) + 1;
      record.consecutiveSelfCorrectDays = record.lastSelfCorrectDate === previousHKDate(date)
        ? record.consecutiveSelfCorrectDays + 1
        : 1;
      record.lastSelfCorrectDate = date;
      if (record.consecutiveSelfCorrectDays >= 2) record.mastered = true;
    }
    const retainedDates = Object.keys(record.daily).sort().slice(-30);
    const retained = {};
    retainedDates.forEach(day => { retained[day] = record.daily[day]; });
    record.daily = retained;
    return record;
  }

  function addPracticeSeconds(progress, date, seconds) {
    if (!isRecord(progress.practiceSecondsByDate)) progress.practiceSecondsByDate = {};
    const value = Number(seconds);
    if (!Number.isFinite(value) || value <= 0) return;
    progress.practiceSecondsByDate[date] = Math.round((Number(progress.practiceSecondsByDate[date]) || 0) + value);
  }

  function recordStoryRead(progress, chapterId, date) {
    if (!isRecord(progress.storyReadDates)) progress.storyReadDates = {};
    if (typeof chapterId !== 'string' || !chapterId || !isDate(date)) return;
    progress.storyReadDates[chapterId] = date;
  }

  function recordCopybookCompletion(progress, characterId, date) {
    if (!isRecord(progress.copybookCompletions)) progress.copybookCompletions = {};
    if (typeof characterId !== 'string' || !characterId || !isDate(date)) return;
    const dates = Array.isArray(progress.copybookCompletions[characterId])
      ? progress.copybookCompletions[characterId].filter(isDate)
      : [];
    progress.copybookCompletions[characterId] = [...new Set([...dates, date])].sort();
  }

  function reviewDelay(random) {
    const value = typeof random === 'function' ? random() : Math.random();
    return value < 0.5 ? 2 : 3;
  }

  function reviewDueAfter(currentQuestionIndex, delay, totalQuestions) {
    // currentQuestionIndex is zero based. A delay of 2 is due after two intervening base questions.
    return Math.min(totalQuestions, currentQuestionIndex + 1 + delay);
  }

  function isDueForNextDay(record, today) {
    return Boolean(record && !record.mastered && record.lastSeenDate && record.lastSeenDate < today);
  }

  function prioritizeQuestions(questions, itemKey, progress, today, random) {
    const source = [...questions];
    const shuffle = typeof random === 'function' ? random : Math.random;
    for (let index = source.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(shuffle() * (index + 1));
      [source[index], source[swap]] = [source[swap], source[index]];
    }
    const due = [];
    const regular = [];
    const mastered = [];
    source.forEach(question => {
      const record = progress.learning && progress.learning[itemKey(question)];
      if (isDueForNextDay(record, today)) due.push(question);
      else if (record && record.mastered) mastered.push(question);
      else regular.push(question);
    });
    return due.concat(regular, mastered);
  }

  function selectQuestions(questions, itemKey, progress, today, count, random, repeatWhenShort) {
    const ordered = prioritizeQuestions(questions, itemKey, progress, today, random);
    if (!repeatWhenShort || ordered.length >= count) return ordered.slice(0, count);

    const unmastered = ordered.filter(question => {
      const record = progress.learning && progress.learning[itemKey(question)];
      return !(record && record.mastered);
    });
    if (!unmastered.length) {
      const selected = [...ordered];
      const repeated = { ...ordered[0] };
      const firstIndex = selected.findIndex(question => itemKey(question) === itemKey(repeated));
      selected.splice(Math.min(selected.length, firstIndex + 3), 0, repeated);
      return selected.slice(0, count);
    }
    // Keep six distinct writing questions, then prefer an unmastered repeat before drawing more mastered items.
    const selected = ordered.slice(0, Math.max(1, count - 2));
    const selectedCounts = new Map();
    selected.forEach(question => selectedCounts.set(itemKey(question), (selectedCounts.get(itemKey(question)) || 0) + 1));
    const remainingUnmastered = unmastered.filter(question => !selectedCounts.has(itemKey(question)));
    selected.push(...remainingUnmastered.slice(0, count - selected.length));
    selectedCounts.clear();
    selected.forEach(question => selectedCounts.set(itemKey(question), (selectedCounts.get(itemKey(question)) || 0) + 1));

    const repeats = [];
    const repeatFrom = unmastered.length ? unmastered : ordered;
    for (const question of repeatFrom) {
      if (selected.length + repeats.length >= count) break;
      if ((selectedCounts.get(itemKey(question)) || 0) >= 2) continue;
      repeats.push({ ...question });
      selectedCounts.set(itemKey(question), (selectedCounts.get(itemKey(question)) || 0) + 1);
    }
    if (selected.length + repeats.length < count) {
      for (const question of ordered) {
        if (selected.length + repeats.length >= count) break;
        const key = itemKey(question);
        if (selectedCounts.has(key)) continue;
        selected.push(question);
        selectedCounts.set(key, 1);
      }
    }
    if (selected.length + repeats.length < count) {
      for (const question of ordered) {
        if (selected.length + repeats.length >= count) break;
        const key = itemKey(question);
        if ((selectedCounts.get(key) || 0) >= 2) continue;
        repeats.push({ ...question });
        selectedCounts.set(key, (selectedCounts.get(key) || 0) + 1);
      }
    }
    repeats.forEach(repeated => {
      const firstIndex = selected.findIndex(question => itemKey(question) === itemKey(repeated));
      selected.splice(Math.min(selected.length, firstIndex + 3), 0, repeated);
    });
    return selected.slice(0, count);
  }

  return Object.freeze({
    migrateProgress,
    recordSeen,
    recordOutcome,
    addPracticeSeconds,
    recordStoryRead,
    recordCopybookCompletion,
    reviewDelay,
    reviewDueAfter,
    isDueForNextDay,
    prioritizeQuestions,
    selectQuestions,
    previousHKDate,
  });
});
