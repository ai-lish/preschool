'use strict';

const CHARACTERS = [
  { char: '日', pinyin: 'rì',   meaning: 'sun/day',     emoji: '☀️', zh: '太陽' },
  { char: '月', pinyin: 'yuè',  meaning: 'moon',        emoji: '🌙', zh: '月亮' },
  { char: '水', pinyin: 'shuǐ', meaning: 'water',       emoji: '💧', zh: '水' },
  { char: '火', pinyin: 'huǒ',  meaning: 'fire',        emoji: '🔥', zh: '火' },
  { char: '山', pinyin: 'shān', meaning: 'mountain',    emoji: '⛰️', zh: '山' },
  { char: '木', pinyin: 'mù',   meaning: 'tree/wood',   emoji: '🌳', zh: '樹木' },
  { char: '人', pinyin: 'rén',  meaning: 'person',      emoji: '👤', zh: '人' },
  { char: '口', pinyin: 'kǒu',  meaning: 'mouth',       emoji: '👄', zh: '口' },
  { char: '天', pinyin: 'tiān', meaning: 'sky/day',     emoji: '🌤️', zh: '天空' },
  { char: '地', pinyin: 'dì',   meaning: 'earth/ground',emoji: '🌍', zh: '大地' },
  { char: '大', pinyin: 'dà',   meaning: 'big',         emoji: '🐘', zh: '大' },
  { char: '小', pinyin: 'xiǎo', meaning: 'small',       emoji: '🐭', zh: '小' },
  { char: '上', pinyin: 'shàng',meaning: 'up/above',    emoji: '⬆️', zh: '上' },
  { char: '下', pinyin: 'xià',  meaning: 'down/below',  emoji: '⬇️', zh: '下' },
  { char: '左', pinyin: 'zuǒ',  meaning: 'left',        emoji: '👈', zh: '左' },
  { char: '右', pinyin: 'yòu',  meaning: 'right',       emoji: '👉', zh: '右' },
];

// ── Tabs ──
const tabBtns = document.querySelectorAll('.tab-btn');
const tabMap  = { flash: 'tab-flash', imatch: 'tab-imatch', stroke: 'tab-stroke' };
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(tabMap).forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById(tabMap[btn.dataset.tab]).style.display = '';
  });
});

// ── MiniMax TTS ──
let activeCoreVoice = null;

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

function speakCharacter(character, language = 'zh') {
  const assets = window.CORE_VOICE_ASSETS || {};
  const item = assets.characters && assets.characters[character];
  playCoreVoice(item && item[language === 'en' ? 'en' : 'zh']);
}

function speakFeedback(kind = 'correct') {
  const assets = window.CORE_VOICE_ASSETS || {};
  playCoreVoice(assets.feedback && assets.feedback[kind]);
}

// ── Celebration ──
function showCelebration(msg = '好棒！正確！') {
  const overlay = document.createElement('div');
  overlay.className = 'celebrate-overlay';
  overlay.innerHTML = `<div class="celebrate-content">⭐🎉⭐</div><div class="celebrate-text">${msg}</div>`;
  document.body.appendChild(overlay);
  speakFeedback(msg === '全部配對！太棒了！' ? 'matchComplete' : 'correct');
  setTimeout(() => overlay.remove(), 1500);
}

// ════════════════════════════════════════
// FLASHCARDS
// ════════════════════════════════════════
let fcIndex  = 0;
let fcFlipped= false;
const fcInner   = document.getElementById('fcInner');
const fcFront   = document.getElementById('fcFront');
const fcBack    = document.getElementById('fcBack');
const fcCounter = document.getElementById('fcCounter');

function renderFlashcard() {
  const c = CHARACTERS[fcIndex];
  fcFlipped = false;
  fcInner.classList.remove('flipped');
  fcFront.innerHTML = `
    <div class="fc-char">${c.char}</div>
    <div class="fc-emoji">${c.emoji}</div>
    <div class="fc-hint">點擊翻面</div>
  `;
  fcBack.innerHTML = `
    <div class="fc-emoji">${c.emoji}</div>
    <div class="fc-pinyin">${c.pinyin}</div>
    <div class="fc-meaning">${c.meaning}</div>
    <div class="fc-zh">${c.zh}</div>
    <div class="fc-hint">點擊翻回</div>
  `;
  fcCounter.textContent = `${fcIndex + 1} / ${CHARACTERS.length}`;
}

