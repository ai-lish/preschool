'use strict';

const DATA_URL = 'data/ark-k2.json';
const VOICE_MANIFEST_URL = 'audio/ark-k2/manifest.json';
const app = document.getElementById('arkApp');

const ui = {
  header: document.querySelector('.ark-header'),
  home: document.getElementById('homeScreen'),
  game: document.getElementById('gameScreen'),
  parents: document.getElementById('parentScreen'),
  result: document.getElementById('resultScreen'),
  storyList: document.getElementById('storyListScreen'),
  storyReader: document.getElementById('storyReaderScreen'),
  storyOpen: document.getElementById('storyOpen'),
  storyEntryTitle: document.getElementById('storyEntryTitle'),
  storyReadCount: document.getElementById('storyReadCount'),
  storyListTitle: document.getElementById('storyListTitle'),
  storyListReadCount: document.getElementById('storyListReadCount'),
  storyChapterList: document.getElementById('storyChapterList'),
  storyListBack: document.getElementById('storyListBack'),
  storyReaderBack: document.getElementById('storyReaderBack'),
  storyReaderList: document.getElementById('storyReaderList'),
  storyChapterDate: document.getElementById('storyChapterDate'),
  storyChapterTitle: document.getElementById('storyChapterTitle'),
  storyChapterImage: document.getElementById('storyChapterImage'),
  storyChapterText: document.getElementById('storyChapterText'),
  storyHighlightHelp: document.getElementById('storyHighlightHelp'),
  storyReadButton: document.getElementById('storyReadButton'),
  storyPrev: document.getElementById('storyPrev'),
  storyNext: document.getElementById('storyNext'),
  storyCopybookLink: document.getElementById('storyCopybookLink'),
  parentStorySummary: document.getElementById('parentStorySummary'),
  levelGrid: document.getElementById('levelGrid'),
  totalStars: document.getElementById('totalStars'),
  voiceStatus: document.getElementById('voiceStatus'),
  gameVoiceStatus: document.getElementById('gameVoiceStatus'),
  parentTab: document.getElementById('parentTab'),
  backToLevels: document.getElementById('backToLevels'),
  levelKicker: document.getElementById('levelKicker'),
  levelTitle: document.getElementById('levelTitle'),
  levelDemo: document.getElementById('levelDemo'),
  questionCounter: document.getElementById('questionCounter'),
  questionProgress: document.getElementById('questionProgress'),
  levelInstruction: document.getElementById('levelInstruction'),
  playScene: document.getElementById('playScene'),
  feedback: document.getElementById('feedback'),
  playActions: document.getElementById('playActions'),
  resultKicker: document.getElementById('resultKicker'),
  resultTitle: document.getElementById('resultTitle'),
  resultScore: document.getElementById('resultScore'),
  resultStars: document.getElementById('resultStars'),
  resultActions: document.getElementById('resultActions'),
  resultAnimalsHeading: document.getElementById('resultAnimalsHeading'),
  resultAnimals: document.getElementById('resultAnimals'),
  processPraise: document.getElementById('processPraise'),
  newStickerLabel: document.getElementById('newStickerLabel'),
  stickerBook: document.getElementById('stickerBook'),
  parentIntro: document.getElementById('parentIntro'),
  parentLevelScores: document.getElementById('parentLevelScores'),
  recentDateValue: document.getElementById('recentDateValue'),
  reviewRule: document.getElementById('reviewRule'),
  parentSuggestions: document.getElementById('parentSuggestions'),
  noMistakes: document.getElementById('noMistakes'),
  practiceChart: document.getElementById('practiceChart'),
  practiceTimeNote: document.getElementById('practiceTimeNote'),
  clearProgress: document.getElementById('clearProgress'),
};

let data;
let voiceManifest;
let progress;
let currentScreen = 'home';
let stageRun = null;
let activeAudio = null;
let activeAudioResolver = null;
let currentCanvas = null;
let drawingPointer = null;
let lastDraggedSheep = null;
let suppressSheepClick = false;
let visibleGameStartedAt = 0;
let visibleGameTimer = null;
let activeStoryChapterIndex = -1;

function locale() {
  return progress && progress.language === 'zhCN' ? 'zhCN' : 'zhHK';
}

function text(value) {
  if (value && typeof value === 'object') return value[locale()] || value.zhHK || '';
  return value == null ? '' : String(value);
}

function interpolate(template, values) {
  let result = text(template);
  Object.entries(values || {}).forEach(entry => {
    result = result.split('{' + entry[0] + '}').join(String(entry[1]));
  });
  return result;
}

function t(key, values) {
  return interpolate(data.interface[key], values || {});
}

function staticText(key, values) {
  return interpolate(data.staticText[key], values || {});
}

function emptyProgress() {
  return ArkK2Progress.migrateProgress(null, data.settings.localeDefault);
}

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(data.settings.storageKey) || 'null');
    return ArkK2Progress.migrateProgress(saved, data.settings.localeDefault);
  } catch (error) {
    return emptyProgress();
  }
}

function writeProgress() {
  try {
    localStorage.setItem(data.settings.storageKey, JSON.stringify(progress));
  } catch (error) {
    if (ui.voiceStatus) ui.voiceStatus.textContent = locale() === 'zhCN' ? '瀏覽器暫時無法儲存進度。' : '瀏覽器暫時無法儲存進度。';
  }
}

function hkDateFromTimestamp(timestamp) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Hong_Kong',
  }).formatToParts(new Date(timestamp));
  const fields = {};
  parts.forEach(part => { if (part.type !== 'literal') fields[part.type] = part.value; });
  return fields.year + '-' + fields.month + '-' + fields.day;
}

function todayInHongKong() {
  return hkDateFromTimestamp(Date.now());
}

function dateOffset(date, days) {
  const parts = date.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days)).toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return '—';
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  return locale() === 'zhCN'
    ? parts[1] + '月' + parts[2] + '日'
    : parts[1] + '月' + parts[2] + '日';
}

function splitAtHongKongMidnight(start, end) {
  let cursor = start;
  let day = hkDateFromTimestamp(cursor);
  while (hkDateFromTimestamp(end) !== day) {
    let low = cursor;
    let high = end;
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);
      if (hkDateFromTimestamp(middle) === day) low = middle;
      else high = middle;
    }
    ArkK2Progress.addPracticeSeconds(progress, day, (high - cursor) / 1000);
    cursor = high;
    day = hkDateFromTimestamp(cursor);
  }
  ArkK2Progress.addPracticeSeconds(progress, day, (end - cursor) / 1000);
}

function flushVisibleGameTime() {
  if (!visibleGameStartedAt) return;
  const now = Date.now();
  if (now > visibleGameStartedAt) splitAtHongKongMidnight(visibleGameStartedAt, now);
  visibleGameStartedAt = now;
  progress.lastPracticeDate = todayInHongKong();
  writeProgress();
}

function startVisibleGameTime() {
  if (currentScreen !== 'game' || document.visibilityState !== 'visible' || visibleGameStartedAt) return;
  visibleGameStartedAt = Date.now();
  if (!visibleGameTimer) visibleGameTimer = window.setInterval(flushVisibleGameTime, 15000);
}

function stopVisibleGameTime() {
  flushVisibleGameTime();
  visibleGameStartedAt = 0;
  if (visibleGameTimer) {
    window.clearInterval(visibleGameTimer);
    visibleGameTimer = null;
  }
}

function levelRecord(id) {
  const old = progress.levels[id] || {};
  return {
    stars: Number.isInteger(old.stars) ? Math.max(0, Math.min(3, old.stars)) : 0,
    bestCorrect: Number.isInteger(old.bestCorrect) ? Math.max(0, Math.min(8, old.bestCorrect)) : 0,
    playCount: Number.isInteger(old.playCount) ? Math.max(0, old.playCount) : 0,
    lastPractice: typeof old.lastPractice === 'string' ? old.lastPractice : '',
  };
}

function getAnimal(id) {
  return data.animals.find(animal => animal.id === id);
}

function getCharacter(id) {
  return data.characters.find(character => character.id === id);
}

function updateHashForScreen(name) {
  if (!window.history || !window.history.replaceState) return;
  if (name === 'parents' && window.location.hash !== '#parents') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search + '#parents');
  } else if (name !== 'parents' && window.location.hash === '#parents') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function setScreen(name) {
  if (currentScreen === 'game' && name !== 'game') stopVisibleGameTime();
  currentScreen = name;
  document.body.dataset.arkScreen = name;
  ui.home.hidden = name !== 'home';
  ui.game.hidden = name !== 'game';
  ui.parents.hidden = name !== 'parents';
  ui.result.hidden = name !== 'result';
  ui.storyList.hidden = name !== 'story-list';
  ui.storyReader.hidden = name !== 'story-reader';
  updateHashForScreen(name);
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (name === 'home') renderHome();
  if (name === 'parents') renderParentReport();
  if (name === 'story-list') renderStoryList();
  if (name === 'game') startVisibleGameTime();
}

