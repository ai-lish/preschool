'use strict';

const ALL_NUMBERS = Array.from({ length: 20 }, (_, i) => ({
  num: i + 1,
  chinese: ['一','二','三','四','五','六','七','八','九','十',
            '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'][i],
  english: ['one','two','three','four','five','six','seven','eight','nine','ten',
            'eleven','twelve','thirteen','fourteen','fifteen','sixteen',
            'seventeen','eighteen','nineteen','twenty'][i],
}));

const pageParams = new URLSearchParams(window.location.search);
const k2Focus = pageParams.get('focus') === 'k2';
const NUMBER_LIMIT = !k2Focus && pageParams.get('range') === '20' ? 20 : 10;
const NUMBERS = ALL_NUMBERS.slice(0, NUMBER_LIMIT);
const TEN_NUMBERS = ALL_NUMBERS.slice(0, 10);

const focusNote = document.getElementById('focusNote');
if (focusNote) {
  focusNote.textContent = NUMBER_LIMIT === 10
    ? '今天先玩 1 至 10，每次選一個小遊戲。'
    : '進階挑戰：一起認識 1 至 20。';
}

const COUNT_OBJECTS = [
  { key: 'apple', label: '蘋果' },
  { key: 'dog', label: '小狗' },
  { key: 'cat', label: '小貓' },
  { key: 'lion', label: '獅子' },
  { key: 'ice-cream', label: '雪糕' },
];

// ── Tabs ──
const tabBtns = document.querySelectorAll('.tab-btn');
const tabMap  = {
  cards: 'tab-cards',
  count: 'tab-count',
  order: 'tab-order',
  practice: 'tab-practice',
  write: 'tab-write',
  recognize: 'tab-recognize',
  read: 'tab-read',
};
const advancedTabs = new Set(['order', 'recognize', 'read']);
const moreActivitiesToggle = document.getElementById('moreActivitiesToggle');
const moreActivities = document.getElementById('moreActivities');

function setMoreActivitiesOpen(open) {
  if (!moreActivitiesToggle || !moreActivities) return;
  moreActivities.hidden = !open;
  moreActivitiesToggle.setAttribute('aria-expanded', String(open));
}

tabBtns.forEach(btn => {
  const panelId = tabMap[btn.dataset.tab];
  btn.setAttribute('aria-controls', panelId);
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    Object.values(tabMap).forEach(id => {
      const panel = document.getElementById(id);
      panel.style.display = 'none';
      panel.setAttribute('aria-hidden', 'true');
    });
    const activePanel = document.getElementById(tabMap[btn.dataset.tab]);
    activePanel.style.display = '';
    activePanel.setAttribute('aria-hidden', 'false');
    if (advancedTabs.has(btn.dataset.tab)) setMoreActivitiesOpen(true);
    playNumberEffect('tap');
    if (btn.dataset.tab === 'practice') newPracticeRound(true);
    if (btn.dataset.tab === 'recognize') newRecognitionRound(true);
  });
});

moreActivitiesToggle?.addEventListener('click', () => {
  setMoreActivitiesOpen(moreActivitiesToggle.getAttribute('aria-expanded') !== 'true');
  playNumberEffect('tap');
});

// ── MiniMax TTS ──
let activeCoreVoice = null;
let activeNumberEffects = new Set();
let numberBackgroundMusic = null;
let numberMusicPlaying = false;
const numberMedia = window.NUMBER_MEDIA_ASSETS || { images: {}, audio: {} };

function playCoreVoice(source) {
  if (activeCoreVoice) {
    activeCoreVoice.pause();
    activeCoreVoice.currentTime = 0;
  }
  if (!source) return;

  const audio = new Audio(source);
  activeCoreVoice = audio;
  const finish = () => {
    if (activeCoreVoice === audio) activeCoreVoice = null;
  };
  audio.addEventListener('ended', finish, { once: true });
  audio.addEventListener('error', finish, { once: true });
  audio.play().catch(finish);
}

function playNumberEffect(kind) {
  const source = numberMedia.audio && numberMedia.audio[kind];
  if (!source) return;

  activeNumberEffects.forEach(active => {
    active.pause();
    active.currentTime = 0;
  });
  activeNumberEffects.clear();

  const audio = new Audio(source);
  audio.volume = 0.55;
  activeNumberEffects.add(audio);
  const finish = () => activeNumberEffects.delete(audio);
  audio.addEventListener('ended', finish, { once: true });
  audio.addEventListener('error', finish, { once: true });
  audio.play().catch(finish);
}

