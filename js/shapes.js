'use strict';

const SHAPES = [
  { id: 'circle',    zh: '圓形',   en: 'Circle',    color: '#FF7675', example: '🔴 球、蘋果' },
  { id: 'triangle',  zh: '三角形', en: 'Triangle',  color: '#74B9FF', example: '🔺 山' },
  { id: 'square',    zh: '正方形', en: 'Square',    color: '#55EFC4', example: '⬛ 積木' },
  { id: 'rectangle', zh: '長方形', en: 'Rectangle', color: '#FDCB6E', example: '📺 電視' },
  { id: 'oval',      zh: '橢圓形', en: 'Oval',      color: '#A29BFE', example: '🥚 雞蛋' },
];

// ── SVG helpers ──
function svgForShape(id, color, w = 80, h = 80) {
  const s = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">`;
  const svgs = {
    circle:    `${s}<circle cx="50" cy="50" r="45" fill="${color}"/></svg>`,
    triangle:  `${s}<polygon points="50,8 95,90 5,90" fill="${color}"/></svg>`,
    square:    `${s}<rect x="8" y="8" width="84" height="84" rx="6" fill="${color}"/></svg>`,
    rectangle: `${s}<rect x="5" y="25" width="90" height="50" rx="6" fill="${color}"/></svg>`,
    oval:      `${s}<ellipse cx="50" cy="50" rx="46" ry="30" fill="${color}"/></svg>`,
  };
  return svgs[id] || '';
}

// ── Tabs ──
const tabBtns = document.querySelectorAll('.tab-btn');
const tabMap  = { learn: 'tab-learn', match: 'tab-match', find: 'tab-find' };
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(tabMap).forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById(tabMap[btn.dataset.tab]).style.display = '';
  });
});

// ── TTS ──
function speak(text, lang = 'zh-TW') {
  if (!window.speechSynthesis) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang; utt.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

// ── Celebration ──
function showCelebration(msg = '好棒！正確！') {
  const overlay = document.createElement('div');
  overlay.className = 'celebrate-overlay';
  overlay.innerHTML = `<div class="celebrate-content">⭐🎉⭐</div><div class="celebrate-text">${msg}</div>`;
  document.body.appendChild(overlay);
  speak(msg, 'zh-TW');
  setTimeout(() => overlay.remove(), 1500);
}

// ── Learn Shapes ──
const shapeLearnGrid = document.getElementById('shapeLearnGrid');
SHAPES.forEach(s => {
  const card = document.createElement('div');
  card.className = 'shape-card';
  card.innerHTML = `
    <div class="shape-svg-wrap">${svgForShape(s.id, s.color)}</div>
    <div class="shape-zh" style="color:${s.color}">${s.zh}</div>
    <div class="shape-en">${s.en}</div>
    <div class="shape-example">${s.example}</div>
  `;
  card.addEventListener('click', () => {
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = 'wobble 0.4s ease';
    speak(s.zh + '，' + s.en, 'zh-TW');
  });
  shapeLearnGrid.appendChild(card);
});

// ── Matching Game ──
const matchShapesEl = document.getElementById('matchShapes');
const matchLabelsEl = document.getElementById('matchLabels');
const matchScoreEl  = document.getElementById('matchScore');
let matchSelected = null;
let matchPaired   = 0;

function initMatchGame() {
  matchSelected = null;
  matchPaired   = 0;
  matchScoreEl.textContent = '配對: 0 / 5';
  matchShapesEl.innerHTML  = '';
  matchLabelsEl.innerHTML  = '';

  const shuffledShapes  = [...SHAPES].sort(() => Math.random() - 0.5);
  const shuffledLabels  = [...SHAPES].sort(() => Math.random() - 0.5);

  shuffledShapes.forEach(s => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.id   = s.id;
    card.dataset.role = 'shape';
    card.innerHTML = `<div class="shape-svg-wrap" style="width:60px;height:60px;">${svgForShape(s.id, s.color)}</div>`;
    card.addEventListener('click', () => handleMatchClick(card));
    matchShapesEl.appendChild(card);
  });

  shuffledLabels.forEach(s => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.id   = s.id;
    card.dataset.role = 'label';
    card.innerHTML = `<div class="match-label" style="color:${s.color}">${s.zh}</div><div style="font-size:0.7rem;color:#aaa">${s.en}</div>`;
    card.addEventListener('click', () => handleMatchClick(card));
    matchLabelsEl.appendChild(card);
  });
}