function updateLanguageButtons() {
  document.documentElement.lang = locale() === 'zhCN' ? 'zh-CN' : 'zh-HK';
  ui.parentTab.textContent = t('parentTab');
  ui.levelDemo.textContent = locale() === 'zhCN' ? '看示范' : '睇示範';
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === locale()));
  });
  document.querySelectorAll('[data-localize]').forEach(element => {
    element.textContent = staticText(element.dataset.localize);
  });
  document.querySelectorAll('[data-localize-aria-label]').forEach(element => {
    element.setAttribute('aria-label', staticText(element.dataset.localizeAriaLabel));
  });
  document.title = text(data.title) + ' — ' + (locale() === 'zhCN' ? '幼儿学习中心' : '幼兒學習中心');
  if (ui.storyEntryTitle) ui.storyEntryTitle.textContent = storyLabel('entryTitle');
  if (ui.storyReadButton) ui.storyReadButton.textContent = locale() === 'zhCN' ? '🔊 朗读' : '🔊 朗讀';
  if (ui.storyHighlightHelp) ui.storyHighlightHelp.textContent = locale() === 'zhCN' ? '点一下闪亮的字，听听它怎么读。' : '撳一下閃亮嘅字，聽聽佢點讀。';
  if (ui.storyListBack) ui.storyListBack.textContent = locale() === 'zhCN' ? '← 任务列表' : '← 任務列表';
  if (ui.storyReaderBack) ui.storyReaderBack.textContent = locale() === 'zhCN' ? '← 故事列表' : '← 故事列表';
  if (ui.storyReaderList) ui.storyReaderList.textContent = locale() === 'zhCN' ? '返回任务列表' : '返任務列表';
  if (ui.storyPrev) ui.storyPrev.textContent = locale() === 'zhCN' ? '上一章' : '上一章';
  if (ui.storyNext) ui.storyNext.textContent = locale() === 'zhCN' ? '下一章' : '下一章';
  if (ui.storyCopybookLink) ui.storyCopybookLink.textContent = locale() === 'zhCN' ? '去练字' : '去練字';
  if (currentScreen === 'story-list') renderStoryList();
  if (currentScreen === 'story-reader' && activeStoryChapterIndex >= 0) renderStoryChapter(activeStoryChapterIndex);
}

function setLanguage(nextLanguage) {
  if (!['zhHK', 'zhCN'].includes(nextLanguage) || nextLanguage === locale()) return;
  stopActiveAudio();
  progress.language = nextLanguage;
  writeProgress();
  updateLanguageButtons();
  if (currentScreen === 'home') renderHome();
  if (currentScreen === 'game' && stageRun) renderQuestion();
  if (currentScreen === 'parents') renderParentReport();
  if (currentScreen === 'result' && stageRun) renderStageResult();
}

function voiceAssetPath(key) {
  const asset = (voiceManifest && voiceManifest.assets || []).find(item =>
    item.key === key && item.language === locale() && item.status === 'generated' && item.path,
  );
  return asset ? asset.path : '';
}

function setVoiceMissing() {
  const message = t('missingVoice');
  ui.voiceStatus.textContent = message;
  if (currentScreen === 'game') {
    ui.gameVoiceStatus.textContent = message;
    ui.gameVoiceStatus.hidden = false;
  }
}

function clearVoiceMissing() {
  ui.voiceStatus.textContent = '';
  ui.gameVoiceStatus.textContent = '';
  ui.gameVoiceStatus.hidden = true;
}

function stopActiveAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (activeAudioResolver) {
    const resolve = activeAudioResolver;
    activeAudioResolver = null;
    resolve(false);
  }
}

function playAudioPath(path) {
  if (!path) return Promise.resolve(false);
  stopActiveAudio();
  return new Promise(resolve => {
    const audio = new Audio(path);
    activeAudio = audio;
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      if (activeAudio === audio) activeAudio = null;
      if (activeAudioResolver === finish) activeAudioResolver = null;
      resolve(value);
    };
    activeAudioResolver = finish;
    audio.addEventListener('ended', () => finish(true), { once: true });
    audio.addEventListener('error', () => {
      setVoiceMissing();
      finish(false);
    }, { once: true });
    audio.play().catch(() => {
      setVoiceMissing();
      finish(false);
    });
  });
}

function playClip(key) {
  const path = voiceAssetPath(key);
  if (!path) {
    setVoiceMissing();
    return Promise.resolve(false);
  }
  clearVoiceMissing();
  return playAudioPath(path);
}

async function playClipSequence(keys) {
  for (const key of keys) {
    const path = voiceAssetPath(key);
    if (!path) {
      setVoiceMissing();
      return false;
    }
    const played = await playAudioPath(path);
    if (!played) return false;
    await new Promise(resolve => window.setTimeout(resolve, 100));
  }
  return true;
}

function playQuestionVoice(keys) {
  const sequence = Array.isArray(keys) ? [...keys] : [keys];
  const question = stageRun && stageRun.currentQuestion;
  if (question && !question.isReview && !stageRun.levelVoicePlayed) {
    sequence.unshift(stageRun.level.voiceKey);
    stageRun.levelVoicePlayed = true;
  }
  return playClipSequence(sequence);
}

function playAnimalSound(animal) {
  const path = animal.sound && animal.sound[locale()];
  if (!path) return playClip(animal.voiceKey);
  clearVoiceMissing();
  return playAudioPath(path).then(played => played ? true : playClip(animal.voiceKey));
}

function showFeedback(message, isError) {
  ui.feedback.textContent = message || '';
  ui.feedback.classList.toggle('is-error', Boolean(isError));
}

function showHintFeedback(message) {
  showFeedback(message, true);
  playClip('hint');
}

function praiseThenAdvance() {
  playClip('praise').then(() => window.setTimeout(advanceQuestion, 280));
}

function clearPlayPanels() {
  ui.playScene.replaceChildren();
  ui.playActions.replaceChildren();
  ui.feedback.textContent = '';
  ui.feedback.classList.remove('is-error');
  currentCanvas = null;
  drawingPointer = null;
  lastDraggedSheep = null;
}

function createText(tagName, className, value) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (value != null) element.textContent = value;
  return element;
}

function createAudioIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('ark-audio-icon');
  svg.innerHTML = '<path d="M4 9v6h4l5 4V5L8 9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  return svg;
}

function renderHome() {
  updateLanguageButtons();
  updateStoryReadCount();
  ui.totalStars.textContent = '☆ ' + data.levels.reduce((total, level) => total + levelRecord(level.id).stars, 0) + ' / ' + (data.levels.length * 3);
  ui.levelGrid.replaceChildren();
  const icons = ['♫', '✎', '🐑', '＋−'];
  data.levels.forEach((level, index) => {
    const unlocked = index === 0 || levelRecord(data.levels[index - 1].id).stars >= data.settings.unlockMinimumStars;
    const button = document.createElement('button');
    button.className = 'ark-level-card';
    button.type = 'button';
    button.disabled = !unlocked;
    button.dataset.level = level.id;
    const kicker = createText('span', 'ark-level-number', interpolate(data.staticText.levelNumber, { number: index + 1 }) + (unlocked ? '' : ' · 🔒'));
    const icon = createText('span', 'ark-level-icon', icons[index]);
    icon.setAttribute('aria-hidden', 'true');
    const title = createText('span', 'ark-level-title', text(level.title));
    const record = levelRecord(level.id);
    const stars = createText('span', 'ark-level-stars', '★'.repeat(record.stars) + '☆'.repeat(3 - record.stars));
    stars.setAttribute('aria-label', interpolate(data.staticText.starLabel, { number: record.stars }));
    button.append(kicker, icon, title, stars);
    button.addEventListener('click', () => startLevel(level.id));
    ui.levelGrid.append(button);
  });
}

function storyLabel(key, values) {
  const labels = {
    entryTitle: { zhHK: '故事：挪亞造方舟', zhCN: '故事：挪亚造方舟' },
    backToTasks: { zhHK: '返任務列表', zhCN: '返回任务列表' },
    chapter: { zhHK: '第 {number} 章', zhCN: '第 {number} 章' },
    readCount: { zhHK: '已讀 {count}／{total} 章', zhCN: '已读 {count}／{total} 章' },
    locked: { zhHK: '未解鎖 · {date} 開放', zhCN: '未解锁 · {date} 开放' },
    read: { zhHK: '已讀', zhCN: '已读' },
    tapTarget: { zhHK: '目標字：{char}', zhCN: '目标字：{char}' },
  };
  return interpolate(labels[key] || { zhHK: '', zhCN: '' }, values || {});
}

function updateStoryReadCount() {
  if (!data.story || !progress) return;
  const total = data.story.chapters.length;
  const count = data.story.chapters.filter(chapter => progress.storyReadDates[chapter.id]).length;
  const label = storyLabel('readCount', { count, total });
  if (ui.storyReadCount) ui.storyReadCount.textContent = label;
  if (ui.storyListReadCount) ui.storyListReadCount.textContent = label;
  if (ui.storyListTitle) ui.storyListTitle.textContent = text(data.story.title);
}

function copybookItemFor(id) {
  for (const set of data.copybook.sets) {
    const item = set.items.find(entry => entry.id === id || entry.characterId === id);
    if (item) {
      return item.characterId ? data.characters.find(character => character.id === item.characterId) : item;
    }
  }
  return data.characters.find(character => character.id === id);
}

function storyChapterUnlocked(chapter) {
  return todayInHongKong() >= chapter.date;
}

function renderStoryList() {
  updateStoryReadCount();
  ui.storyChapterList.replaceChildren();
  data.story.chapters.forEach((chapter, index) => {
    const unlocked = storyChapterUnlocked(chapter);
    const entry = document.createElement('button');
    entry.type = 'button';
    entry.className = 'ark-story-chapter-card' + (unlocked ? '' : ' is-locked');
    entry.disabled = !unlocked;
    const number = createText('span', 'ark-story-chapter-number', String(index + 1));
    const copy = document.createElement('span');
    copy.className = 'ark-story-chapter-copy';
    const character = copybookItemFor(chapter.charId);
    const title = createText('strong', '', storyLabel('chapter', { number: index + 1 }) + ' · ' + (character ? text(character.label) : ''));
    const status = unlocked
      ? (progress.storyReadDates[chapter.id] ? storyLabel('read') : formatDate(chapter.date))
      : storyLabel('locked', { date: formatDate(chapter.date) });
    const summary = createText('small', '', status);
    copy.append(title, summary);
    const icon = createText('span', 'ark-story-chapter-lock', unlocked ? (progress.storyReadDates[chapter.id] ? '✓' : '›') : '🔒');
    icon.setAttribute('aria-hidden', 'true');
    entry.append(number, copy, icon);
    if (unlocked) entry.addEventListener('click', () => openStoryChapter(index));
    ui.storyChapterList.append(entry);
  });
}