function updateNumberMusicButton() {
  const button = document.getElementById('numberMusicToggle');
  if (!button) return;
  button.classList.toggle('playing', numberMusicPlaying);
  button.setAttribute('aria-pressed', String(numberMusicPlaying));
  button.setAttribute('aria-label', numberMusicPlaying ? '關閉背景音樂' : '開啟背景音樂');
  button.innerHTML = `
    <span class="music-note" aria-hidden="true">${numberMusicPlaying ? 'Ⅱ' : '♪'}</span>
    <span class="music-label">${numberMusicPlaying ? '音樂開' : '音樂'}</span>
  `;
}

function toggleNumberMusic() {
  const source = numberMedia.audio && numberMedia.audio.background;
  if (!source) return;
  if (!numberBackgroundMusic) {
    numberBackgroundMusic = new Audio(source);
    numberBackgroundMusic.loop = true;
    numberBackgroundMusic.volume = 0.18;
    numberBackgroundMusic.addEventListener('error', () => {
      numberBackgroundMusic = null;
      numberMusicPlaying = false;
      updateNumberMusicButton();
    }, { once: true });
  }

  if (numberMusicPlaying) {
    numberBackgroundMusic.pause();
    numberMusicPlaying = false;
    updateNumberMusicButton();
    return;
  }

  numberBackgroundMusic.play().then(() => {
    numberMusicPlaying = true;
    updateNumberMusicButton();
  }).catch(() => {
    numberMusicPlaying = false;
    updateNumberMusicButton();
  });
}

document.getElementById('numberMusicToggle').addEventListener('click', toggleNumberMusic);

function speakNumber(number) {
  const assets = window.CORE_VOICE_ASSETS || {};
  playCoreVoice(assets.numbers && assets.numbers[String(number)]);
}

// ── Number Cards ──
const numGrid = document.getElementById('numGrid');

function makeDots(n) {
  const shown = Math.min(n, 10);
  return Array.from({ length: shown }, () => '<span class="number-dot"></span>').join('');
}

NUMBERS.forEach(n => {
  const object = COUNT_OBJECTS[(n.num - 1) % COUNT_OBJECTS.length];
  const card = document.createElement('button');
  card.className = 'num-card';
  card.type = 'button';
  card.setAttribute('aria-label', `數字 ${n.num}，中文${n.chinese}，按下播放讀音`);
  card.innerHTML = `
    <img class="num-card-art" src="${numberMedia.images[object.key]}" alt="">
    <span class="num-card-main">
      <span class="num-big">${n.num}</span>
      <span class="num-zh">${n.chinese}</span>
    </span>
    <span class="num-dots" aria-hidden="true">${makeDots(n.num)}</span>
  `;
  card.addEventListener('click', () => {
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = 'pop 0.3s ease both';
    playNumberEffect('tap');
    speakNumber(n.num);
  });
  numGrid.appendChild(card);
});

// ── 1–10 Listening Practice ──
let practiceNumber = TEN_NUMBERS[0];
let practiceScore = 0;
let practiceLocked = false;
const practicePrompt = document.getElementById('practicePrompt');
const practiceListen = document.getElementById('practiceListen');
const practiceAnswers = document.getElementById('practiceAnswers');
const practiceFeedback = document.getElementById('practiceFeedback');
const practiceScoreEl = document.getElementById('practiceScore');

function newPracticeRound(announce = false) {
  practiceLocked = false;
  practiceNumber = TEN_NUMBERS[randInt(0, TEN_NUMBERS.length - 1)];
  practicePrompt.textContent = '聽清楚，再選一個數字。';
  practiceFeedback.textContent = '';
  practiceAnswers.innerHTML = '';

  choiceSet(practiceNumber, TEN_NUMBERS).forEach(item => {
    const button = document.createElement('button');
    button.className = 'number-answer';
    button.type = 'button';
    button.textContent = item.num;
    button.setAttribute('aria-label', `數字 ${item.num}`);
    button.addEventListener('click', () => {
      if (practiceLocked) return;
      if (item.num === practiceNumber.num) {
        practiceLocked = true;
        button.classList.add('correct');
        practiceScore++;
        practiceScoreEl.textContent = `完成 ${practiceScore} 題`;
        practiceFeedback.textContent = `對了！這是 ${item.num}。`;
        showCelebration();
        setTimeout(() => newPracticeRound(false), 1500);
      } else {
        button.classList.add('wrong');
        playNumberEffect('wrong');
        practiceFeedback.textContent = '沒關係，再聽一次。';
        setTimeout(() => button.classList.remove('wrong'), 600);
      }
    });
    practiceAnswers.appendChild(button);
  });

  if (announce) setTimeout(() => speakNumber(practiceNumber.num), 0);
}

