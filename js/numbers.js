'use strict';

const NUMBERS = Array.from({ length: 20 }, (_, i) => ({
  num: i + 1,
  chinese: ['一','二','三','四','五','六','七','八','九','十',
            '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'][i],
  english: ['one','two','three','four','five','six','seven','eight','nine','ten',
            'eleven','twelve','thirteen','fourteen','fifteen','sixteen',
            'seventeen','eighteen','nineteen','twenty'][i],
}));

const COUNT_EMOJIS = ['🍎','🍊','🍋','🍇','🍓','🌟','🐶','🐱','🦁','🐸',
                      '🍕','🎈','🚗','⚽','🎀','🏀','🌸','🦋','🍦','🍩'];

// ── Tabs ──
const tabBtns = document.querySelectorAll('.tab-btn');
const tabMap  = { cards: 'tab-cards', count: 'tab-count', order: 'tab-order' };

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(tabMap).forEach(id => {
      document.getElementById(id).style.display = 'none';
    });
    document.getElementById(tabMap[btn.dataset.tab]).style.display = '';
  });
});

// ── TTS ──
function speak(text, lang = 'zh-TW') {
  if (!window.speechSynthesis) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

// ── Number Cards ──
const numGrid = document.getElementById('numGrid');

function makeDots(n) {
  // max 10 dots shown
  const shown = Math.min(n, 10);
  return '●'.repeat(shown) + (n > 10 ? `+${n - 10}` : '');
}

NUMBERS.forEach(n => {
  const card = document.createElement('div');
  card.className = 'num-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.innerHTML = `
    <div class="num-big">${n.num}</div>
    <div class="num-dots">${makeDots(n.num)}</div>
    <div class="num-zh">${n.chinese}</div>
    <div class="num-en">${n.english}</div>
  `;
  card.addEventListener('click', () => {
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = 'pop 0.3s ease both';
    speak(n.chinese + '，' + n.num, 'zh-TW');
  });
  numGrid.appendChild(card);
});

// ── Counting Game ──
let countScore = 0;
let countLocked = false;
const emojiStage   = document.getElementById('emojiStage');
const countAnswers = document.getElementById('countAnswers');
const countScoreEl = document.getElementById('countScore');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function newCountGame() {
  countLocked = false;
  const correct = randInt(1, 10);
  const emoji   = COUNT_EMOJIS[randInt(0, COUNT_EMOJIS.length - 1)];

  emojiStage.innerHTML = '';
  for (let i = 0; i < correct; i++) {
    const span = document.createElement('span');
    span.textContent = emoji;
    emojiStage.appendChild(span);
  }

  // 4 choices: correct + 3 wrong
  const wrongSet = new Set([correct]);
  const choices  = [correct];
  while (choices.length < 4) {
    const w = randInt(1, 10);
    if (!wrongSet.has(w)) { wrongSet.add(w); choices.push(w); }
  }
  shuffle(choices);

  countAnswers.innerHTML = '';
  shuffle(choices).forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'ans-btn';
    btn.textContent = n;
    btn.addEventListener('click', () => {
      if (countLocked) return;
      countLocked = true;
      if (n === correct) {
        btn.classList.add('correct');
        countScore++;
        countScoreEl.textContent = `⭐ 分數: ${countScore}`;
        showCelebration();
        setTimeout(newCountGame, 1800);
      } else {
        btn.classList.add('wrong');
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
  const start   = randInt(1, 16);
  const blankIdx= randInt(0, 4);
  const sequence= [start, start+1, start+2, start+3, start+4];
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
  while (choices.length < 4) {
    const w = randInt(1, 20);
    if (!wrongSet.has(w)) { wrongSet.add(w); choices.push(w); }
  }

  orderAnswers.innerHTML = '';
  shuffle(choices).forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'ans-btn';
    btn.textContent = n;
    btn.addEventListener('click', () => {
      if (orderLocked) return;
      orderLocked = true;
      if (n === correct) {
        btn.classList.add('correct');
        // fill blank
        const blank = seqRow.querySelector('.seq-blank');
        if (blank) { blank.textContent = correct; blank.style.border = 'none'; blank.style.color = '#00B894'; }
        orderScore++;
        orderScoreEl.textContent = `⭐ 分數: ${orderScore}`;
        showCelebration();
        setTimeout(newOrderGame, 1800);
      } else {
        btn.classList.add('wrong');
        btn.style.animation = 'shake 0.5s ease both';
        setTimeout(() => { btn.classList.remove('wrong'); btn.style.animation = ''; orderLocked = false; }, 600);
      }
    });
    orderAnswers.appendChild(btn);
  });
}

document.getElementById('orderNext').addEventListener('click', newOrderGame);
newOrderGame();

// ── Celebration ──
function showCelebration() {
  const overlay = document.createElement('div');
  overlay.className = 'celebrate-overlay';
  overlay.innerHTML = `
    <div class="celebrate-content">⭐🎉⭐</div>
    <div class="celebrate-text">好棒！正確！</div>
  `;
  document.body.appendChild(overlay);
  speak('好棒，答對了！', 'zh-TW');
  setTimeout(() => overlay.remove(), 1500);
}