function openStoryChapter(index) {
  if (!data.story.chapters[index] || !storyChapterUnlocked(data.story.chapters[index])) return;
  activeStoryChapterIndex = index;
  renderStoryChapter(index);
  setScreen('story-reader');
}

function markStoryChapterRead() {
  const chapter = data.story.chapters[activeStoryChapterIndex];
  if (!chapter) return;
  ArkK2Progress.recordStoryRead(progress, chapter.id, todayInHongKong());
  progress.lastPracticeDate = todayInHongKong();
  writeProgress();
  updateStoryReadCount();
}

function renderStoryText(chapter) {
  const source = text(chapter.text);
  const item = copybookItemFor(chapter.charId);
  const target = item ? item.char : '';
  ui.storyChapterText.replaceChildren();
  if (!target) {
    ui.storyChapterText.textContent = source;
    return;
  }
  let cursor = 0;
  let position = source.indexOf(target);
  while (position >= 0) {
    ui.storyChapterText.append(document.createTextNode(source.slice(cursor, position)));
    const button = createText('button', 'ark-story-char-highlight', target);
    button.type = 'button';
    button.setAttribute('aria-label', storyLabel('tapTarget', { char: target }));
    button.addEventListener('click', () => playClip(item.voiceKey));
    ui.storyChapterText.append(button);
    cursor = position + target.length;
    position = source.indexOf(target, cursor);
  }
  ui.storyChapterText.append(document.createTextNode(source.slice(cursor)));
}