practiceListen.addEventListener('click', () => speakNumber(practiceNumber.num));

// ── Chinese numeral recognition ──
let recognitionTarget = TEN_NUMBERS[0];
let recognitionScore = 0;
let recognitionLocked = false;
const recognizePrompt = document.getElementById('recognizePrompt');
const recognizeListen = document.getElementById('recognizeListen');
const recognizeAnswers = document.getElementById('recognizeAnswers');
const recognizeFeedback = document.getElementById('recognizeFeedback');
const recognizeScoreEl = document.getElementById('recognizeScore');

function newRecognitionRound(announce = false) {
  recognitionLocked = false;
  recognitionTarget = TEN_NUMBERS[randInt(0, TEN_NUMBERS.length - 1)];
  recognizePrompt.textContent = `數字 ${recognitionTarget.num} 是哪一個中文字？`;
  recognizeFeedback.textContent = '';
  recognizeAnswers.innerHTML = '';

  choiceSet(recognitionTarget, TEN_NUMBERS).forEach(item => {
    const button = document.createElement('button');
    button.className = 'number-answer hanzi-answer';
    button.type = 'button';
    button.textContent = item.chinese;
    button.setAttribute('aria-label', `${item.chinese}，數字 ${item.num}`);
    button.addEventListener('click', () => {
      if (recognitionLocked) return;
      if (item.num === recognitionTarget.num) {
        recognitionLocked = true;
        button.classList.add('correct');
        recognitionScore++;
        recognizeScoreEl.textContent = `完成 ${recognitionScore} 題`;
        recognizeFeedback.textContent = `對了！${item.num} 是「${item.chinese}」。`;
        showCelebration();
        setTimeout(() => newRecognitionRound(false), 1500);
      } else {
        button.classList.add('wrong');
        playNumberEffect('wrong');
        recognizeFeedback.textContent = '沒關係，再看一次。';
        setTimeout(() => button.classList.remove('wrong'), 600);
      }
    });
    recognizeAnswers.appendChild(button);
  });

  if (announce) setTimeout(() => speakNumber(recognitionTarget.num), 0);
}

recognizeListen.addEventListener('click', () => speakNumber(recognitionTarget.num));

// ── Chinese numeral reading ──
let readIndex = 0;
const readCharacter = document.getElementById('readCharacter');
const readArabic = document.getElementById('readArabic');
const readListen = document.getElementById('readListen');
const readNumberPicker = document.getElementById('readNumberPicker');

function selectReadNumber(index, announce = false) {
  readIndex = (index + TEN_NUMBERS.length) % TEN_NUMBERS.length;
  const item = TEN_NUMBERS[readIndex];
  readCharacter.textContent = item.chinese;
  readArabic.textContent = `數字 ${item.num}`;
  readListen.setAttribute('aria-label', `播放${item.chinese}的讀音`);
  [...readNumberPicker.children].forEach((button, buttonIndex) => {
    button.classList.toggle('active', buttonIndex === readIndex);
  });
  if (announce) {
    playNumberEffect('tap');
    speakNumber(item.num);
  }
}

TEN_NUMBERS.forEach((item, index) => {
  const button = document.createElement('button');
  button.className = 'read-number-chip';
  button.type = 'button';
  button.textContent = item.chinese;
  button.setAttribute('aria-label', `${item.chinese}，數字 ${item.num}`);
  button.addEventListener('click', () => selectReadNumber(index, true));
  readNumberPicker.appendChild(button);
});

readListen.addEventListener('click', () => speakNumber(TEN_NUMBERS[readIndex].num));
document.getElementById('readPrev').addEventListener('click', () => selectReadNumber(readIndex - 1, true));
document.getElementById('readNext').addEventListener('click', () => selectReadNumber(readIndex + 1, true));

// ── Chinese numeral writing ──
let currentWriteNumber = TEN_NUMBERS[0];
let writePointCount = 0;
let isWritingNumber = false;
const writeNumberPicker = document.getElementById('writeNumberPicker');
const writeGuideChar = document.getElementById('writeGuideChar');
const numberWriteCanvas = document.getElementById('numberWriteCanvas');
const numberWriteContext = numberWriteCanvas.getContext('2d');
const numberWriteFeedback = document.getElementById('numberWriteFeedback');

