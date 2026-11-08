'use strict';

const DATA_URL = 'data/ark-k2.json';
const VOICE_MANIFEST_URL = 'audio/ark-k2/manifest.json';
const app = document.getElementById('arkApp');

const ui = {
  home: document.getElementById('homeScreen'),
  game: document.getElementById('gameScreen'),
  parents: document.getElementById('parentScreen'),
  result: document.getElementById('resultScreen'),
  levelGrid: document.getElementById('levelGrid'),
  totalStars: document.getElementById('totalStars'),
  voiceStatus: document.getElementById('voiceStatus'),
  gameVoiceStatus: document.getElementById('gameVoiceStatus'),
  parentTab: document.getElementById('parentTab'),
  backToLevels: document.getElementById('backToLevels'),
  backFromParents: document.getElementById('backFromParents'),
  levelKicker: document.getElementById('levelKicker'),
  levelTitle: document.getElementById('levelTitle'),
  questionCounter: document.getElementById('questionCounter'),
  questionProgress: document.getElementById('questionProgress'),
  levelInstruction: document.getElementById('levelInstruction'),
  playScene: document.getElementById('playScene'),
  feedback: document.getElementById('feedback'),
  playActions: document.getElementById('playActions'),
  resultEmoji: document.getElementById('resultEmoji'),
  resultKicker: document.getElementById('resultKicker'),
  resultTitle: document.getElementById('resultTitle'),
  resultScore: document.getElementById('resultScore'),
  resultStars: document.getElementById('resultStars'),
  resultActions: document.getElementById('resultActions'),
  parentIntro: document.getElementById('parentIntro'),
  parentLevelScores: document.getElementById('parentLevelScores'),
  recentDateLabel: document.getElementById('recentDateLabel'),
  recentDateValue: document.getElementById('recentDateValue'),
  mistakeList: document.getElementById('mistakeList'),
  noMistakes: document.getElementById('noMistakes'),
  clearProgress: document.getElementById('clearProgress'),
};

let data;
let voiceManifest;
let progress;
let currentScreen = 'home';
let stageRun = null;
let activeAudio = null;
let currentCanvas = null;
let drawingPointer = null;
let lastDraggedSheep = null;
let suppressSheepClick = false;

function locale() {
  return progress?.language === 'zhCN' ? 'zhCN' : 'zhHK';
}

function text(value) {
  if (value && typeof value === 'object') return value[locale()] || value.zhHK || '';
  return value == null ? '' : String(value);
}

function interpolate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    text(template),
  );
}

function t(key, values = {}) {
  const value = data.interface[key];
  return interpolate(value, values);
}

function staticText(key, values = {}) {
  return interpolate(data.staticText[key], values);
}

function emptyProgress() {
  return {
    version: 1,
    language: data.settings.localeDefault,
    levels: {},
    mistakes: {},
    lastPracticeDate: '',
  };
}

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(data.settings.storageKey) || 'null');
    if (!saved || saved.version !== 1 || typeof saved !== 'object') return emptyProgress();
    return {
      ...emptyProgress(),
      ...saved,
      language: ['zhHK', 'zhCN'].includes(saved.language) ? saved.language : data.settings.localeDefault,
      levels: saved.levels && typeof saved.levels === 'object' ? saved.levels : {},
      mistakes: saved.mistakes && typeof saved.mistakes === 'object' ? saved.mistakes : {},
    };
  } catch (error) {
    return emptyProgress();
  }
}

function writeProgress() {
  try {
    localStorage.setItem(data.settings.storageKey, JSON.stringify(progress));
  } catch (error) {
    showFeedback(locale() === 'zhCN' ? '瀏覽器暫時無法儲存進度。' : '瀏覽器暫時無法儲存進度。', true);
  }
}

function todayInHongKong() {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Hong_Kong',
  }).format(new Date());
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

function setScreen(name) {
  currentScreen = name;
  ui.home.hidden = name !== 'home';
  ui.game.hidden = name !== 'game';
  ui.parents.hidden = name !== 'parents';
  ui.result.hidden = name !== 'result';
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (name === 'home') renderHome();
  if (name === 'parents') renderParentReport();
}

function updateLanguageButtons() {
  document.documentElement.lang = locale() === 'zhCN' ? 'zh-CN' : 'zh-HK';
  ui.parentTab.textContent = t('parentTab');
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === locale()));
  });
  document.querySelectorAll('[data-localize]').forEach(element => {
    element.textContent = staticText(element.dataset.localize);
  });
  document.querySelectorAll('[data-localize-aria-label]').forEach(element => {
    element.setAttribute('aria-label', staticText(element.dataset.localizeAriaLabel));
  });
  document.title = `${text(data.title)} — ${locale() === 'zhCN' ? '幼儿学习中心' : '幼兒學習中心'}`;
}

function setLanguage(nextLanguage) {
  if (!['zhHK', 'zhCN'].includes(nextLanguage) || nextLanguage === locale()) return;
  progress.language = nextLanguage;
  writeProgress();
  updateLanguageButtons();
  if (currentScreen === 'home') renderHome();
  if (currentScreen === 'game' && stageRun) renderQuestion();
  if (currentScreen === 'parents') renderParentReport();
  if (currentScreen === 'result' && stageRun) renderStageResult();
}