function handleMatchClick(card) {
  if (card.classList.contains('matched')) return;

  if (!matchSelected) {
    matchSelected = card;
    card.classList.add('selected');
    return;
  }

  if (matchSelected === card) {
    matchSelected.classList.remove('selected');
    matchSelected = null;
    return;
  }

  // Two cards selected — check if one shape + one label, same id
  const bothDiff = matchSelected.dataset.role !== card.dataset.role;
  const sameId   = matchSelected.dataset.id   === card.dataset.id;

  if (bothDiff && sameId) {
    matchSelected.classList.remove('selected');
    matchSelected.classList.add('matched');
    card.classList.add('matched');
    matchPaired++;
    matchScoreEl.textContent = `配對: ${matchPaired} / 5`;
    if (matchPaired === 5) setTimeout(() => showCelebration('全部配對！太棒了！'), 400);
    matchSelected = null;
  } else {
    // wrong pair
    const prev = matchSelected;
    matchSelected = null;
    [prev, card].forEach(c => {
      c.classList.remove('selected');
      c.classList.add('wrong-flash');
      setTimeout(() => c.classList.remove('wrong-flash'), 600);
    });
  }
}

document.getElementById('matchReset').addEventListener('click', initMatchGame);
initMatchGame();

// ── Find Shape Game ──
const findPromptEl = document.getElementById('findPrompt');
const sceneSvgEl   = document.getElementById('sceneSvg');
let findTarget = null;
let findLocked  = false;

const SCENE_ITEMS = [
  // each item: id, x, y, w, h
  { id: 'circle',    x: 30,  y: 30,  w: 70,  h: 70 },
  { id: 'triangle',  x: 140, y: 20,  w: 90,  h: 80 },
  { id: 'square',    x: 260, y: 30,  w: 80,  h: 80 },
  { id: 'rectangle', x: 30,  y: 140, w: 110, h: 70 },
  { id: 'oval',      x: 190, y: 150, w: 130, h: 70 },
];

function newFindGame() {
  findLocked = false;
  findTarget = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  findPromptEl.textContent = `🔍 找一個${findTarget.zh}！`;
  speak(`找一個${findTarget.zh}`, 'zh-TW');

  // build SVG scene 400x250
  let svgContent = `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="250" fill="#f0f4ff" rx="16"/>`;

  SCENE_ITEMS.forEach(item => {
    const shape = SHAPES.find(s => s.id === item.id);
    const isTarget = item.id === findTarget.id;
    let shapeEl = '';
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;

    switch (item.id) {
      case 'circle':
        shapeEl = `<circle cx="${cx}" cy="${cy}" r="${item.w/2}" fill="${shape.color}"/>`;
        break;
      case 'triangle':
        shapeEl = `<polygon points="${cx},${item.y} ${item.x+item.w},${item.y+item.h} ${item.x},${item.y+item.h}" fill="${shape.color}"/>`;
        break;
      case 'square':
        shapeEl = `<rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="6" fill="${shape.color}"/>`;
        break;
      case 'rectangle':
        shapeEl = `<rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="6" fill="${shape.color}"/>`;
        break;
      case 'oval':
        shapeEl = `<ellipse cx="${cx}" cy="${cy}" rx="${item.w/2}" ry="${item.h/2}" fill="${shape.color}"/>`;
        break;
    }
    svgContent += `<g class="scene-shape-btn" data-id="${item.id}" style="cursor:pointer" tabindex="0" role="button" aria-label="${shape.zh}">${shapeEl}</g>`;
  });

  svgContent += '</svg>';
  sceneSvgEl.innerHTML = svgContent;

  // attach click handlers
  sceneSvgEl.querySelectorAll('.scene-shape-btn').forEach(el => {
    el.addEventListener('click', () => {
      if (findLocked) return;
      if (el.dataset.id === findTarget.id) {
        findLocked = true;
        el.style.filter = 'drop-shadow(0 0 8px gold)';
        showCelebration(`找到了！是${findTarget.zh}！`);
        setTimeout(newFindGame, 2000);
      } else {
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => { el.style.animation = ''; }, 500);
      }
    });
  });
}

document.getElementById('findNext').addEventListener('click', newFindGame);
newFindGame();