numberWriteContext.strokeStyle = '#6C5CE7';
numberWriteContext.lineWidth = 10;
numberWriteContext.lineCap = 'round';
numberWriteContext.lineJoin = 'round';

function writeCanvasPoint(event) {
  const rect = numberWriteCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (numberWriteCanvas.width / rect.width),
    y: (event.clientY - rect.top) * (numberWriteCanvas.height / rect.height),
  };
}

function beginNumberWriting(event) {
  event.preventDefault();
  isWritingNumber = true;
  writePointCount++;
  const point = writeCanvasPoint(event);
  numberWriteContext.beginPath();
  numberWriteContext.moveTo(point.x, point.y);
  numberWriteCanvas.setPointerCapture?.(event.pointerId);
}

function continueNumberWriting(event) {
  if (!isWritingNumber) return;
  event.preventDefault();
  const point = writeCanvasPoint(event);
  numberWriteContext.lineTo(point.x, point.y);
  numberWriteContext.stroke();
  writePointCount++;
}

function finishNumberWriting(event) {
  isWritingNumber = false;
  if (numberWriteCanvas.hasPointerCapture?.(event.pointerId)) {
    numberWriteCanvas.releasePointerCapture(event.pointerId);
  }
}

function clearNumberWriting() {
  numberWriteContext.clearRect(0, 0, numberWriteCanvas.width, numberWriteCanvas.height);
  writePointCount = 0;
  numberWriteFeedback.textContent = '沿著淡色字慢慢寫。';
}

function selectWriteNumber(index, announce = false) {
  currentWriteNumber = TEN_NUMBERS[index];
  writeGuideChar.textContent = currentWriteNumber.chinese;
  [...writeNumberPicker.children].forEach((button, buttonIndex) => {
    button.classList.toggle('active', buttonIndex === index);
  });
  clearNumberWriting();
  if (announce) {
    playNumberEffect('tap');
    speakNumber(currentWriteNumber.num);
  }
}

TEN_NUMBERS.forEach((item, index) => {
  const button = document.createElement('button');
  button.className = 'write-number-chip';
  button.type = 'button';
  button.textContent = item.chinese;
  button.setAttribute('aria-label', `選擇${item.chinese}，數字 ${item.num}`);
  button.addEventListener('click', () => selectWriteNumber(index, true));
  writeNumberPicker.appendChild(button);
});

numberWriteCanvas.addEventListener('pointerdown', beginNumberWriting);
numberWriteCanvas.addEventListener('pointermove', continueNumberWriting);
numberWriteCanvas.addEventListener('pointerup', finishNumberWriting);
numberWriteCanvas.addEventListener('pointercancel', finishNumberWriting);
document.getElementById('numberWriteClear').addEventListener('click', clearNumberWriting);
document.getElementById('numberWriteListen').addEventListener('click', () => speakNumber(currentWriteNumber.num));
document.getElementById('numberWriteDone').addEventListener('click', () => {
  if (writePointCount < 12) {
    numberWriteFeedback.textContent = '先沿著淡色字寫一次，再按完成。';
    return;
  }
  numberWriteFeedback.textContent = `完成！你寫了「${currentWriteNumber.chinese}」。`;
  showCelebration('完成！太棒了！', 'complete');
});

// ── Counting Game ──
let countScore = 0;
let countLocked = false;
const emojiStage   = document.getElementById('emojiStage');
const countAnswers = document.getElementById('countAnswers');
const countScoreEl = document.getElementById('countScore');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = randInt(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function choiceSet(target, pool, size = 3) {
  const alternatives = shuffle(pool.filter(item => item.num !== target.num)).slice(0, size - 1);
  return shuffle([target, ...alternatives]);
}

function newCountGame() {
  countLocked = false;
  const correct = randInt(1, 10);
  const object  = COUNT_OBJECTS[randInt(0, COUNT_OBJECTS.length - 1)];

  emojiStage.innerHTML = '';
  emojiStage.setAttribute('aria-label', `請數一數畫面中的${object.label}`);
  for (let i = 0; i < correct; i++) {
    const image = document.createElement('img');
    image.className = 'count-object';
    image.src = numberMedia.images && numberMedia.images[object.key];
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    emojiStage.appendChild(image);
  }

  // Three large choices reduce visual load for younger children.
  const wrongSet = new Set([correct]);
  const choices  = [correct];
  while (choices.length < 3) {
    const w = randInt(1, 10);
    if (!wrongSet.has(w)) { wrongSet.add(w); choices.push(w); }
  }
  countAnswers.innerHTML = '';
  shuffle(choices).forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'ans-btn';
    btn.type = 'button';
    btn.textContent = n;
    btn.setAttribute('aria-label', `選擇數字 ${n}`);
    btn.addEventListener('click', () => {
      if (countLocked) return;
      countLocked = true;
      if (n === correct) {
        btn.classList.add('correct');
        countScore++;
        countScoreEl.textContent = `完成 ${countScore} 題`;
        showCelebration();
        setTimeout(newCountGame, 1500);
      } else {
        btn.classList.add('wrong');
        playNumberEffect('wrong');
        btn.style.animation = 'shake 0.5s ease both';
        setTimeout(() => { btn.classList.remove('wrong'); btn.style.animation = ''; countLocked = false; }, 600);
      }
    });
    countAnswers.appendChild(btn);
  });
}