fcInner.addEventListener('click', () => {
  fcFlipped = !fcFlipped;
  fcInner.classList.toggle('flipped', fcFlipped);
  if (!fcFlipped) speakCharacter(CHARACTERS[fcIndex].char, 'zh');
  else speakCharacter(CHARACTERS[fcIndex].char, 'en');
});

document.getElementById('fcPrev').addEventListener('click', () => {
  fcIndex = (fcIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
  renderFlashcard();
});
document.getElementById('fcNext').addEventListener('click', () => {
  fcIndex = (fcIndex + 1) % CHARACTERS.length;
  renderFlashcard();
});
document.getElementById('fcTts').addEventListener('click', () => {
  speakCharacter(CHARACTERS[fcIndex].char, 'zh');
});

renderFlashcard();

// ════════════════════════════════════════
// IMAGE MATCH
// ════════════════════════════════════════
const imatchCharsEl  = document.getElementById('imatchChars');
const imatchImagesEl = document.getElementById('imatchImages');
const imatchScoreEl  = document.getElementById('imatchScore');
let imSelected = null;
let imPaired   = 0;
const IM_COUNT = 4;

function initImatch() {
  imSelected = null;
  imPaired   = 0;
  imatchScoreEl.textContent = `配對: 0 / ${IM_COUNT}`;
  imatchCharsEl.innerHTML   = '';
  imatchImagesEl.innerHTML  = '';

  const pool    = [...CHARACTERS].sort(() => Math.random() - 0.5).slice(0, IM_COUNT);
  const shChars = [...pool].sort(() => Math.random() - 0.5);
  const shImgs  = [...pool].sort(() => Math.random() - 0.5);

  shChars.forEach(c => {
    const card = document.createElement('div');
    card.className = 'imatch-card';
    card.dataset.id   = c.char;
    card.dataset.role = 'char';
    card.innerHTML = `<div class="imatch-char">${c.char}</div><div class="imatch-hint">${c.pinyin}</div>`;
    card.addEventListener('click', () => handleImatch(card));
    imatchCharsEl.appendChild(card);
  });

  shImgs.forEach(c => {
    const card = document.createElement('div');
    card.className = 'imatch-card';
    card.dataset.id   = c.char;
    card.dataset.role = 'image';
    card.innerHTML = `<div class="imatch-emoji">${c.emoji}</div><div class="imatch-hint">${c.zh}</div>`;
    card.addEventListener('click', () => handleImatch(card));
    imatchImagesEl.appendChild(card);
  });
}

function handleImatch(card) {
  if (card.classList.contains('matched')) return;

  if (!imSelected) {
    imSelected = card;
    card.classList.add('selected');
    return;
  }
  if (imSelected === card) {
    imSelected.classList.remove('selected');
    imSelected = null;
    return;
  }

  const bothDiff = imSelected.dataset.role !== card.dataset.role;
  const sameId   = imSelected.dataset.id   === card.dataset.id;

  if (bothDiff && sameId) {
    imSelected.classList.remove('selected');
    [imSelected, card].forEach(c => c.classList.add('matched'));
    imPaired++;
    imatchScoreEl.textContent = `配對: ${imPaired} / ${IM_COUNT}`;
    imSelected = null;
    const matched = CHARACTERS.find(c => c.char === card.dataset.id);
    if (matched) speakCharacter(matched.char, 'zh');
    if (imPaired === IM_COUNT) setTimeout(() => showCelebration('全部配對！太棒了！'), 400);
  } else {
    const prev = imSelected;
    imSelected = null;
    [prev, card].forEach(c => {
      c.classList.remove('selected');
      c.classList.add('wrong-flash');
      setTimeout(() => c.classList.remove('wrong-flash'), 600);
    });
  }
}

document.getElementById('imatchReset').addEventListener('click', initImatch);
initImatch();

// ════════════════════════════════════════
// STROKE PRACTICE
// ════════════════════════════════════════
const strokeChipGrid = document.getElementById('strokeChipGrid');
const strokeCanvas   = document.getElementById('strokeCanvas');
const sctx           = strokeCanvas.getContext('2d');
const guideChar      = document.getElementById('guideChar');
let strokeChar       = null;
let sDrawing         = false;
let sStrokes         = [];
let sCurrent         = [];

CHARACTERS.forEach(c => {
  const chip = document.createElement('button');
  chip.className = 'stroke-chip';
  chip.textContent = c.char;
  chip.setAttribute('aria-label', c.char);
  chip.addEventListener('click', () => selectStrokeChar(c, chip));
  strokeChipGrid.appendChild(chip);
});

function selectStrokeChar(c, chip) {
  document.querySelectorAll('.stroke-chip').forEach(el => el.classList.remove('active'));
  chip.classList.add('active');
  strokeChar = c;
  guideChar.textContent = c.char;
  clearStroke();
  speakCharacter(c.char, 'zh');
}

function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  if (e.touches && e.touches.length > 0) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top)  * scaleY,
    };
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
  };
}