function renderStoryChapter(index) {
  const chapter = data.story.chapters[index];
  if (!chapter) return;
  activeStoryChapterIndex = index;
  ui.storyChapterDate.textContent = storyLabel('chapter', { number: index + 1 }) + ' · ' + formatDate(chapter.date);
  ui.storyChapterTitle.textContent = text(data.story.title);
  ui.storyChapterImage.src = chapter.image;
  ui.storyChapterImage.alt = text(chapter.imageAlt);
  renderStoryText(chapter);
  ui.storyPrev.disabled = index === 0;
  ui.storyNext.disabled = index >= data.story.chapters.length - 1 || !storyChapterUnlocked(data.story.chapters[index + 1]);
  ui.storyCopybookLink.href = 'copybook.html?char=' + encodeURIComponent(chapter.charId);
  ui.storyReadButton.onclick = () => playClip(chapter.audio);
  ui.storyPrev.onclick = () => openStoryChapter(index - 1);
  ui.storyNext.onclick = () => {
    markStoryChapterRead();
    openStoryChapter(index + 1);
  };
  ui.storyCopybookLink.onclick = markStoryChapterRead;
  updateStoryReadCount();
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function questionItemKey(question) {
  if (question.kind === 'animal') return 'animal:' + question.id;
  if (question.kind === 'character') return 'character:' + question.id;
  if (question.kind === 'count') return 'counting:' + question.number;
  return 'arithmetic:' + question.operation;
}

function questionDescriptor(question) {
  if (question.kind === 'animal') {
    const animal = getAnimal(question.id);
    return { key: questionItemKey(question), kind: 'animals', id: question.id, label: text(animal.label) };
  }
  if (question.kind === 'character') {
    const character = getCharacter(question.id);
    return { key: questionItemKey(question), kind: 'characters', id: question.id, label: text(character.label) };
  }
  if (question.kind === 'count') {
    const number = question.number;
    const word = locale() === 'zhCN' ? data.numberWords.zhCN[number] : data.numberWords.zhHK[number];
    return { key: questionItemKey(question), kind: 'counting', id: String(number), label: (locale() === 'zhCN' ? '数到 ' : '數到 ') + word };
  }
  return {
    key: questionItemKey(question),
    kind: 'arithmetic',
    id: question.operation,
    label: question.operation === 'add' ? (locale() === 'zhCN' ? '加法' : '加法') : (locale() === 'zhCN' ? '减法' : '減法'),
  };
}

function makeStageQuestions(level) {
  const today = todayInHongKong();
  let questions = [];
  if (level.id === 'animal-listening') {
    const pool = level.questionIds.map(id => ({ kind: 'animal', id }));
    questions = ArkK2Progress.selectQuestions(pool, questionItemKey, progress, today, level.questionCount, Math.random, false);
  } else if (level.id === 'stroke-writing') {
    const uniqueIds = [...new Set(level.questionIds)];
    const pool = uniqueIds.map(id => ({ kind: 'character', id }));
    questions = ArkK2Progress.selectQuestions(pool, questionItemKey, progress, today, data.settings.questionsPerLevel, Math.random, true);
  } else if (level.id === 'sheep-counting') {
    const pool = Array.from({ length: level.maximum - level.minimum + 1 }, (_, index) => ({
      kind: 'count',
      number: level.minimum + index,
    }));
    questions = ArkK2Progress.selectQuestions(pool, questionItemKey, progress, today, level.questionCount, Math.random, false);
  } else if (level.id === 'animal-math') {
    const rotation = levelRecord(level.id).playCount * data.arithmetic.questionsPerRound;
    questions = ArkK2Math.generateRound(data.arithmetic, data.animals, Math.random, rotation)
      .map(question => ({ kind: 'math', ...question }));
  }
  return questions;
}

function companionAnimalsForLevel(level, questions) {
  if (level.id === 'animal-listening') return questions.map(question => question.id);
  if (level.id === 'animal-math') return questions.map(question => question.animalId);
  const played = Object.values(progress.levels).reduce((sum, record) => sum + (Number(record.playCount) || 0), 0);
  const start = played % data.animals.length;
  return questions.map((question, index) => data.animals[(start + index) % data.animals.length].id);
}

function isLevelUnlocked(index) {
  return index === 0 || levelRecord(data.levels[index - 1].id).stars >= data.settings.unlockMinimumStars;
}

function startLevel(id) {
  const levelIndex = data.levels.findIndex(level => level.id === id);
  if (levelIndex < 0 || !isLevelUnlocked(levelIndex)) return;
  const level = data.levels[levelIndex];
  const baseQuestions = makeStageQuestions(level);
  const roundSize = data.settings.questionsPerLevel || data.settings.questionsPerRound || 8;
  if (baseQuestions.length !== roundSize) {
    console.error('Ark round question count does not match the configured round size.');
    return;
  }
  const companions = companionAnimalsForLevel(level, baseQuestions);
  baseQuestions.forEach((question, index) => {
    question.baseIndex = index;
    question.companionAnimalId = companions[index];
    question.isReview = false;
  });
  stageRun = {
    level,
    levelIndex,
    baseQuestions,
    baseQuestionIndex: 0,
    currentQuestion: baseQuestions[0],
    pendingReviews: [],
    scheduledReviewKeys: new Set(),
    hintedItemKeys: new Set(),
    levelVoicePlayed: false,
    correctFirstTry: 0,
    boarded: [],
    roundAnimals: companions,
    planks: 0,
    completedQuestion: false,
    questionHadMistake: false,
    mistakeRecorded: false,
    questionState: { wrongChoiceIds: [], done: false, message: '', countChecked: false },
    strokeIndex: 0,
    strokeSamples: [],
    strokeReady: false,
    sheepOnBoard: [],
    countFirstAttempt: true,
    mathFirstAttempt: true,
  };
  const record = levelRecord(level.id);
  record.lastPractice = todayInHongKong();
  progress.levels[level.id] = record;
  progress.lastPracticeDate = record.lastPractice;
  writeProgress();
  ui.levelKicker.textContent = '第 ' + (levelIndex + 1) + ' 級 · ' + text(data.world);
  ui.levelTitle.textContent = text(level.title);
  ui.levelInstruction.textContent = text(level.instruction);
  ui.questionProgress.style.width = '0%';
  setScreen('game');
  renderQuestion();
}

function resetQuestionFlags() {
  stageRun.completedQuestion = false;
  stageRun.questionHadMistake = false;
  stageRun.mistakeRecorded = false;
  stageRun.strokeIndex = 0;
  stageRun.strokeSamples = [];
  stageRun.strokeReady = false;
  stageRun.sheepOnBoard = [];
  stageRun.countFirstAttempt = true;
  stageRun.mathFirstAttempt = true;
  stageRun.questionState = { wrongChoiceIds: [], done: false, message: '', countChecked: false };
}

function renderQuestion() {
  if (!stageRun) return;
  clearPlayPanels();
  updateLanguageButtons();
  ui.gameVoiceStatus.hidden = true;
  ui.gameVoiceStatus.textContent = '';
  const question = stageRun.currentQuestion;
  if (!question) return finishLevel();
  ui.levelDemo.hidden = stageRun.level.id !== 'animal-listening' || stageRun.demoUsed;
  if (!question.isReview) {
    const descriptor = questionDescriptor(question);
    ArkK2Progress.recordSeen(progress, descriptor, todayInHongKong());
    writeProgress();
  }
  ui.questionCounter.textContent = question.isReview
    ? interpolate(data.staticText.reviewCounter, { original: (question.originalBaseIndex || 0) + 1 })
    : interpolate(data.interface.questionCounter, { current: stageRun.baseQuestionIndex + 1, total: stageRun.baseQuestions.length });
  ui.questionProgress.style.width = ((stageRun.baseQuestionIndex / stageRun.baseQuestions.length) * 100) + '%';
  if (question.kind === 'animal') renderAnimalQuestion(question);
  if (question.kind === 'character') renderStrokeQuestion(question);
  if (question.kind === 'count') renderCountQuestion(question);
  if (question.kind === 'math') renderMathQuestion(question);
}

function createAudioButton(label, action, className) {
  const button = document.createElement('button');
  button.className = 'ark-audio-button' + (className ? ' ' + className : '');
  button.type = 'button';
  button.append(createAudioIcon(), createText('span', '', label));
  button.addEventListener('click', action);
  return button;
}

function addReplayButton(accessibleText, action) {
  return createAudioButton(accessibleText, action);
}

function animalVisual(animal, className, altText) {
  if (animal.image) {
    const image = document.createElement('img');
    image.className = className || '';
    image.src = animal.image;
    image.alt = altText || text(animal.label);
    image.draggable = false;
    return image;
  }
  const emoji = createText('span', (className ? className + ' ' : '') + 'ark-animal-emoji', animal.emoji);
  emoji.setAttribute('role', 'img');
  emoji.setAttribute('aria-label', altText || text(animal.label));
  return emoji;
}

function renderBoatDeck(container) {
  container.replaceChildren();
  const boat = createText('span', 'ark-boat-mark', '⛵');
  boat.setAttribute('aria-hidden', 'true');
  container.append(boat);
  stageRun.boarded.forEach(id => {
    const animal = getAnimal(id);
    if (animal) container.append(animalVisual(animal, animal.image ? 'ark-boarded-animal' : 'ark-boarded-emoji'));
  });
}

function renderAnimalQuestion(question) {
  const animal = getAnimal(question.id);
  const layout = createText('div', 'ark-animal-layout');
  const promptCard = createText('div', 'ark-animal-prompt-card');
  const promptVisual = animalVisual(animal, animal.image ? 'ark-animal-prompt-image' : 'ark-animal-prompt-emoji');
  const replay = addReplayButton(t('listenAgain'), () => {
    stageRun.questionState.message = '';
    showFeedback('');
    playClip(animal.voiceKey);
  });
  promptCard.append(promptVisual, replay);

  const answerSide = createText('div', 'ark-animal-answer-side');
  const deck = createText('div', 'ark-boat-deck');
  deck.setAttribute('aria-label', locale() === 'zhCN' ? '方舟上的动物' : '方舟上的動物');
  renderBoatDeck(deck);
  const prompt = createText('p', 'ark-answer-hint', t('animalOptions'));
  const answers = createText('div', 'ark-answer-grid');
  answers.setAttribute('role', 'group');
  answers.setAttribute('aria-label', t('animalOptions'));

  const animals = data.animals.map(item => item.id);
  const index = animals.indexOf(animal.id);
  const wrongIds = [animals[(index + 2) % animals.length], animals[(index + 5) % animals.length]];
  const choices = shuffle([animal.id, ...wrongIds].map(getAnimal));
  choices.forEach(choice => {
    const card = createText('button', 'ark-answer-card');
    card.type = 'button';
    card.dataset.answerId = choice.id;
    card.append(createText('span', 'ark-answer-word', text(choice.label)));
    const previouslyWrong = stageRun.questionState.wrongChoiceIds.includes(choice.id);
    const correctPrompt = choice.id === animal.id &&
      !stageRun.questionState.done && stageRun.questionState.wrongChoiceIds.length >= 2;
    if (previouslyWrong) {
      card.classList.add('is-wrong');
      card.disabled = true;
      card.prepend(animalVisual(choice, choice.image ? 'ark-answer-reveal' : 'ark-animal-emoji', text(choice.label)));
    }
    if (correctPrompt) card.classList.add('is-prompt');
    if (stageRun.questionState.done) {
      card.disabled = true;
      if (choice.id === animal.id) card.classList.add('is-correct');
    }
    card.addEventListener('click', () => {
      if (stageRun.completedQuestion || card.disabled) return;
      if (stageRun.demonstrationClick) {
        stageRun.hintedItemKeys.add(questionItemKey(question));
        card.classList.add('is-demo-correct');
        card.setAttribute('aria-label', text(animal.label) + (locale() === 'zhCN' ? '，示范点击' : '，示範撳呢張'));
        const deck = card.closest('.ark-animal-layout').querySelector('.ark-boat-deck');
        const demoAnimal = animalVisual(animal, animal.image ? 'ark-boarded-animal ark-demo-boarded' : 'ark-boarded-emoji ark-demo-boarded');
        deck.append(demoAnimal);
        const callPromise = playAnimalSound(animal);
        ui.gameVoiceStatus.hidden = false;
        ui.gameVoiceStatus.textContent = locale() === 'zhCN'
          ? '示范：听到「' + text(animal.label) + '」，就点击这张字卡。动物上船了！'
          : '示範：聽到「' + text(animal.label) + '」，就撳呢張字卡。動物上船喇！';
        callPromise.finally(() => window.setTimeout(() => {
          card.classList.remove('is-demo-correct');
          card.removeAttribute('aria-label');
          demoAnimal.remove();
          if (ui.gameVoiceStatus.textContent.startsWith('示範：') || ui.gameVoiceStatus.textContent.startsWith('示范：')) {
            ui.gameVoiceStatus.textContent = '';
            ui.gameVoiceStatus.hidden = true;
          }
        }, 1800));
        return;
      }
      if (choice.id === animal.id) {
        const message = stageRun.questionHadMistake
          ? interpolate(data.interface.correctAfterRetry, { animal: text(animal.label) })
          : interpolate(data.interface.correctFirstListen, { animal: text(animal.label) });
        completeCurrentQuestion(message, animal, true);
        card.classList.add('is-correct');
        card.disabled = true;
        playAnimalSound(animal).then(played => {
          if (played) return playClip('praise');
          return false;
        }).then(() => window.setTimeout(advanceQuestion, 280));
        return;
      }
      stageRun.questionHadMistake = true;
      if (!stageRun.mistakeRecorded) {
        recordQuestionMistake(question);
        stageRun.mistakeRecorded = true;
      }
      stageRun.questionState.wrongChoiceIds.push(choice.id);
      stageRun.questionState.message = interpolate(data.interface.wrong, { word: text(choice.label) });
      card.classList.add('is-wrong');
      card.disabled = true;
      card.prepend(animalVisual(choice, choice.image ? 'ark-answer-reveal' : 'ark-animal-emoji', text(choice.label)));
      if (stageRun.questionState.wrongChoiceIds.length >= 2) {
        const answerCard = answers.querySelector('[data-answer-id="' + animal.id + '"]');
        if (answerCard) answerCard.classList.add('is-prompt');
      }
      showHintFeedback(stageRun.questionState.message);
    });
    answers.append(card);
  });

  answerSide.append(deck, prompt, answers);
  layout.append(promptCard, answerSide);
  ui.playScene.append(layout);
  if (stageRun.questionState.done) showFeedback(stageRun.questionState.message);
  else if (stageRun.questionState.message) showFeedback(stageRun.questionState.message, true);

  const replayInCard = promptCard.querySelector('.ark-audio-button');
  replayInCard.setAttribute('aria-label', t('listenAgain'));
  playQuestionVoice(animal.voiceKey);
}

function completeCurrentQuestion(message, boardedAnimal, withAnimalSound) {
  const question = stageRun.currentQuestion;
  stageRun.completedQuestion = true;
  stageRun.questionState.done = true;
  stageRun.questionState.message = message;
  if (!question.isReview) {
    if (!stageRun.questionHadMistake) stageRun.correctFirstTry += 1;
    if (!stageRun.questionHadMistake && !stageRun.hintedItemKeys.has(questionItemKey(question))) {
      ArkK2Progress.recordOutcome(progress, questionDescriptor(question), { selfCorrect: true }, todayInHongKong());
    }
    const animal = boardedAnimal || getAnimal(question.companionAnimalId);
    if (animal && !stageRun.boarded.includes(animal.id)) stageRun.boarded.push(animal.id);
  }
  writeProgress();
  showFeedback(message);
}

function renderQuestionCardDeck() {
  const deck = ui.playScene.querySelector('.ark-boat-deck');
  if (deck) renderBoatDeck(deck);
}

function recordQuestionMistake(question) {
  const descriptor = questionDescriptor(question);
  const old = progress.mistakes[descriptor.key] || {
    kind: descriptor.kind,
    id: descriptor.id,
    label: descriptor.label,
    count: 0,
  };
  old.count += 1;
  old.label = descriptor.label;
  progress.mistakes[descriptor.key] = old;
  stageRun.hintedItemKeys.add(descriptor.key);
  ArkK2Progress.recordOutcome(progress, descriptor, { mistake: true }, todayInHongKong());
  writeProgress();
}

function pointOnCanvas(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return [
    Math.max(0, Math.min(1000, (event.clientX - rect.left) / rect.width * 1000)),
    Math.max(0, Math.min(1000, (event.clientY - rect.top) / rect.height * 1000)),
  ];
}

function drawPath(context, points, color, width, dashed, ratio) {
  if (!points || !points.length) return;
  const canvas = context.canvas;
  const scaled = points.map(point => [point[0] / 1000 * canvas.width, point[1] / 1000 * canvas.height]);
  let total = 0;
  const lengths = [];
  for (let index = 1; index < scaled.length; index += 1) {
    const length = Math.hypot(scaled[index][0] - scaled[index - 1][0], scaled[index][1] - scaled[index - 1][1]);
    lengths.push(length);
    total += length;
  }
  let remaining = total * Math.max(0, Math.min(1, ratio == null ? 1 : ratio));
  context.beginPath();
  context.moveTo(scaled[0][0], scaled[0][1]);
  for (let index = 0; index < lengths.length && remaining > 0; index += 1) {
    const length = lengths[index];
    const portion = Math.min(1, remaining / length);
    const from = scaled[index];
    const to = scaled[index + 1];
    context.lineTo(from[0] + (to[0] - from[0]) * portion, from[1] + (to[1] - from[1]) * portion);
    remaining -= length;
  }
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.setLineDash(dashed ? [12, 12] : []);
  context.stroke();
  context.setLineDash([]);
}

function drawArrow(context, pointA, pointB) {
  const canvas = context.canvas;
  const x1 = pointA[0] / 1000 * canvas.width;
  const y1 = pointA[1] / 1000 * canvas.height;
  const x2 = pointB[0] / 1000 * canvas.width;
  const y2 = pointB[1] / 1000 * canvas.height;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  context.save();
  context.translate(x2, y2);
  context.rotate(angle);
  context.fillStyle = '#0B5E58';
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(-18, -12);
  context.lineTo(-16, 0);
  context.lineTo(-18, 12);
  context.closePath();
  context.fill();
  context.restore();
}

function drawStrokeCanvas(character, canvas, activeIndex, activeSamples, scaffold) {
  const context = canvas.getContext('2d');
  const mode = scaffold || 1;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.strokeStyle = '#E8E2D8';
  context.lineWidth = 2;
  context.setLineDash([8, 8]);
  context.beginPath();
  context.moveTo(canvas.width / 2, 0);
  context.lineTo(canvas.width / 2, canvas.height);
  context.moveTo(0, canvas.height / 2);
  context.lineTo(canvas.width, canvas.height / 2);
  context.stroke();
  context.restore();
  if (mode >= 3) {
    context.fillStyle = '#D5D0C9';
    context.font = '260px "Noto Sans TC", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(character.char, canvas.width / 2, canvas.height / 2);
    return;
  }

  context.fillStyle = 'rgba(184, 175, 162, 0.14)';
  context.font = '260px "Noto Sans TC", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(character.char, canvas.width / 2, canvas.height / 2);

  character.strokes.forEach(stroke => drawPath(context, stroke.points, '#E5E0D9', 34, false));
  character.strokes.slice(0, activeIndex).forEach(stroke => drawPath(context, stroke.points, '#0B5E58', 30, false));

  if (activeSamples && activeSamples.length > 1) {
    const first = activeSamples[0];
    context.beginPath();
    context.moveTo(first[0] / 1000 * canvas.width, first[1] / 1000 * canvas.height);
    activeSamples.slice(1).forEach(point => context.lineTo(point[0] / 1000 * canvas.width, point[1] / 1000 * canvas.height));
    context.strokeStyle = '#4ECDC4';
    context.lineWidth = 25;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
  }

  const active = character.strokes[activeIndex];
  if (!active) return;
  const start = active.points[0];
  const next = active.points[1] || start;
  const sx = start[0] / 1000 * canvas.width;
  const sy = start[1] / 1000 * canvas.height;
  if (mode === 1) drawPath(context, active.points, '#0B5E58', 17, true);
  context.beginPath();
  context.arc(sx, sy, 14, 0, Math.PI * 2);
  context.fillStyle = '#4ECDC4';
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = '#FFFFFF';
  context.stroke();
  if (mode === 1) {
    context.fillStyle = '#0B5E58';
    context.font = 'bold 19px "Nunito", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(activeIndex + 1), sx, sy);
    drawArrow(context, start, next);
  }
}

function animateCharacter(character, canvas, scaffold) {
  const run = stageRun;
  const token = (run.strokeAnimationToken || 0) + 1;
  run.strokeAnimationToken = token;
  run.strokeReady = false;
  const startTime = performance.now();
  const stepDuration = 150;
  function frame(now) {
    if (stageRun !== run || run.strokeAnimationToken !== token) return;
    const elapsed = Math.max(0, now - startTime);
    const total = character.strokes.length * stepDuration;
    const complete = Math.min(character.strokes.length, Math.floor(elapsed / stepDuration));
    const within = Math.min(1, (elapsed % stepDuration) / stepDuration);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(184, 175, 162, 0.12)';
    context.font = '260px "Noto Sans TC", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(character.char, canvas.width / 2, canvas.height / 2);
    character.strokes.forEach(stroke => drawPath(context, stroke.points, '#E5E0D9', 34, false));
    character.strokes.slice(0, complete).forEach(stroke => drawPath(context, stroke.points, '#4ECDC4', 34, false));
    if (complete < character.strokes.length) {
      drawPath(context, character.strokes[complete].points, '#4ECDC4', 34, false, within);
      window.requestAnimationFrame(frame);
    } else {
      drawStrokeCanvas(character, canvas, run.strokeIndex, null, scaffold);
      run.strokeReady = true;
    }
  }
  window.requestAnimationFrame(frame);
}

function scaffoldForCharacter(character) {
  const count = Number(progress.characterPracticeCount[character.id]) || 1;
  return count <= 1 ? 1 : count === 2 ? 2 : 3;
}

function strokeHint(stroke) {
  const name = stroke.name;
  const cantonese = {
    '撇': '由綠點落筆，跟住箭咀向左下拉。',
    '捺': '由綠點落筆，跟住箭咀向右下拉。',
    '橫': '由綠點落筆，向右橫拉。',
    '豎': '由綠點落筆，向下拉。',
    '點': '由綠點落筆，短短向下點。',
    '提': '由綠點落筆，向右上提。',
    '橫折': '先向右橫拉，再轉向下寫。',
    '橫折彎鉤': '先向右寫，再轉彎向下，最後彎出鈎。',
    '豎彎鈎': '先向下寫，再轉彎向右，最後彎出鈎。',
    '豎鈎': '向下寫，到底再轉彎鈎出。',
    '橫鈎': '先向右橫拉，再轉向下鈎。',
    '橫撇': '先向右橫拉，再轉向左下撇。',
    '彎鈎': '由綠點落筆，先向下彎，再轉向右鈎出。',
  };
  const mandarin = {
    '撇': '从绿点落笔，跟着箭头向左下拉。',
    '捺': '从绿点落笔，跟着箭头向右下拉。',
    '橫': '从绿点落笔，向右横拉。',
    '豎': '从绿点落笔，向下拉。',
    '點': '从绿点落笔，短短向下点。',
    '提': '从绿点落笔，向右上提。',
    '橫折': '先向右横拉，再转向下写。',
    '橫折彎鉤': '先向右写，再转弯向下，最后弯出钩。',
    '豎彎鈎': '先向下写，再转弯向右，最后弯出钩。',
    '豎鈎': '向下写到底，再转弯钩出。',
    '橫鈎': '先向右横拉，再转向下钩。',
    '橫撇': '先向右横拉，再转向左下撇。',
    '彎鈎': '从绿点落笔，先向下弯，再转向右钩出。',
  };
  const words = locale() === 'zhCN' ? mandarin : cantonese;
  return words[name] || (locale() === 'zhCN' ? '从绿点起笔，沿箭头方向慢慢写。' : '由綠點起筆，沿箭嘴方向慢慢寫。');
}

function renderStrokeQuestion(question) {
  const character = getCharacter(question.id);
  if (!question.scaffoldCounted) {
    progress.characterPracticeCount[character.id] = (Number(progress.characterPracticeCount[character.id]) || 0) + 1;
    question.scaffoldCounted = true;
    writeProgress();
  }
  const scaffold = scaffoldForCharacter(character);
  if (scaffold < 3) stageRun.hintedItemKeys.add(questionItemKey(question));
  const characterList = createText('div', 'ark-character-list');
  data.characters.forEach(item => {
    const chip = createText('span', 'ark-character-chip' + (item.id === character.id ? ' is-active' : ''), text(item.label));
    characterList.append(chip);
  });

  const layout = createText('div', 'ark-stroke-layout');
  const left = createText('div', 'ark-writing-wrap');
  const canvas = document.createElement('canvas');
  canvas.className = 'ark-writing-canvas';
  canvas.width = 420;
  canvas.height = 420;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', text(character.label) + '，' + character.strokeCount + (locale() === 'zhCN' ? '画' : '畫'));
  currentCanvas = canvas;

  const controls = createText('div', 'ark-demo-audio-row');
  const demo = createAudioButton(locale() === 'zhCN' ? '看示范' : '睇示範', () => {
    stageRun.hintedItemKeys.add(questionItemKey(question));
    animateCharacter(character, canvas, scaffold);
  });
  demo.classList.add('ark-demo-button');
  const replay = addReplayButton(t('listenAgain'), () => playClip(character.voiceKey));
  controls.append(demo, replay);
  left.append(canvas, controls);

  const side = createText('div', 'ark-stroke-side');
  side.append(createText('span', 'ark-target-char', text(character.label)));
  const currentBadge = createText('div', 'ark-current-stroke');
  const plankHeading = createText('p', 'ark-plank-heading', locale() === 'zhCN' ? '每写对一笔，加一块船板' : '每寫啱一筆，加一塊船板');
  const plankBoard = createText('div', 'ark-plank-board');
  const hintCard = createText('div', 'ark-stroke-hint-card');
  const horse = document.createElement('img');
  horse.src = 'img/noah/animals/horse.jpg';
  horse.alt = locale() === 'zhCN' ? '小马插图' : '小馬插圖';
  const hint = createText('p', 'ark-stroke-hint');
  hintCard.append(horse, hint);
  side.append(currentBadge, plankHeading, plankBoard, hintCard);
  layout.append(left, side);
  ui.playScene.append(characterList, layout);

  const updateStrokeDisplay = () => {
    const stroke = character.strokes[stageRun.strokeIndex];
    currentBadge.textContent = stroke
      ? (locale() === 'zhCN' ? '第 ' : '第 ') + (stageRun.strokeIndex + 1) + (locale() === 'zhCN' ? ' 画：' : ' 筆：') + stroke.name
      : (locale() === 'zhCN' ? '写好了！' : '寫好喇！');
    hint.textContent = stroke ? strokeHint(stroke) : '';
    plankBoard.replaceChildren();
    character.strokes.forEach((item, index) => {
      const slot = createText('span', 'ark-plank-slot', item.name);
      if (index < stageRun.strokeIndex) slot.classList.add('is-done');
      else if (index === stageRun.strokeIndex) slot.classList.add('is-current');
      plankBoard.append(slot);
    });
    drawStrokeCanvas(character, canvas, stageRun.strokeIndex, stageRun.strokeSamples, scaffold);
  };

  updateStrokeDisplay();
  playQuestionVoice(character.voiceKey);
  if (scaffold < 3) animateCharacter(character, canvas, scaffold);
  else {
    drawStrokeCanvas(character, canvas, stageRun.strokeIndex, null, scaffold);
    stageRun.strokeReady = true;
  }

  canvas.addEventListener('pointerdown', event => {
    if (!stageRun.strokeReady || stageRun.completedQuestion || stageRun.strokeIndex >= character.strokes.length) return;
    event.preventDefault();
    try { canvas.setPointerCapture(event.pointerId); } catch (error) {}
    drawingPointer = event.pointerId;
    stageRun.strokeSamples = [pointOnCanvas(event, canvas)];
  });
  canvas.addEventListener('pointermove', event => {
    if (drawingPointer !== event.pointerId) return;
    event.preventDefault();
    stageRun.strokeSamples.push(pointOnCanvas(event, canvas));
    drawStrokeCanvas(character, canvas, stageRun.strokeIndex, stageRun.strokeSamples, scaffold);
  });
  canvas.addEventListener('pointerup', event => {
    if (drawingPointer !== event.pointerId) return;
    event.preventDefault();
    stageRun.strokeSamples.push(pointOnCanvas(event, canvas));
    drawingPointer = null;
    const stroke = character.strokes[stageRun.strokeIndex];
    const correct = ArkK2Strokes.followsStroke(stageRun.strokeSamples, stroke.points);
    stageRun.strokeSamples = [];
    if (correct) {
      stageRun.strokeIndex += 1;
      stageRun.planks += 1;
      if (stageRun.strokeIndex >= character.strokes.length) {
        completeCurrentQuestion(t('correct'));
        praiseThenAdvance();
      } else {
        showFeedback(t('correct'));
        updateStrokeDisplay();
      }
    } else {
      stageRun.questionHadMistake = true;
      if (!stageRun.mistakeRecorded) {
        recordQuestionMistake(question);
        stageRun.mistakeRecorded = true;
      }
      showHintFeedback(t('strokeWrong'));
      updateStrokeDisplay();
    }
  });
  canvas.addEventListener('pointercancel', () => {
    drawingPointer = null;
    stageRun.strokeSamples = [];
    updateStrokeDisplay();
  });
}

function renderCountQuestion(question) {
  const sheep = getAnimal(data.counting.animalId);
  const numberWord = locale() === 'zhCN' ? data.numberWords.zhCN[question.number] : data.numberWords.zhHK[question.number];
  const prompt = createText('p', 'ark-count-prompt', interpolate(data.interface.countPrompt, { number: numberWord }));
  const replay = createAudioButton(t('listenAgain'), () => playCountVoice(question));
  const layout = createText('div', 'ark-count-layout');
  const pasture = createText('section', 'ark-count-panel');
  pasture.id = 'pastureZone';
  pasture.dataset.dropZone = 'pasture';
  pasture.setAttribute('aria-label', staticText('countField'));
  const pastureTitle = createText('p', 'ark-zone-title', staticText('countField'));
  const pastureCount = createText('span', 'ark-zone-count', String(10 - stageRun.sheepOnBoard.length));
  pastureTitle.append(pastureCount);
  const field = createText('div', 'ark-sheep-grid');
  const boat = createText('section', 'ark-count-panel is-boat');
  boat.id = 'boatZone';
  boat.dataset.dropZone = 'boat';
  boat.setAttribute('aria-label', interpolate(data.staticText.countBoat, { count: stageRun.sheepOnBoard.length }));
  const boatTitle = createText('p', 'ark-zone-title', interpolate(data.staticText.countBoat, { count: stageRun.sheepOnBoard.length }));
  const frame = createText('div', 'ark-ten-frame');
  pasture.append(pastureTitle, field);
  boat.append(boatTitle, frame);
  layout.append(pasture, boat);
  ui.playScene.append(prompt, replay, layout);
  renderSheepZones(sheep);
  ui.playActions.append(createActionButton(staticText('countCheck'), 'btn-primary', () => checkCount(question)));
  ui.playActions.append(createActionButton(staticText('countReset'), 'btn-secondary', () => resetCount(sheep)));
  playQuestionVoice(['count_lead_in', 'number_' + question.number, 'count_tail']);
}

function playCountVoice(question) {
  return playClipSequence(['count_lead_in', 'number_' + question.number, 'count_tail']);
}

function renderSheepZones(sheep) {
  const pastureGrid = document.querySelector('#pastureZone .ark-sheep-grid');
  const frame = document.querySelector('#boatZone .ark-ten-frame');
  const pastureCount = document.querySelector('#pastureZone .ark-zone-count');
  const boatTitle = document.querySelector('#boatZone .ark-zone-title');
  if (!pastureGrid || !frame || !pastureCount || !boatTitle) return;
  pastureGrid.replaceChildren();
  frame.replaceChildren();
  for (let id = 1; id <= 10; id += 1) {
    const button = document.createElement('button');
    button.className = 'ark-sheep-token';
    button.type = 'button';
    button.dataset.sheepId = String(id);
    button.setAttribute('aria-label', text(sheep.label) + ' ' + id + (locale() === 'zhCN' ? '，点一下上船' : '，撳一下上船'));
    button.append(animalVisual(sheep, '', ''));
    const onBoat = stageRun.sheepOnBoard.includes(id);
    button.disabled = onBoat || stageRun.completedQuestion;
    if (onBoat) button.classList.add('is-on-boat');
    button.addEventListener('pointerdown', event => {
      lastDraggedSheep = { id, startX: event.clientX, startY: event.clientY, from: 'pasture' };
    });
    button.addEventListener('click', () => {
      if (suppressSheepClick || button.disabled) {
        suppressSheepClick = false;
        return;
      }
      moveSheep(id, 'boat');
    });
    pastureGrid.append(button);
  }

  for (let index = 0; index < 10; index += 1) {
    const sheepId = stageRun.sheepOnBoard[index];
    const slot = document.createElement('button');
    slot.className = 'ark-sheep-slot';
    slot.type = 'button';
    slot.setAttribute('aria-label', sheepId
      ? interpolate(data.staticText.countSlotLabel, { number: index + 1 }) + (locale() === 'zhCN' ? '，点一下送羊回草地' : '，撳一下送羊返草地')
      : interpolate(data.staticText.countSlotLabel, { number: index + 1 }));
    if (sheepId) {
      if (stageRun.questionState.countChecked && stageRun.sheepOnBoard.length > questionTarget(stageRun.currentQuestion) && index >= questionTarget(stageRun.currentQuestion)) {
        slot.classList.add('is-overflow');
      }
      slot.append(animalVisual(sheep, '', ''));
      slot.dataset.sheepId = String(sheepId);
      slot.disabled = stageRun.completedQuestion;
      slot.addEventListener('pointerdown', event => {
        lastDraggedSheep = { id: sheepId, startX: event.clientX, startY: event.clientY, from: 'boat' };
      });
      slot.addEventListener('click', () => {
        if (suppressSheepClick || slot.disabled) {
          suppressSheepClick = false;
          return;
        }
        moveSheep(sheepId, 'pasture');
      });
    } else {
      slot.disabled = true;
    }
    frame.append(slot);
  }

  pastureCount.textContent = String(10 - stageRun.sheepOnBoard.length);
  boatTitle.textContent = interpolate(data.staticText.countBoat, { count: stageRun.sheepOnBoard.length });
  document.getElementById('boatZone').setAttribute('aria-label', boatTitle.textContent);
  document.getElementById('pastureZone').setAttribute('aria-label', staticText('countField'));
}

function questionTarget(question) {
  return question && question.number || 0;
}

function handleSheepPointerUp(event) {
  const drag = lastDraggedSheep;
  lastDraggedSheep = null;
  if (!drag || !stageRun || stageRun.completedQuestion) return;
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (distance < 14) return;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const zone = target && target.closest('[data-drop-zone]');
  if (!zone) return;
  if (zone.dataset.dropZone === 'boat') {
    suppressSheepClick = true;
    moveSheep(drag.id, 'boat');
  } else if (zone.dataset.dropZone === 'pasture') {
    suppressSheepClick = true;
    moveSheep(drag.id, 'pasture');
  }
  window.setTimeout(() => { suppressSheepClick = false; }, 0);
}

function moveSheep(id, destination) {
  if (!stageRun || stageRun.completedQuestion) return;
  const index = stageRun.sheepOnBoard.indexOf(id);
  if (destination === 'boat' && index < 0 && stageRun.sheepOnBoard.length < 10) stageRun.sheepOnBoard.push(id);
  if (destination === 'pasture' && index >= 0) stageRun.sheepOnBoard.splice(index, 1);
  stageRun.sheepOnBoard.sort((first, second) => first - second);
  renderSheepZones(getAnimal(data.counting.animalId));
  if (!stageRun.questionState.countChecked || stageRun.sheepOnBoard.length <= questionTarget(stageRun.currentQuestion)) {
    stageRun.questionState.countChecked = false;
    showFeedback('');
  }
}

function resetCount(sheep) {
  if (!stageRun || stageRun.completedQuestion) return;
  stageRun.sheepOnBoard = [];
  stageRun.questionState.countChecked = false;
  showFeedback('');
  renderSheepZones(sheep);
}

function checkCount(question) {
  if (stageRun.completedQuestion) return;
  const count = stageRun.sheepOnBoard.length;
  if (count === question.number) {
    stageRun.questionState.countChecked = true;
    completeCurrentQuestion(interpolate(data.staticText.countGood, { number: count }), null, false);
    praiseThenAdvance();
    return;
  }
  stageRun.questionHadMistake = true;
  stageRun.questionState.countChecked = true;
  if (!stageRun.mistakeRecorded) {
    recordQuestionMistake(question);
    stageRun.mistakeRecorded = true;
  }
  const difference = Math.abs(question.number - count);
  const message = count < question.number
    ? interpolate(data.staticText.countTooFew, { count: difference })
    : interpolate(data.staticText.countTooMany, { count: difference });
  showHintFeedback(message);
  renderSheepZones(getAnimal(data.counting.animalId));
}

function renderMathQuestion(item) {
  const prompt = createText('p', 'ark-count-prompt', t('mathPrompt'));
  const equation = createText('div', 'ark-math-scene');
  const groups = createText('div', 'ark-math-groups');
  const animal = getAnimal(item.animalId);
  const first = makeMathGroup(item.first, animal, staticText('mathFirstGroup'));
  const second = makeMathGroup(item.second, animal, item.operation === 'add' ? staticText('mathSecondAdd') : staticText('mathSecondSubtract'));
  const operator = createText('span', 'ark-math-operator', item.operation === 'add' ? '+' : '−');
  operator.setAttribute('aria-label', item.operation === 'add' ? (locale() === 'zhCN' ? '加' : '加') : (locale() === 'zhCN' ? '减' : '減'));
  const equationText = createText('p', 'ark-math-answer-prompt', staticText('mathAnswerPrompt'));
  groups.append(first, operator, second);
  const answers = createText('div', 'ark-math-answers');
  item.choices.forEach(answer => {
    const button = createText('button', 'ark-math-answer', String(answer));
    button.type = 'button';
    button.setAttribute('aria-label', String(answer));
    button.addEventListener('click', () => checkMathAnswer(answer, item));
    answers.append(button);
  });
  equation.append(groups, equationText, answers);
  ui.playScene.append(prompt, equation);
  playQuestionVoice([
    'number_' + item.first,
    item.operation === 'add' ? 'math_plus' : 'math_minus',
    'number_' + item.second,
    'math_question',
  ]);
}

function makeMathGroup(count, animal, label) {
  const group = createText('div', 'ark-math-group');
  group.append(createText('strong', '', label + ' · ' + count));
  const icons = createText('div', 'ark-math-animals');
  for (let index = 0; index < count; index += 1) {
    if (animal.image) {
      const image = document.createElement('img');
      image.src = animal.image;
      image.alt = '';
      image.draggable = false;
      icons.append(image);
    } else {
      const emoji = createText('span', 'ark-math-emoji', animal.emoji);
      emoji.setAttribute('aria-hidden', 'true');
      icons.append(emoji);
    }
  }
  group.append(icons);
  return group;
}

function checkMathAnswer(answer, question) {
  if (stageRun.completedQuestion) return;
  if (answer === question.answer) {
    completeCurrentQuestion(t('correct'));
    praiseThenAdvance();
    return;
  }
  stageRun.questionHadMistake = true;
  if (!stageRun.mistakeRecorded) {
    recordQuestionMistake(question);
    stageRun.mistakeRecorded = true;
  }
  showHintFeedback(t('mathWrong'));
}

function createActionButton(label, style, action) {
  const button = document.createElement('button');
  button.className = 'btn ' + style;
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', action);
  return button;
}

function queueReview(question) {
  if (stageRun.levelIndex >= 3 || question.isReview) return;
  const key = questionItemKey(question);
  if (stageRun.scheduledReviewKeys.has(key)) return;
  stageRun.scheduledReviewKeys.add(key);
  const delay = ArkK2Progress.reviewDelay(Math.random);
  const dueAfterBase = ArkK2Progress.reviewDueAfter(question.baseIndex, delay, stageRun.baseQuestions.length);
  stageRun.pendingReviews.push({
    question,
    dueAfterBase,
    originalBaseIndex: question.baseIndex,
  });
}

function nextQuestionOrFinish() {
  const readyIndex = stageRun.pendingReviews.findIndex(item => item.dueAfterBase <= stageRun.baseQuestionIndex);
  if (readyIndex >= 0) {
    const item = stageRun.pendingReviews.splice(readyIndex, 1)[0];
    stageRun.currentQuestion = {
      ...item.question,
      isReview: true,
      originalBaseIndex: item.originalBaseIndex,
    };
    return true;
  }
  if (stageRun.baseQuestionIndex < stageRun.baseQuestions.length) {
    stageRun.currentQuestion = stageRun.baseQuestions[stageRun.baseQuestionIndex];
    return true;
  }
  if (stageRun.pendingReviews.length) {
    const item = stageRun.pendingReviews.shift();
    stageRun.currentQuestion = {
      ...item.question,
      isReview: true,
      originalBaseIndex: item.originalBaseIndex,
    };
    return true;
  }
  finishLevel();
  return false;
}

function advanceQuestion() {
  if (!stageRun) return;
  const finished = stageRun.currentQuestion;
  if (!finished.isReview) {
    stageRun.baseQuestionIndex += 1;
    if (stageRun.questionHadMistake || stageRun.hintedItemKeys.has(questionItemKey(finished))) queueReview(finished);
  }
  resetQuestionFlags();
  if (nextQuestionOrFinish()) renderQuestion();
}

function starsFor(correctCount) {
  return data.settings.stars.reduce((stars, rule) => correctCount >= rule.minimumCorrect ? rule.stars : stars, 0);
}

function finishLevel() {
  if (!stageRun) return;
  const record = levelRecord(stageRun.level.id);
  const stars = starsFor(stageRun.correctFirstTry);
  record.stars = Math.max(record.stars, stars);
  record.bestCorrect = Math.max(record.bestCorrect, stageRun.correctFirstTry);
  record.playCount += 1;
  record.lastPractice = todayInHongKong();
  progress.levels[stageRun.level.id] = record;
  progress.lastPracticeDate = record.lastPractice;
  const totalPlays = Object.values(progress.levels).reduce((sum, item) => sum + (Number(item.playCount) || 0), 0) - 1;
  const stickerAnimal = data.animals[totalPlays % data.animals.length];
  stageRun.stickerId = stickerAnimal.id;
  stageRun.stickerIsNew = !progress.stickers.includes(stickerAnimal.id);
  if (stageRun.stickerIsNew) progress.stickers.push(stickerAnimal.id);
  writeProgress();
  ui.questionProgress.style.width = '100%';
  setScreen('result');
  renderStageResult(stars);
}

function renderStageResult(starsOverride) {
  if (!stageRun) return;
  const stars = Number.isInteger(starsOverride) ? starsOverride : levelRecord(stageRun.level.id).stars;
  const nextLevel = data.levels[stageRun.levelIndex + 1];
  ui.resultKicker.textContent = interpolate(data.staticText.levelTask, { number: stageRun.levelIndex + 1 });
  ui.resultTitle.textContent = staticText('allAnimalsBoarded');
  ui.resultScore.textContent = interpolate(data.interface.firstTryScore, {
    correct: stageRun.correctFirstTry,
    total: stageRun.baseQuestions.length,
  });
  ui.resultStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  ui.resultAnimalsHeading.textContent = staticText('resultAnimalsHeading');
  ui.processPraise.textContent = stageRun.correctFirstTry === stageRun.baseQuestions.length
    ? staticText('praiseAllFirstTry')
    : staticText('praiseAfterRetry');
  ui.newStickerLabel.textContent = staticText('stickerNew');
  ui.newStickerLabel.hidden = !stageRun.stickerIsNew;

  ui.resultAnimals.replaceChildren();
  stageRun.boarded.slice(0, 8).forEach(id => {
    const animal = getAnimal(id);
    const card = createText('div', 'ark-result-animal');
    card.append(animalVisual(animal, animal.image ? '' : 'ark-animal-emoji'));
    ui.resultAnimals.append(card);
  });
  ui.stickerBook.replaceChildren();
  data.animals.forEach(animal => {
    const slot = createText('div', 'ark-sticker-slot');
    const earned = progress.stickers.includes(animal.id);
    if (earned) {
      slot.append(animalVisual(animal, animal.image ? '' : 'ark-animal-emoji', text(animal.label)));
      if (animal.id === stageRun.stickerId && stageRun.stickerIsNew) slot.classList.add('is-new');
      slot.setAttribute('aria-label', text(animal.label));
    } else {
      slot.textContent = '?';
      slot.setAttribute('aria-label', locale() === 'zhCN' ? '尚未获得的贴纸' : '未得的貼紙');
    }
    ui.stickerBook.append(slot);
  });

  ui.resultActions.replaceChildren();
  ui.resultActions.append(createActionButton(staticText('restartWithNewQuestions'), 'btn-primary', () => startLevel(stageRun.level.id)));
  if (nextLevel && levelRecord(stageRun.level.id).stars >= data.settings.unlockMinimumStars) {
    const next = createActionButton(t('nextLevel'), 'btn-accent', () => startLevel(nextLevel.id));
    ui.resultActions.append(next);
  }
  const rest = document.createElement('a');
  rest.className = 'btn btn-secondary';
  rest.href = 'k2.html';
  rest.textContent = staticText('restAtK2');
  ui.resultActions.append(rest);
}

function formatStars(stars) {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}

function renderParentLevels() {
  ui.parentLevelScores.replaceChildren();
  data.levels.forEach((level, index) => {
    const record = levelRecord(level.id);
    const unlocked = isLevelUnlocked(index);
    const card = createText('div', 'ark-parent-level' + (unlocked ? '' : ' is-locked'));
    card.append(createText('strong', '', interpolate(data.staticText.levelNumber, { number: index + 1 }) + ' · ' + text(level.title)));
    const stars = createText('span', 'ark-parent-stars', formatStars(record.stars));
    stars.setAttribute('aria-label', interpolate(data.staticText.starLabel, { number: record.stars }));
    card.append(stars);
    if (!unlocked) {
      card.append(createText('span', 'ark-parent-status', staticText('notUnlockedYet')));
    } else if (record.playCount === 0) {
      card.append(createText('span', 'ark-parent-status', staticText('notPlayedYet')));
    } else {
      card.append(createText('span', 'ark-parent-plays', interpolate(data.staticText.playedTimes, { count: record.playCount })));
    }
    ui.parentLevelScores.append(card);
  });
}

function recentDates() {
  const today = todayInHongKong();
  return Array.from({ length: 7 }, (_, index) => dateOffset(today, index - 6));
}

function parentTipEntryFor(record) {
  const language = locale();
  const category = data.parentTips[record.kind] || {};
  if (category[record.id] && category[record.id][language]) {
    return { key: record.id, tip: category[record.id][language] };
  }
  return category.default && category.default[language]
    ? { key: 'default', tip: category.default[language] }
    : null;
}

function parentSuggestionName(record) {
  if (record.kind === 'animals') {
    const animal = getAnimal(record.id);
    return animal ? text(animal.label) : (record.label || '');
  }
  if (record.kind === 'characters') {
    const character = getCharacter(record.id);
    return character ? text(character.label) : (record.label || '');
  }
  if (record.kind === 'counting') {
    const number = data.numberWords[locale()][record.id];
    if (number) return (locale() === 'zhCN' ? '数到 ' : '數到 ') + number;
  }
  if (record.kind === 'arithmetic') {
    if (record.id === 'add') return '加法';
    if (record.id === 'subtract') return locale() === 'zhCN' ? '减法' : '減法';
  }
  return record.label || '';
}

function renderParentSuggestions() {
  const dates = recentDates();
  const minimumDate = dates[0];
  const candidates = Object.values(progress.learning).map(record => {
    const daily = record.daily || {};
    const recentMistakes = dates.reduce((sum, date) => sum + (Number((daily[date] || {}).mistakes) || 0), 0);
    const recentlySeen = Boolean(record.lastSeenDate && record.lastSeenDate >= minimumDate && record.lastSeenDate <= dates[6]);
    return { record, recentMistakes, recentlySeen, tipEntry: parentTipEntryFor(record) };
  }).filter(item => item.recentMistakes > 0 || (item.recentlySeen && !item.record.mastered))
    .filter(item => item.tipEntry)
    .sort((first, second) =>
      second.recentMistakes - first.recentMistakes ||
      Number(first.record.mastered) - Number(second.record.mastered) ||
      (first.record.lastSeenDate < second.record.lastSeenDate ? -1 : first.record.lastSeenDate > second.record.lastSeenDate ? 1 : 0),
    );

  const groupsByTip = new Map();
  candidates.forEach(item => {
    const key = item.record.kind + ':' + item.tipEntry.key;
    if (!groupsByTip.has(key)) groupsByTip.set(key, { tip: item.tipEntry.tip, items: [] });
    groupsByTip.get(key).items.push(item);
  });

  ui.parentSuggestions.replaceChildren();
  [...groupsByTip.values()].slice(0, 3).forEach(group => {
    const li = document.createElement('li');
    const names = [...new Set(group.items.map(item => parentSuggestionName(item.record)).filter(Boolean))].slice(0, 3);
    const skill = group.tip.skill + (names.length > 1 ? '：' + names.join('、') : '');
    li.append(createText('strong', '', skill));
    li.append(createText('span', '', group.tip.practice));
    ui.parentSuggestions.append(li);
  });
  ui.noMistakes.hidden = ui.parentSuggestions.children.length > 0;
  ui.noMistakes.textContent = t('noRecentPractice');
}

function renderPracticeChart() {
  const dates = recentDates();
  const dayNames = (data.interface.weekdays && data.interface.weekdays[locale()]) || ['一', '二', '三', '四', '五', '六', '日'];
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const values = dates.map(date => {
    const timestamp = new Date(date + 'T12:00:00+08:00').getTime();
    const weekdayIndex = new Date(timestamp).getUTCDay();
    const dayLabel = dayNames[weekdayIndex === 0 ? 6 : weekdayIndex - 1];
    const minutes = Math.round((Number(progress.practiceSecondsByDate[date]) || 0) / 60);
    return { date, dayLabel, minutes };
  });
  ui.practiceChart.replaceChildren();
  const maxMinutes = Math.max(10, ...values.map(item => item.minutes));
  values.forEach(item => {
    const day = createText('div', 'ark-practice-day');
    const wrap = createText('div', 'ark-practice-bar-wrap');
    const bar = createText('span', 'ark-practice-bar');
    const height = Math.max(8, Math.round(108 * item.minutes / maxMinutes));
    bar.style.height = height + 'px';
    bar.title = item.minutes + (locale() === 'zhCN' ? ' 分钟' : ' 分鐘');
    wrap.append(bar);
    day.append(wrap, createText('span', 'ark-practice-minutes', String(item.minutes)), createText('span', 'ark-practice-day-label', item.dayLabel));
    ui.practiceChart.append(day);
  });
  const chartLabel = values.map(item => item.date + ' ' + item.minutes + (locale() === 'zhCN' ? '分钟' : '分鐘')).join('；');
  ui.practiceChart.setAttribute('aria-label', chartLabel);
  ui.practiceTimeNote.textContent = staticText('practiceTimeNote');
}

function renderParentReport() {
  ui.parentIntro.textContent = t('parentIntro');
  ui.recentDateValue.textContent = formatDate(progress.lastPracticeDate);
  ui.reviewRule.textContent = staticText('reviewRule');
  ui.clearProgress.textContent = t('clearProgress') + '…';
  renderParentLevels();
  renderParentSuggestions();
  renderPracticeChart();
  const readCount = data.story.chapters.filter(chapter => progress.storyReadDates[chapter.id]).length;
  const completedIds = Object.keys(progress.copybookCompletions).filter(id => progress.copybookCompletions[id].length);
  const completedItems = data.copybook.sets.flatMap(set => set.items)
    .filter(item => completedIds.includes(item.id) || completedIds.includes(item.characterId));
  const completedChars = [...new Set(completedItems.map(item => item.char || (data.characters.find(character => character.id === item.characterId) || {}).char).filter(Boolean))];
  ui.parentStorySummary.textContent = locale() === 'zhCN'
    ? '故事已读 ' + readCount + '／' + data.story.chapters.length + '、练字簿已练：' + (completedChars.join('、') || '—')
    : '故事已讀 ' + readCount + '／' + data.story.chapters.length + '、練字簿已練：' + (completedChars.join('、') || '—');
  updateLanguageButtons();
}

function clearProgress() {
  if (!window.confirm(t('clearConfirm'))) return;
  localStorage.removeItem(data.settings.storageKey);
  progress = emptyProgress();
  stageRun = null;
  setScreen('home');
}

function installGlobalEvents() {
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  ui.parentTab.addEventListener('click', () => setScreen(currentScreen === 'parents' ? 'home' : 'parents'));
  ui.storyOpen.addEventListener('click', () => setScreen('story-list'));
  ui.storyListBack.addEventListener('click', () => setScreen('home'));
  ui.storyReaderBack.addEventListener('click', () => setScreen('story-list'));
  ui.storyReaderList.addEventListener('click', () => setScreen('home'));
  ui.backToLevels.addEventListener('click', () => {
    stageRun = null;
    setScreen('home');
  });
  ui.clearProgress.addEventListener('click', clearProgress);
  ui.levelDemo.addEventListener('click', async () => {
    if (!stageRun || stageRun.level.id !== 'animal-listening' || stageRun.demoUsed) return;
    const run = stageRun;
    const question = run.currentQuestion;
    const answerCard = ui.playScene.querySelector('[data-answer-id="' + question.id + '"]');
    if (!answerCard) return;
    run.demoUsed = true;
    ui.levelDemo.hidden = true;
    const animal = getAnimal(question.id);
    try {
      await playClip(animal.voiceKey);
      if (run !== stageRun || run.currentQuestion !== question || !answerCard.isConnected) return;
      run.demonstrationClick = true;
      answerCard.click();
    } finally {
      run.demonstrationClick = false;
    }
  });
  ui.playScene.addEventListener('pointerup', handleSheepPointerUp);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stopVisibleGameTime();
    else startVisibleGameTime();
  });
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#parents' && currentScreen !== 'parents') setScreen('parents');
  });
}