document.getElementById('countNext').addEventListener('click', newCountGame);
newCountGame();

// ── Order Game ──
let orderScore = 0;
let orderLocked = false;
const seqRow      = document.getElementById('seqRow');
const orderAnswers= document.getElementById('orderAnswers');
const orderScoreEl= document.getElementById('orderScore');

function newOrderGame() {
  orderLocked = false;
  const start   = randInt(1, NUMBER_LIMIT - 2);
  const blankIdx= 1;
  const sequence= [start, start + 1, start + 2];
  const correct = sequence[blankIdx];

  seqRow.innerHTML = '';
  sequence.forEach((n, i) => {
    if (i === blankIdx) {
      const blank = document.createElement('div');
      blank.className = 'seq-blank';
      blank.textContent = '?';
      seqRow.appendChild(blank);
    } else {
      const box = document.createElement('div');
      box.className = 'seq-num';
      box.textContent = n;
      seqRow.appendChild(box);
    }
  });

  const wrongSet = new Set([correct]);
  const choices  = [correct];
  while (choices.length < 3) {
    const w = randInt(1, NUMBER_LIMIT);
    if (!wrongSet.has(w)) { wrongSet.add(w); choices.push(w); }
  }

  orderAnswers.innerHTML = '';
  shuffle(choices).forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'ans-btn';
    btn.type = 'button';
    btn.textContent = n;
    btn.setAttribute('aria-label', `選擇數字 ${n}`);
    btn.addEventListener('click', () => {
      if (orderLocked) return;
      orderLocked = true;
      if (n === correct) {
        btn.classList.add('correct');
        // fill blank
        const blank = seqRow.querySelector('.seq-blank');
        if (blank) { blank.textContent = correct; blank.style.border = 'none'; blank.style.color = '#00B894'; }
        orderScore++;
        orderScoreEl.textContent = `完成 ${orderScore} 題`;
        showCelebration();
        setTimeout(newOrderGame, 1500);
      } else {
        btn.classList.add('wrong');
        playNumberEffect('wrong');
        btn.style.animation = 'shake 0.5s ease both';
        setTimeout(() => { btn.classList.remove('wrong'); btn.style.animation = ''; orderLocked = false; }, 600);
      }
    });
    orderAnswers.appendChild(btn);
  });
}

document.getElementById('orderNext').addEventListener('click', newOrderGame);
newOrderGame();

// Prepare the extra K2 panels without playing audio until the child interacts.
newPracticeRound(false);
newRecognitionRound(false);
selectReadNumber(0);
selectWriteNumber(0);

Object.entries(tabMap).forEach(([tabName, panelId]) => {
  document.getElementById(panelId).setAttribute('aria-hidden', String(tabName !== 'cards'));
});

const initialTab = pageParams.get('tab');
if (initialTab && tabMap[initialTab]) {
  document.querySelector(`[data-tab="${initialTab}"]`)?.click();
}

// ── Celebration ──
function showCelebration(message = '好棒！正確！', effect = 'correct') {
  const overlay = document.createElement('div');
  overlay.className = 'celebrate-overlay';
  overlay.setAttribute('role', 'status');
  overlay.innerHTML = `
    <img class="celebrate-image" src="${numberMedia.images.lion}" alt="開心的小獅子">
    <div class="celebrate-text">${message}</div>
  `;
  document.body.appendChild(overlay);
  playNumberEffect(effect);
  setTimeout(() => overlay.remove(), 1500);
}