function sApplyStrokeStyle() {
  sctx.strokeStyle = '#6C5CE7';
  sctx.lineWidth = 18;
  sctx.lineCap = 'round';
  sctx.lineJoin = 'round';
}

function sDrawTo(p) {
  sctx.lineTo(p.x, p.y);
  sApplyStrokeStyle();
  sctx.stroke();
  sctx.beginPath();
  sctx.moveTo(p.x, p.y);
  sCurrent.push(p);
}

strokeCanvas.addEventListener('mousedown',  e => { sDrawing=true; sCurrent=[]; const p=getPos(e,strokeCanvas); sctx.beginPath(); sctx.moveTo(p.x,p.y); sCurrent.push(p); });
strokeCanvas.addEventListener('mousemove',  e => { if(!sDrawing)return; sDrawTo(getPos(e,strokeCanvas)); });
strokeCanvas.addEventListener('mouseup',    () => { if(sDrawing&&sCurrent.length>0)sStrokes.push(sCurrent); sDrawing=false; });
strokeCanvas.addEventListener('mouseleave', () => { if(sDrawing&&sCurrent.length>0)sStrokes.push(sCurrent); sDrawing=false; });
strokeCanvas.addEventListener('touchstart', e => { e.preventDefault(); sDrawing=true; sCurrent=[]; const p=getPos(e,strokeCanvas); sctx.beginPath(); sctx.moveTo(p.x,p.y); sCurrent.push(p); }, { passive:false });
strokeCanvas.addEventListener('touchmove',  e => { if(!sDrawing)return; e.preventDefault(); sDrawTo(getPos(e,strokeCanvas)); }, { passive:false });
strokeCanvas.addEventListener('touchend',   e => { if(sDrawing&&sCurrent.length>0)sStrokes.push(sCurrent); sDrawing=false; }, { passive:false });

function clearStroke() {
  sctx.clearRect(0, 0, strokeCanvas.width, strokeCanvas.height);
  sStrokes = [];
}
function redrawStroke() {
  sctx.clearRect(0, 0, strokeCanvas.width, strokeCanvas.height);
  sStrokes.forEach(stroke => {
    if (!stroke.length) return;
    sctx.beginPath();
    sctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) sctx.lineTo(stroke[i].x, stroke[i].y);
    sctx.strokeStyle = '#6C5CE7';
    sctx.lineWidth = 18;
    sctx.lineCap = 'round';
    sctx.lineJoin = 'round';
    sctx.stroke();
  });
}

document.getElementById('strokeClear').addEventListener('click', clearStroke);
document.getElementById('strokeUndo').addEventListener('click', () => { sStrokes.pop(); redrawStroke(); });
document.getElementById('strokeTts').addEventListener('click', () => { if (strokeChar) speakCharacter(strokeChar.char, 'zh'); });

// Select first character by default
if (strokeChipGrid.firstChild) strokeChipGrid.firstChild.click();