async function loadGame() {
  const responses = await Promise.all([
    fetch(DATA_URL, { cache: 'no-cache' }),
    fetch(VOICE_MANIFEST_URL, { cache: 'no-cache' }),
  ]);
  if (!responses[0].ok) throw new Error('Question data unavailable (' + responses[0].status + ')');
  if (!responses[1].ok) throw new Error('Voice manifest unavailable (' + responses[1].status + ')');
  data = await responses[0].json();
  voiceManifest = await responses[1].json();
  progress = readProgress();
  installGlobalEvents();
  updateLanguageButtons();
  const openParentReport = window.location.hash === '#parents';
  if (openParentReport) {
    setScreen('parents');
    return;
  }
  setScreen('home');

  const requestedLevel = new URLSearchParams(window.location.search).get('level');
  if (requestedLevel) {
    const requestedIndex = data.levels.findIndex(level => level.id === requestedLevel);
    if (requestedIndex >= 0 && isLevelUnlocked(requestedIndex)) startLevel(requestedLevel);
    else if (requestedIndex >= 0) ui.voiceStatus.textContent = t('locked');
  }
}

loadGame().catch(error => {
  const main = document.querySelector('main');
  const notice = createText('p', 'ark-load-error', locale() === 'zhCN' ? '遊戲資料暫時未能載入，請確認以本機靜態伺服器開啟。' : '遊戲資料暫時未能載入，請確認以本機靜態伺服器開啟。');
  notice.setAttribute('role', 'alert');
  if (main) main.replaceChildren(notice);
  console.error('Ark game initialization failed:', error.message);
});