function voiceAssetPath(key) {
  const asset = (voiceManifest?.assets || []).find(item =>
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

function playClip(key) {
  const path = voiceAssetPath(key);
  if (!path) {
    setVoiceMissing();
    return Promise.resolve(false);
  }
  clearVoiceMissing();
  return new Promise(resolve => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }
    const audio = new Audio(path);
    activeAudio = audio;
    audio.addEventListener('ended', () => resolve(true), { once: true });
    audio.addEventListener('error', () => {
      setVoiceMissing();
      resolve(false);
    }, { once: true });
    audio.play().catch(() => {
      setVoiceMissing();
      resolve(false);
    });
  });
}

async function playClipSequence(keys) {
  for (const key of keys) {
    const path = voiceAssetPath(key);
    if (!path) {
      setVoiceMissing();
      return false;
    }
    const played = await playClip(key);
    if (!played) return false;
    await new Promise(resolve => window.setTimeout(resolve, 120));
  }
  return true;
}

function playQuestionVoice(keys) {
  const sequence = Array.isArray(keys) ? [...keys] : [keys];
  if (stageRun?.questionIndex === 0) sequence.unshift(stageRun.level.voiceKey);
  return playClipSequence(sequence);
}

function playAnimalSound(animal) {
  const path = animal.sound?.[locale()];
  if (!path) return playClip(animal.voiceKey);
  if (activeAudio) activeAudio.pause();
  return new Promise(resolve => {
    const audio = new Audio(path);
    activeAudio = audio;
    audio.addEventListener('ended', () => resolve(true), { once: true });
    audio.addEventListener('error', () => {
      setVoiceMissing();
      resolve(false);
    }, { once: true });
    audio.play().catch(() => {
      setVoiceMissing();
      resolve(false);
    });
  });
}

function showFeedback(message, isError = false) {
  ui.feedback.textContent = message;
  ui.feedback.classList.toggle('is-error', isError);
}

function showHintFeedback(message) {
  showFeedback(message, true);
  playClip('hint');
}

