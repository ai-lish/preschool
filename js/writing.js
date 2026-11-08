'use strict';

const WRITING_CHARS = [
  { char: '一', pinyin: 'yī',   meaning: 'one',       strokes: 1 },
  { char: '二', pinyin: 'èr',   meaning: 'two',       strokes: 2 },
  { char: '三', pinyin: 'sān',  meaning: 'three',     strokes: 3 },
  { char: '四', pinyin: 'sì',   meaning: 'four',      strokes: 5 },
  { char: '五', pinyin: 'wǔ',   meaning: 'five',      strokes: 4 },
  { char: '人', pinyin: 'rén',  meaning: 'person',    strokes: 2 },
  { char: '大', pinyin: 'dà',   meaning: 'big',       strokes: 3 },
  { char: '小', pinyin: 'xiǎo', meaning: 'small',     strokes: 3 },
  { char: '日', pinyin: 'rì',   meaning: 'sun / day', strokes: 4 },
  { char: '月', pinyin: 'yuè',  meaning: 'moon / month', strokes: 4 },
];

// ── DOM refs ──
const charGrid   = document.getElementById('charGrid');
const detailCard = document.getElementById('detailCard');
const placeholder= document.getElementById('placeholder');
const bigChar    = document.getElementById('bigChar');
const charPinyin = document.getElementById('charPinyin');
const charMeaning= document.getElementById('charMeaning');
const charStrokes= document.getElementById('charStrokes');
const ttsZhBtn   = document.getElementById('ttsZh');
const ttsEnBtn   = document.getElementById('ttsEn');
const clearBtn   = document.getElementById('clearBtn');
const undoBtn    = document.getElementById('undoBtn');
const canvas     = document.getElementById('drawCanvas');
const ctx        = canvas.getContext('2d');

let currentChar = null;
let drawing = false;
let strokes = []; // array of stroke arrays for undo

// ── Build character grid ──
WRITING_CHARS.forEach((c, i) => {
  const chip = document.createElement('button');
  chip.className = 'char-chip';
  chip.textContent = c.char;
  chip.setAttribute('aria-label', c.char + ' ' + c.meaning);
  chip.addEventListener('click', () => selectChar(i, chip));
  charGrid.appendChild(chip);
});

function selectChar(index, chip) {
  // deselect previous
  document.querySelectorAll('.char-chip').forEach(el => el.classList.remove('active'));
  chip.classList.add('active');

  currentChar = WRITING_CHARS[index];
  bigChar.textContent    = currentChar.char;
  charPinyin.textContent = currentChar.pinyin;
  charMeaning.textContent= currentChar.meaning;
  charStrokes.textContent= `${currentChar.strokes} 筆劃`;

  detailCard.classList.add('visible');
  placeholder.style.display = 'none';

  clearCanvas();
  speakZh(currentChar.char);
}

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

function speakZh(character) { speakCharacter(character, 'zh'); }
function speakEn(character) { speakCharacter(character, 'en'); }

ttsZhBtn.addEventListener('click', () => { if (currentChar) speakZh(currentChar.char); });
ttsEnBtn.addEventListener('click', () => { if (currentChar) speakEn(currentChar.char); });

// ── Canvas drawing ──
function getPos(e) {
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

let currentStroke = [];

function startDraw(e) {
  e.preventDefault();
  drawing = true;
  currentStroke = [];
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  currentStroke.push(pos);
}

function drawMove(e) {
  if (!drawing) return;
  e.preventDefault();
  const pos = getPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = '#6C5CE7';
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  currentStroke.push(pos);
}

function endDraw(e) {
  if (!drawing) return;
  drawing = false;
  if (currentStroke.length > 0) {
    strokes.push(currentStroke);
  }
}

canvas.addEventListener('mousedown',  startDraw);
canvas.addEventListener('mousemove',  drawMove);
canvas.addEventListener('mouseup',    endDraw);
canvas.addEventListener('mouseleave', endDraw);
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove',  drawMove,  { passive: false });
canvas.addEventListener('touchend',   endDraw,   { passive: false });

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = [];
}

function redrawStrokes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(stroke => {
    if (stroke.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.strokeStyle = '#6C5CE7';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  });
}

clearBtn.addEventListener('click', clearCanvas);
undoBtn.addEventListener('click', () => {
  strokes.pop();
  redrawStrokes();
});