function praiseThenAdvance() {
  playClip('praise').then(() => window.setTimeout(advanceQuestion, 420));
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

function renderHome() {
  updateLanguageButtons();
  ui.parentTab.textContent = t('parentTab');
  ui.totalStars.textContent = `⭐ ${data.levels.reduce((total, level) => total + levelRecord(level.id).stars, 0)} / ${data.levels.length * 3}`;
  ui.levelGrid.replaceChildren();
  data.levels.forEach((level, index) => {
    const unlocked = index === 0 || levelRecord(data.levels[index - 1].id).stars >= data.settings.unlockMinimumStars;
    const button = document.createElement('button');
    button.className = 'ark-level-card';
    button.type = 'button';
    button.disabled = !unlocked;
    button.dataset.level = level.id;
    const icons = ['🔊', '✍️', '🐑', '➕'];
    const record = levelRecord(level.id);
    button.innerHTML = `<span class="ark-level-number">${escapeHtml(interpolate(data.staticText.levelNumber, { number: index + 1 }))}${unlocked ? '' : ' · 🔒'}</span><span class="ark-level-icon" aria-hidden="true">${icons[index]}</span><span class="ark-level-title">${escapeHtml(text(level.title))}</span><span class="ark-level-stars" aria-label="${escapeHtml(interpolate(data.staticText.starLabel, { number: record.stars }))}">${'★'.repeat(record.stars)}${'☆'.repeat(3 - record.stars)}</span>`;
    button.addEventListener('click', () => startLevel(level.id));
    ui.levelGrid.append(button);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function makeStageQuestions(level) {
  if (level.id === 'animal-listening') return shuffle(level.questionIds).slice(0, level.questionCount).map(id => ({ kind: 'animal', id }));
  if (level.id === 'stroke-writing') return level.questionIds.map(id => ({ kind: 'character', id }));
  if (level.id === 'sheep-counting') {
    return shuffle(Array.from({ length: level.maximum - level.minimum + 1 }, (_, index) => level.minimum + index))
      .slice(0, level.questionCount)
      .map(number => ({ kind: 'count', number }));
  }
  if (level.id === 'animal-math') {
    const rotation = levelRecord(level.id).playCount * data.arithmetic.questionsPerRound;
    return ArkK2Math.generateRound(data.arithmetic, data.animals, Math.random, rotation)
      .map(question => ({ kind: 'math', ...question }));
  }
  return [];
}

function startLevel(id) {
  const levelIndex = data.levels.findIndex(level => level.id === id);
  if (levelIndex < 0) return;
  if (levelIndex > 0 && levelRecord(data.levels[levelIndex - 1].id).stars < data.settings.unlockMinimumStars) return;
  const level = data.levels[levelIndex];
  stageRun = {
    level,
    levelIndex,
    questions: makeStageQuestions(level),
    questionIndex: 0,
    correctFirstTry: 0,
    boarded: [],
    planks: 0,
    completedQuestion: false,
    questionHadMistake: false,
    mistakeRecorded: false,
    strokeIndex: 0,
    strokeSamples: [],
    sheepOnBoard: [],
    countFirstAttempt: true,
    mathFirstAttempt: true,
  };
  ui.levelKicker.textContent = `${locale() === 'zhCN' ? '第' : '第'} ${levelIndex + 1} ${locale() === 'zhCN' ? '级' : '級'} · ${text(data.world)}`;
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
  stageRun.sheepOnBoard = [];
  stageRun.countFirstAttempt = true;
  stageRun.mathFirstAttempt = true;
}

function renderQuestion() {
  if (!stageRun) return;
  clearPlayPanels();
  updateLanguageButtons();
  ui.gameVoiceStatus.hidden = true;
  ui.gameVoiceStatus.textContent = '';
  const question = stageRun.questions[stageRun.questionIndex];
  if (!question) return finishLevel();
  ui.questionCounter.textContent = interpolate(data.interface.questionCounter, {
    current: stageRun.questionIndex + 1,
    total: stageRun.questions.length,
  });
  ui.questionProgress.style.width = `${(stageRun.questionIndex / stageRun.questions.length) * 100}%`;
  if (question.kind === 'animal') renderAnimalQuestion(question);
  if (question.kind === 'character') renderStrokeQuestion(question);
  if (question.kind === 'count') renderCountQuestion(question);
  if (question.kind === 'math') renderMathQuestion(question);
}

function addReplayButton(voiceKey, accessibleText) {
  const button = document.createElement('button');
  button.className = 'ark-audio-button';
  button.type = 'button';
  button.textContent = `🔊 ${accessibleText}`;
  button.addEventListener('click', () => playClip(voiceKey));
  return button;
}

function animalCard(animal, showImage = true) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ark-answer-card';
  button.dataset.answerId = animal.id;
  const imageMarkup = showImage && animal.image
    ? `<img src="${escapeHtml(animal.image)}" alt="" draggable="false">`
    : showImage
      ? `<span class="ark-animal-emoji" aria-hidden="true">${escapeHtml(animal.emoji)}</span>`
      : '';
  button.innerHTML = `${imageMarkup}<span>${escapeHtml(text(animal.label))}</span>`;
  return button;
}

function renderAnimalQuestion(question) {
  const animal = getAnimal(question.id);
  const order = data.animals.map(item => item.id);
  const animalIndex = order.indexOf(animal.id);
  const wrongChoices = [order[(animalIndex + 2) % order.length], order[(animalIndex + 5) % order.length]];
  const choices = shuffle([animal.id, ...wrongChoices].map(getAnimal));
  const deck = document.createElement('div');
  deck.className = 'ark-boat-deck';
  deck.id = 'animalDeck';
  deck.setAttribute('aria-label', locale() === 'zhCN' ? '方舟甲板' : '方舟甲板');
  stageRun.boarded.forEach(id => {
    const boarded = getAnimal(id);
    if (boarded.image) {
      const image = document.createElement('img');
      image.className = 'ark-boarded-animal';
      image.src = boarded.image;
      image.alt = text(boarded.label);
      image.draggable = false;
      deck.append(image);
    } else {
      const emoji = document.createElement('span');
      emoji.className = 'ark-boarded-emoji';
      emoji.setAttribute('role', 'img');
      emoji.setAttribute('aria-label', text(boarded.label));
      emoji.textContent = boarded.emoji;
      deck.append(emoji);
    }
  });
  const replay = addReplayButton(animal.voiceKey, t('listenAgain'));
  const hint = document.createElement('p');
  hint.className = 'ark-question-hint';
  hint.textContent = t('animalOptions');
  const answers = document.createElement('div');
  answers.className = 'ark-answer-grid';
  answers.setAttribute('role', 'group');
  answers.setAttribute('aria-label', hint.textContent);
  choices.forEach(choice => {
    const card = animalCard(choice);
    card.addEventListener('click', () => {
      if (stageRun.completedQuestion) return;
      if (choice.id === animal.id) {
        stageRun.completedQuestion = true;
        if (!stageRun.questionHadMistake) stageRun.correctFirstTry += 1;
        stageRun.boarded.push(animal.id);
        showFeedback(t('correct'));
        renderQuestionCardDeck();
        playAnimalSound(animal).then(() => playClip('praise')).then(() => window.setTimeout(advanceQuestion, 420));
      } else {
        stageRun.questionHadMistake = true;
        if (!stageRun.mistakeRecorded) {
          recordMistake('animal', animal.id, text(animal.label));
          stageRun.mistakeRecorded = true;
        }
        card.classList.add('wrong');
        showHintFeedback(t('wrong'));
      }
    });
    answers.append(card);
  });
  ui.playScene.append(deck, replay, hint, answers);
  playQuestionVoice(animal.voiceKey);
}

function renderQuestionCardDeck() {
  const deck = document.getElementById('animalDeck');
  if (!deck) return;
  const children = stageRun.boarded.map(id => {
    const animal = getAnimal(id);
    return animal.image
      ? `<img class="ark-boarded-animal" src="${escapeHtml(animal.image)}" alt="${escapeHtml(text(animal.label))}" draggable="false">`
      : `<span class="ark-boarded-emoji" role="img" aria-label="${escapeHtml(text(animal.label))}">${escapeHtml(animal.emoji)}</span>`;
  }).join('');
  deck.innerHTML = children;
}

function drawPath(context, points, progressRatio = 1, dashed = false) {
  if (!points?.length) return;
  const width = context.canvas.width;
  const height = context.canvas.height;
  const scaled = points.map(([x, y]) => [x / 1000 * width, y / 1000 * height]);
  let total = 0;
  const lengths = [];
  for (let index = 1; index < scaled.length; index += 1) {
    const length = Math.hypot(scaled[index][0] - scaled[index - 1][0], scaled[index][1] - scaled[index - 1][1]);
    lengths.push(length);
    total += length;
  }
  const targetLength = total * Math.max(0, Math.min(1, progressRatio));
  let remaining = targetLength;
  context.beginPath();
  context.moveTo(...scaled[0]);
  for (let index = 0; index < lengths.length && remaining > 0; index += 1) {
    const segment = lengths[index];
    const ratio = Math.min(1, remaining / segment);
    const from = scaled[index];
    const to = scaled[index + 1];
    context.lineTo(from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio);
    remaining -= segment;
  }
  context.setLineDash(dashed ? [10, 10] : []);
  context.stroke();
  context.setLineDash([]);
}

function drawStrokeCanvas(character, canvas, activeIndex, activeSamples = null) {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 30;
  context.strokeStyle = '#d4e0e2';
  character.strokes.forEach(stroke => drawPath(context, stroke.points));
  character.strokes.slice(0, activeIndex).forEach(stroke => {
    context.strokeStyle = '#67b698';
    drawPath(context, stroke.points);
  });
  if (activeSamples?.length > 1) {
    context.strokeStyle = '#4e7db6';
    context.lineWidth = 25;
    context.beginPath();
    context.moveTo(activeSamples[0][0] / 1000 * canvas.width, activeSamples[0][1] / 1000 * canvas.height);
    activeSamples.slice(1).forEach(([x, y]) => context.lineTo(x / 1000 * canvas.width, y / 1000 * canvas.height));
    context.stroke();
  }
  const active = character.strokes[activeIndex];
  if (active) {
    context.strokeStyle = '#687d8c';
    context.lineWidth = 19;
    drawPath(context, active.points, 1, true);
    const [startX, startY] = active.points[0];
    const [nextX, nextY] = active.points[1] || active.points[0];
    const sx = startX / 1000 * canvas.width;
    const sy = startY / 1000 * canvas.height;
    const angle = Math.atan2(nextY - startY, nextX - startX);
    context.fillStyle = '#4baf7e';
    context.beginPath();
    context.arc(sx, sy, 11, 0, Math.PI * 2);
    context.fill();
    const arrowAt = active.points[Math.min(1, active.points.length - 1)];
    const ax = arrowAt[0] / 1000 * canvas.width;
    const ay = arrowAt[1] / 1000 * canvas.height;
    context.save();
    context.translate(ax, ay);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(-16, -12);
    context.lineTo(2, 0);
    context.lineTo(-16, 12);
    context.fill();
    context.restore();
  }
}

function animateCharacter(character, canvas) {
  const run = stageRun;
  const token = (run.strokeAnimationToken || 0) + 1;
  run.strokeAnimationToken = token;
  let strokeIndex = 0;
  const context = canvas.getContext('2d');
  const stepDuration = 125;
  const startTime = performance.now();
  function frame(now) {
    if (stageRun !== run || run.strokeAnimationToken !== token) return;
    const elapsed = now - startTime;
    strokeIndex = Math.min(character.strokes.length, Math.floor(elapsed / stepDuration));
    const inStroke = Math.min(1, (elapsed % stepDuration) / stepDuration);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 28;
    context.strokeStyle = '#d4e0e2';
    character.strokes.forEach(stroke => drawPath(context, stroke.points));
    character.strokes.slice(0, strokeIndex).forEach(stroke => {
      context.strokeStyle = '#48a982';
      drawPath(context, stroke.points);
    });
    if (strokeIndex < character.strokes.length) {
      context.strokeStyle = '#48a982';
      drawPath(context, character.strokes[strokeIndex].points, inStroke);
      window.requestAnimationFrame(frame);
    } else {
      drawStrokeCanvas(character, canvas, 0);
      run.strokeReady = true;
    }
  }
  window.requestAnimationFrame(frame);
}

function renderStrokeQuestion(question) {
  const character = getCharacter(question.id);
  if (!character) return;
  const layout = document.createElement('div');
  layout.className = 'ark-stroke-layout';
  const canvas = document.createElement('canvas');
  canvas.className = 'ark-writing-canvas';
  canvas.width = 320;
  canvas.height = 320;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${text(character.label)}，${character.strokeCount}${locale() === 'zhCN' ? '画' : '畫'}`);
  currentCanvas = canvas;
  const side = document.createElement('div');
  side.className = 'ark-stroke-side';
  const target = document.createElement('span');
  target.className = 'ark-target-char';
  target.textContent = text(character.label);
  const replay = addReplayButton(character.voiceKey, t('listenAgain'));
  const counter = document.createElement('span');
  counter.className = 'ark-stroke-progress';
  counter.id = 'strokeProgress';
  const hint = document.createElement('p');
  hint.className = 'ark-stroke-hint';
  hint.id = 'strokeHint';
  hint.textContent = t('strokePrompt');
  const plankLabel = document.createElement('span');
  plankLabel.className = 'ark-plank-label';
  plankLabel.textContent = locale() === 'zhCN' ? '已加船板' : '已加船板';
  const plankCount = document.createElement('strong');
  plankCount.className = 'ark-plank-count';
  plankCount.id = 'plankCount';
  const plankReadout = document.createElement('div');
  plankReadout.className = 'ark-plank-readout';
  plankReadout.append(plankLabel, plankCount);
  side.append(target, replay, counter, plankReadout, hint);
  layout.append(canvas, side);
  ui.playScene.append(layout);
  const updateCounter = () => {
    counter.textContent = `${stageRun.strokeIndex} / ${character.strokeCount} ${t('plank')}`;
    plankCount.textContent = String(stageRun.planks);
    hint.textContent = t('strokePrompt');
    drawStrokeCanvas(character, canvas, stageRun.strokeIndex);
  };
  updateCounter();
  stageRun.strokeReady = false;
  playQuestionVoice(character.voiceKey);
  animateCharacter(character, canvas);

  canvas.addEventListener('pointerdown', event => {
    if (!stageRun.strokeReady || stageRun.completedQuestion || stageRun.strokeIndex >= character.strokes.length) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawingPointer = event.pointerId;
    stageRun.strokeSamples = [canvasPoint(event, canvas)];
  });
  canvas.addEventListener('pointermove', event => {
    if (drawingPointer !== event.pointerId) return;
    event.preventDefault();
    stageRun.strokeSamples.push(canvasPoint(event, canvas));
    drawStrokeCanvas(character, canvas, stageRun.strokeIndex, stageRun.strokeSamples);
  });
  canvas.addEventListener('pointerup', event => {
    if (drawingPointer !== event.pointerId) return;
    event.preventDefault();
    stageRun.strokeSamples.push(canvasPoint(event, canvas));
    drawingPointer = null;
    const stroke = character.strokes[stageRun.strokeIndex];
    const correct = followsStroke(stageRun.strokeSamples, stroke.points);
    stageRun.strokeSamples = [];
    if (correct) {
      stageRun.strokeIndex += 1;
      stageRun.planks += 1;
      if (stageRun.strokeIndex === character.strokes.length) {
        stageRun.completedQuestion = true;
        if (!stageRun.questionHadMistake) stageRun.correctFirstTry += 1;
        showFeedback(t('correct'));
        praiseThenAdvance();
      } else {
        showFeedback(t('correct'));
      }
    } else {
      stageRun.questionHadMistake = true;
      if (!stageRun.mistakeRecorded) {
        recordMistake('character', character.id, text(character.label));
        stageRun.mistakeRecorded = true;
      }
      showHintFeedback(t('strokeWrong'));
      hint.textContent = t('strokePrompt');
    }
    updateCounter();
  });
  canvas.addEventListener('pointercancel', () => {
    drawingPointer = null;
    stageRun.strokeSamples = [];
    drawStrokeCanvas(character, canvas, stageRun.strokeIndex);
  });
}

function canvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return [
    Math.max(0, Math.min(1000, (event.clientX - rect.left) / rect.width * 1000)),
    Math.max(0, Math.min(1000, (event.clientY - rect.top) / rect.height * 1000)),
  ];
}

function pathLength(points) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) total += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
  return total;
}

function nearestProgress(point, target) {
  let walked = 0;
  let bestDistance = Infinity;
  let bestProgress = 0;
  const total = pathLength(target) || 1;
  for (let index = 1; index < target.length; index += 1) {
    const a = target[index - 1];
    const b = target[index];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lengthSquared = dx * dx + dy * dy || 1;
    const ratio = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
    const px = a[0] + ratio * dx;
    const py = a[1] + ratio * dy;
    const distance = Math.hypot(point[0] - px, point[1] - py);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestProgress = (walked + Math.sqrt(lengthSquared) * ratio) / total;
    }
    walked += Math.sqrt(lengthSquared);
  }
  return { distance: bestDistance, progress: bestProgress };
}

function followsStroke(actual, target) {
  if (actual.length < 3 || pathLength(actual) < pathLength(target) * 0.28) return false;
  const start = nearestProgress(actual[0], target);
  const end = nearestProgress(actual[actual.length - 1], target);
  if (start.distance > 170 || end.distance > 210 || end.progress - start.progress < 0.45) return false;
  const strides = actual.filter((_, index) => index % Math.max(1, Math.floor(actual.length / 12)) === 0);
  const aligned = strides.map(point => nearestProgress(point, target));
  const nearRatio = aligned.filter(point => point.distance <= 155).length / Math.max(1, aligned.length);
  let forwardSteps = 0;
  for (let index = 1; index < aligned.length; index += 1) {
    if (aligned[index].progress + 0.04 >= aligned[index - 1].progress) forwardSteps += 1;
  }
  const forwardRatio = forwardSteps / Math.max(1, aligned.length - 1);
  return nearRatio >= 0.62 && forwardRatio >= 0.68;
}

function renderCountQuestion(question) {
  const sheep = getAnimal(data.counting.animalId);
  const numberLabel = locale() === 'zhCN' ? data.numberWords.zhCN[question.number] : data.numberWords.zhHK[question.number];
  const prompt = document.createElement('p');
  prompt.className = 'ark-count-prompt';
  prompt.textContent = interpolate(data.interface.countPrompt, { number: numberLabel });
  const replay = document.createElement('div');
  replay.className = 'ark-question-tools';
  const replayButton = document.createElement('button');
  replayButton.className = 'ark-audio-button';
  replayButton.type = 'button';
  replayButton.textContent = `🔊 ${t('listenAgain')}`;
  replayButton.addEventListener('click', () => playClipSequence([
    'count_lead_in', `number_${question.number}`, 'count_tail',
  ]));
  replay.append(replayButton);
  const layout = document.createElement('div');
  layout.className = 'ark-count-layout';
  const pasture = makeDropZone('pastureZone', locale() === 'zhCN' ? '草地' : '草地');
  const boat = makeDropZone('boatZone', locale() === 'zhCN' ? '方舟' : '方舟');
  layout.append(pasture, boat);
  ui.playScene.append(prompt, replay, layout);
  renderSheepZones(sheep);
  ui.playActions.append(makeActionButton(t('check'), 'btn-primary', () => checkCount(question, sheep)));
  playQuestionVoice(['count_lead_in', `number_${question.number}`, 'count_tail']);
}

function makeDropZone(id, label) {
  const zone = document.createElement('div');
  zone.className = 'ark-drop-zone';
  zone.id = id;
  zone.dataset.dropZone = id;
  zone.setAttribute('role', 'group');
  zone.setAttribute('aria-label', label);
  zone.innerHTML = `<p class="ark-zone-title"><span>${escapeHtml(label)}</span><span class="ark-zone-count"></span></p><div class="ark-sheep-grid"></div>`;
  zone.addEventListener('pointerenter', () => zone.classList.add('is-target'));
  zone.addEventListener('pointerleave', () => zone.classList.remove('is-target'));
  return zone;
}

function renderSheepZones(sheep) {
  const pastureGrid = document.querySelector('#pastureZone .ark-sheep-grid');
  const boatGrid = document.querySelector('#boatZone .ark-sheep-grid');
  const pastureCount = document.querySelector('#pastureZone .ark-zone-count');
  const boatCount = document.querySelector('#boatZone .ark-zone-count');
  if (!pastureGrid || !boatGrid) return;
  pastureGrid.replaceChildren();
  boatGrid.replaceChildren();
  const allIds = Array.from({ length: 10 }, (_, index) => index + 1);
  allIds.forEach(id => {
    const token = makeSheepToken(id, sheep);
    (stageRun.sheepOnBoard.includes(id) ? boatGrid : pastureGrid).append(token);
  });
  const count = stageRun.sheepOnBoard.length;
  pastureCount.textContent = `${10 - count}`;
  boatCount.textContent = interpolate(data.interface.animalsCount, { current: count });
}

function makeSheepToken(id, sheep) {
  const button = document.createElement('button');
  button.className = 'ark-sheep-token';
  button.type = 'button';
  button.dataset.sheepId = id;
  button.setAttribute('aria-label', `${text(sheep.label)} ${id}`);
  button.innerHTML = `<img src="${escapeHtml(sheep.image)}" alt="" draggable="false">`;
  button.addEventListener('pointerdown', event => {
    lastDraggedSheep = { id, startX: event.clientX, startY: event.clientY };
  });
  button.addEventListener('click', () => {
    if (suppressSheepClick) {
      suppressSheepClick = false;
      return;
    }
    moveSheep(id, stageRun.sheepOnBoard.includes(id) ? 'pastureZone' : 'boatZone', sheep);
  });
  return button;
}

function handleSheepPointerUp(event) {
  const drag = lastDraggedSheep;
  lastDraggedSheep = null;
  if (!drag) return;
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (distance < 14) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-drop-zone]');
  if (target?.id === 'boatZone' || target?.id === 'pastureZone') {
    suppressSheepClick = true;
    moveSheep(drag.id, target.id, getAnimal(data.counting.animalId));
    window.setTimeout(() => { suppressSheepClick = false; }, 0);
  }
}

function moveSheep(id, destination, sheep) {
  if (!stageRun || stageRun.completedQuestion) return;
  const currentIndex = stageRun.sheepOnBoard.indexOf(id);
  if (destination === 'boatZone' && currentIndex === -1) stageRun.sheepOnBoard.push(id);
  if (destination === 'pastureZone' && currentIndex !== -1) stageRun.sheepOnBoard.splice(currentIndex, 1);
  stageRun.sheepOnBoard.sort((a, b) => a - b);
  renderSheepZones(sheep);
  showFeedback('');
}

function checkCount(question, sheep) {
  if (stageRun.completedQuestion) return;
  if (stageRun.sheepOnBoard.length === question.number) {
    stageRun.completedQuestion = true;
    if (stageRun.countFirstAttempt) stageRun.correctFirstTry += 1;
    showFeedback(t('correct'));
    praiseThenAdvance();
    return;
  }
  stageRun.countFirstAttempt = false;
  if (!stageRun.mistakeRecorded) {
    recordMistake('questionType', 'counting', locale() === 'zhCN' ? '数一数' : '數一數');
    stageRun.mistakeRecorded = true;
  }
  showHintFeedback(t('countWrong'));
}

function renderMathQuestion(item) {
  const animal = getAnimal(item.animalId);
  const prompt = document.createElement('p');
  prompt.className = 'ark-count-prompt';
  prompt.textContent = t('mathPrompt');
  const equation = document.createElement('div');
  equation.className = 'ark-math-scene';
  const groups = document.createElement('div');
  groups.className = 'ark-math-groups';
  const first = makeMathGroup(item.first, animal, locale() === 'zhCN' ? '船上' : '船上');
  const second = makeMathGroup(item.second, animal, item.operation === 'add'
    ? (locale() === 'zhCN' ? '再上船' : '再上船')
    : (locale() === 'zhCN' ? '下船' : '落船'));
  const operator = document.createElement('span');
  operator.className = 'ark-math-operator';
  operator.setAttribute('aria-label', item.operation === 'add' ? '加' : '減');
  operator.textContent = item.operation === 'add' ? '+' : '−';
  groups.append(first, operator, second);
  const symbol = document.createElement('div');
  symbol.className = 'ark-math-operator';
  symbol.textContent = '= ?';
  const answers = document.createElement('div');
  answers.className = 'ark-math-answers';
  item.choices.forEach(answer => {
    const button = document.createElement('button');
    button.className = 'ark-math-answer';
    button.type = 'button';
    button.textContent = String(answer);
    button.setAttribute('aria-label', String(answer));
    button.addEventListener('click', () => checkMathAnswer(answer, item));
    answers.append(button);
  });
  equation.append(groups, symbol, answers);
  ui.playScene.append(prompt, equation);
  playQuestionVoice([
    `number_${item.first}`,
    item.operation === 'add' ? 'math_plus' : 'math_minus',
    `number_${item.second}`,
    'math_question',
  ]);
}

function makeMathGroup(count, animal, label) {
  const group = document.createElement('div');
  group.className = 'ark-math-group';
  const title = document.createElement('strong');
  title.textContent = `${label} · ${count}`;
  const icons = document.createElement('div');
  icons.className = 'ark-math-animals';
  for (let index = 0; index < count; index += 1) {
    if (animal.image) {
      const image = document.createElement('img');
      image.src = animal.image;
      image.alt = '';
      image.draggable = false;
      icons.append(image);
    } else {
      const emoji = document.createElement('span');
      emoji.className = 'ark-math-emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = animal.emoji;
      icons.append(emoji);
    }
  }
  group.append(title, icons);
  return group;
}

function checkMathAnswer(answer, item) {
  if (stageRun.completedQuestion) return;
  if (answer === item.answer) {
    stageRun.completedQuestion = true;
    if (stageRun.mathFirstAttempt) stageRun.correctFirstTry += 1;
    showFeedback(t('correct'));
    praiseThenAdvance();
    return;
  }
  stageRun.mathFirstAttempt = false;
  if (!stageRun.mistakeRecorded) {
    const label = item.operation === 'add'
      ? '加法'
      : (locale() === 'zhCN' ? '减法' : '減法');
    recordMistake('questionType', item.operation, label);
    stageRun.mistakeRecorded = true;
  }
  showHintFeedback(t('mathWrong'));
}

function makeActionButton(label, style, action) {
  const button = document.createElement('button');
  button.className = `btn ${style}`;
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', action);
  return button;
}

function recordMistake(kind, id, label) {
  const key = `${kind}:${id}`;
  const existing = progress.mistakes[key] || { kind, id, label, count: 0 };
  existing.count += 1;
  existing.label = label;
  progress.mistakes[key] = existing;
  writeProgress();
}

function advanceQuestion() {
  if (!stageRun) return;
  stageRun.questionIndex += 1;
  if (stageRun.questionIndex >= stageRun.questions.length) {
    finishLevel();
    return;
  }
  resetQuestionFlags();
  renderQuestion();
}

function starsFor(correctCount) {
  return data.settings.stars.reduce((stars, rule) => correctCount >= rule.minimumCorrect ? rule.stars : stars, 0);
}

function finishLevel() {
  const record = levelRecord(stageRun.level.id);
  const stars = starsFor(stageRun.correctFirstTry);
  record.stars = Math.max(record.stars, stars);
  record.bestCorrect = Math.max(record.bestCorrect, stageRun.correctFirstTry);
  record.playCount += 1;
  record.lastPractice = todayInHongKong();
  progress.levels[stageRun.level.id] = record;
  progress.lastPracticeDate = record.lastPractice;
  writeProgress();
  ui.questionProgress.style.width = '100%';
  currentScreen = 'result';
  ui.home.hidden = true;
  ui.game.hidden = true;
  ui.parents.hidden = true;
  ui.result.hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  renderStageResult(stars);
}

function renderStageResult(starsOverride) {
  if (!stageRun) return;
  const stars = Number.isInteger(starsOverride) ? starsOverride : levelRecord(stageRun.level.id).stars;
  const nextLevel = data.levels[stageRun.levelIndex + 1];
  ui.resultEmoji.textContent = stageRun.levelIndex === data.levels.length - 1 ? '⛵' : '⭐';
  ui.resultKicker.textContent = interpolate(data.staticText.levelTask, { number: stageRun.levelIndex + 1 });
  ui.resultTitle.textContent = interpolate(data.interface.levelComplete, { stars });
  ui.resultScore.textContent = interpolate(data.interface.firstTryScore, {
    correct: stageRun.correctFirstTry,
    total: stageRun.questions.length,
  });
  ui.resultStars.textContent = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
  ui.result.querySelectorAll('.ark-result-unlock').forEach(note => note.remove());
  ui.resultActions.replaceChildren();
  ui.resultActions.append(makeActionButton(t('restartLevel'), 'btn-secondary', () => startLevel(stageRun.level.id)));
  ui.resultActions.append(makeActionButton(staticText('backToLevels'), 'btn-primary', () => {
    stageRun = null;
    setScreen('home');
  }));
  if (nextLevel && levelRecord(stageRun.level.id).stars >= data.settings.unlockMinimumStars) {
    showResultUnlockMessage(t('levelUnlock'));
    ui.resultActions.append(makeActionButton(t('nextLevel'), 'btn-accent', () => startLevel(nextLevel.id)));
  } else if (nextLevel) {
    showResultUnlockMessage(t('locked'));
  }
  if (!nextLevel) {
    ui.resultTitle.textContent = t('allComplete');
  }
}

function showResultUnlockMessage(message) {
  const note = document.createElement('p');
  note.className = 'ark-result-unlock';
  note.textContent = message;
  ui.resultActions.before(note);
}

function renderParentReport() {
  ui.parentIntro.textContent = t('parentIntro');
  ui.recentDateLabel.textContent = t('recentDate');
  ui.recentDateValue.textContent = progress.lastPracticeDate || '—';
  ui.parentLevelScores.replaceChildren();
  data.levels.forEach((level, index) => {
    const entry = document.createElement('div');
    entry.className = 'ark-parent-level';
    entry.innerHTML = `<strong>${escapeHtml(interpolate(data.staticText.levelNumber, { number: index + 1 }))} · ${escapeHtml(text(level.title))}</strong><span>${'★'.repeat(levelRecord(level.id).stars)}${'☆'.repeat(3 - levelRecord(level.id).stars)}</span>`;
    ui.parentLevelScores.append(entry);
  });
  const mistakes = Object.values(progress.mistakes).sort((first, second) => second.count - first.count || first.label.localeCompare(second.label, locale() === 'zhCN' ? 'zh-CN' : 'zh-HK')).slice(0, 5);
  ui.mistakeList.replaceChildren();
  mistakes.forEach(item => {
    const li = document.createElement('li');
    const kind = item.kind === 'character' ? '字' : item.kind === 'animal'
      ? (locale() === 'zhCN' ? '动物名' : '動物名')
      : (locale() === 'zhCN' ? '题型' : '題型');
    li.textContent = `${item.label} · ${kind} · ${item.count}`;
    ui.mistakeList.append(li);
  });
  ui.noMistakes.hidden = mistakes.length > 0;
  ui.noMistakes.textContent = t('noMistakes');
  ui.clearProgress.textContent = t('clearProgress');
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
  ui.backToLevels.addEventListener('click', () => {
    stageRun = null;
    setScreen('home');
  });
  ui.backFromParents.addEventListener('click', () => setScreen('home'));
  ui.clearProgress.addEventListener('click', clearProgress);
  ui.playScene.addEventListener('pointerup', handleSheepPointerUp);
}

async function loadGame() {
  const [dataResponse, manifestResponse] = await Promise.all([
    fetch(DATA_URL, { cache: 'no-cache' }),
    fetch(VOICE_MANIFEST_URL, { cache: 'no-cache' }),
  ]);
  if (!dataResponse.ok) throw new Error(`Question data unavailable (${dataResponse.status})`);
  if (!manifestResponse.ok) throw new Error(`Voice manifest unavailable (${manifestResponse.status})`);
  data = await dataResponse.json();
  voiceManifest = await manifestResponse.json();
  progress = readProgress();
  installGlobalEvents();
  updateLanguageButtons();
  renderHome();
}

loadGame().catch(error => {
  const main = document.querySelector('main');
  const notice = document.createElement('p');
  notice.className = 'ark-load-error';
  notice.setAttribute('role', 'alert');
  notice.textContent = '遊戲資料暫時未能載入，請確認以本機靜態伺服器開啟。';
  main.replaceChildren(notice);
  console.error('Ark game initialization failed:', error.message);
});
