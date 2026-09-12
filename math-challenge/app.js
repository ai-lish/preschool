'use strict';

const DATA_URL = 'data/timo_questions.json';
const STORAGE_KEY = 'preschool_timo_progress_v1';

const state = {
  questions: [],
  sources: [],
  filtered: [],
  current: null,
  answered: new Set(),
  correct: new Set(),
  completedReview: new Set(),
};

const els = {
  yearFilter: document.getElementById('yearFilter'),
  topicFilter: document.getElementById('topicFilter'),
  poolCount: document.getElementById('poolCount'),
  correctCount: document.getElementById('correctCount'),
  masteryCount: document.getElementById('masteryCount'),
  shuffleButton: document.getElementById('shuffleButton'),
  questionPrompt: document.getElementById('questionPrompt'),
  yearBadge: document.getElementById('yearBadge'),
  topicBadge: document.getElementById('topicBadge'),
  questionNumber: document.getElementById('questionNumber'),
  sourcePage: document.getElementById('sourcePage'),
  progressBar: document.getElementById('progressBar'),
  reviewBadge: document.getElementById('reviewBadge'),
  visual: document.getElementById('visual'),
  originalPrompt: document.getElementById('originalPrompt'),
  answerChoices: document.getElementById('answerChoices'),
  feedback: document.getElementById('feedback'),
  nextButton: document.getElementById('nextButton'),
  sourceList: document.getElementById('sourceList'),
  resetProgress: document.getElementById('resetProgress'),
};

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state.answered = new Set(saved.answered || []);
    state.correct = new Set(saved.correct || []);
    state.completedReview = new Set(saved.completedReview || []);
  } catch {
    state.answered = new Set();
    state.correct = new Set();
    state.completedReview = new Set();
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    answered: Array.from(state.answered),
    correct: Array.from(state.correct),
    completedReview: Array.from(state.completedReview),
  }));
}

function shuffle(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function updateTopicOptions() {
  const selected = els.topicFilter.value;
  const topics = Array.from(new Set(state.questions
    .filter(question => els.yearFilter.value === 'all' || question.year === els.yearFilter.value)
    .map(question => question.topic)))
    .sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  els.topicFilter.innerHTML = '<option value="all">全部範圍</option>';
  topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    els.topicFilter.appendChild(option);
  });
  els.topicFilter.value = topics.includes(selected) ? selected : 'all';
}

function updatePool() {
  state.filtered = state.questions.filter(question => {
    const yearMatch = els.yearFilter.value === 'all' || question.year === els.yearFilter.value;
    const topicMatch = els.topicFilter.value === 'all' || question.topic === els.topicFilter.value;
    return yearMatch && topicMatch;
  });
  els.poolCount.textContent = state.filtered.length;
  renderStats();
}

function renderStats() {
  const scorable = state.filtered.filter(question => question.status !== 'review');
  const completed = scorable.filter(question => state.answered.has(question.id)).length;
  const correct = scorable.filter(question => state.correct.has(question.id)).length;
  const percent = scorable.length ? Math.round((completed / scorable.length) * 100) : 0;
  els.correctCount.textContent = correct;
  els.masteryCount.textContent = percent + '%';
}

function completionPercent() {
  const scorable = state.filtered.filter(question => question.status !== 'review');
  const completed = scorable.filter(question => state.answered.has(question.id)).length;
  return scorable.length ? Math.round((completed / scorable.length) * 100) : 0;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character]));
}

const FIGURE_CAPTION = '按原題圖重畫';

function points(list) {
  return list.map(point => point.join(',')).join(' ');
}

function poly(list, className) {
  return '<polygon' + (className ? ' class="' + className + '"' : '') + ' points="' + points(list) + '"/>';
}

function circle(cx, cy, r, className) {
  return '<circle' + (className ? ' class="' + className + '"' : '') + ' cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>';
}

function rect(x, y, width, height) {
  return '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '"/>';
}

function figure(viewBox, body, label) {
  return '<figure class="figure"><svg class="figure-svg" viewBox="' + viewBox + '" role="img" aria-label="' +
    escapeHtml(label) + '">' + body + '</svg><figcaption class="visual-caption">' + FIGURE_CAPTION + '</figcaption></figure>';
}

function sequenceFigure(symbols) {
  return '<figure class="figure"><div class="sequence-visual">' + Array.from(symbols).map(symbol =>
    symbol === '?' ? '<span class="blank">?</span>' : '<span>' + symbol + '</span>'
  ).join('') + '</div><figcaption class="visual-caption">' + FIGURE_CAPTION + '</figcaption></figure>';
}

// Oblique cubes: [col, row, level], row 0 is the front row.
function cubesFigure(cubes, label) {
  const size = 60;
  const dx = 22;
  const dy = -21;
  const xs = [];
  const ys = [];
  const body = cubes.slice()
    .sort((a, b) => b[1] - a[1] || a[2] - b[2] || a[0] - b[0])
    .map(([col, row, level]) => {
      const x = col * size + row * dx;
      const bottom = row * dy - level * size;
      const top = bottom - size;
      xs.push(x, x + size + dx);
      ys.push(top + dy, bottom);
      return poly([[x, top], [x + size, top], [x + size + dx, top + dy], [x + dx, top + dy]]) +
        poly([[x + size, top], [x + size + dx, top + dy], [x + size + dx, bottom + dy], [x + size, bottom]], 'shade') +
        rect(x, top, size, size);
    }).join('');
  const minX = Math.min(...xs) - 3;
  const minY = Math.min(...ys) - 3;
  return figure([minX, minY, Math.max(...xs) - minX + 3, Math.max(...ys) - minY + 3].join(' '), body, label);
}

function balancesFigure() {
  const square = (x, y) => rect(x, y, 22, 22);
  const triangle = (x, y) => poly([[x, y + 22], [x + 13, y], [x + 26, y + 22]]);
  const balance = (offset, contents) => '<g transform="translate(' + offset + ',0)">' +
    '<path class="line" d="M0,70 Q0,82 12,82 L78,82 Q90,82 90,70 M110,70 Q110,82 122,82 L188,82 Q200,82 200,70 M45,82 V90 H155 V82"/>' +
    poly([[100, 90], [90, 108], [110, 108]]) + contents + '</g>';
  const body = balance(0, circle(34, 49, 11) + circle(56, 49, 11) + circle(34, 71, 11) + circle(56, 71, 11) +
      square(132, 60) + square(156, 60)) +
    balance(240, triangle(20, 60) + triangle(48, 60) +
      circle(144, 71, 11) + circle(166, 71, 11) + circle(155, 52, 11));
  return figure('-4 30 448 82', body, '兩個平衡的天平：4 個圓形對 2 個正方形；2 個三角形對 3 個圓形');
}

// Groups of grid cells: [col, rowFromBottom, hasMark].
function groupsFigure(groups, label) {
  const cell = 22;
  let x = 0;
  let tallest = 0;
  const body = groups.map((cells, index) => {
    const cols = Math.max(...cells.map(item => item[0])) + 1;
    const slot = Math.max(cols * cell, 46);
    const left = x + (slot - cols * cell) / 2;
    tallest = Math.max(tallest, ...cells.map(item => item[1] + 1));
    const part = cells.map(([col, row, mark]) => {
      const cx = left + col * cell;
      const cy = -(row + 1) * cell;
      const half = cell / 2;
      return rect(cx, cy, cell, cell) + (mark
        ? circle(cx + half, cy + half, 6.5) + '<path class="line" d="M' + (cx + 4.5) + ',' + (cy + half) + ' H' + (cx + cell - 4.5) +
          ' M' + (cx + half) + ',' + (cy + 4.5) + ' V' + (cy + cell - 4.5) + '"/>'
        : '');
    }).join('') + '<text x="' + (x + slot / 2) + '" y="18" text-anchor="middle">第 ' + (index + 1) + ' 組</text>';
    x += slot + 16;
    return part;
  }).join('');
  return figure('-3 ' + (-tallest * cell - 3) + ' ' + (x - 10) + ' ' + (tallest * cell + 26), body, label);
}

function squareGroups(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    const cells = [];
    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        const rowFromTop = n - 1 - row;
        cells.push([col, row, n < count && col < n - rowFromTop]);
      }
    }
    return cells;
  });
}

function stairGroups(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    const cells = [];
    for (let col = 0; col < n; col += 1) {
      for (let row = 0; row <= col; row += 1) cells.push([col, row, row === col || (col === n - 1 && row === 0)]);
    }
    return cells;
  });
}

const FIGURES = {
  'sequence-2021': () => sequenceFigure('■▲★■▲★■▲★?▲★■▲…'),
  'sequence-2022': () => sequenceFigure('■▲●★■▲?★■▲●★■▲●★…'),
  balances: balancesFigure,
  'symbol-groups-2021': () => groupsFigure(squareGroups(4), '第 1 至 3 組的 ⊕ 排成樓梯，第 4 組是空白的 4 乘 4 方格'),
  'symbol-groups-2022': () => groupsFigure(stairGroups(4), '第 1 至 4 組的樓梯方格，⊕ 在斜邊及右下角'),
  'cubes-2021': () => cubesFigure([[0, 0, 0], [0, 1, 0], [0, 1, 1], [2, 1, 0], [0, 2, 0], [1, 2, 0], [2, 2, 0]], '立方體堆疊圖'),
  'cubes-2022': () => cubesFigure([[0, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0], [2, 1, 0], [1, 1, 1]], '立方體堆疊圖'),
  'squares-2022': () => figure('-3 -3 126 166',
    [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1], [1, 2], [1, 3], [2, 3]].map(([col, row]) => rect(col * 40, row * 40, 40, 40)).join(''),
    '由 8 個小正方形組成的圖形'),
  'parallelograms-2022': () => figure('30 30 1270 730',
    '<path d="M82,185 A122,122 0 1,1 280,305 Z"/>' +
    '<path d="M48,378 L78,368 Q150,398 200,338 L220,322 Q205,400 130,418 Q75,420 48,378 Z"/>' +
    poly([[570, 52], [863, 135], [655, 503], [362, 420]]) + circle(700, 183, 64) +
    poly([[432, 348], [570, 236], [713, 348], [575, 460]]) +
    circle(1093, 192, 135) + poly([[1102, 88], [1145, 212], [1032, 282]]) +
    poly([[800, 432], [885, 365], [971, 435], [886, 502]]) +
    poly([[75, 485], [313, 440], [268, 742]]) + circle(218, 538, 52) +
    poly([[370, 590], [505, 512], [587, 650], [452, 728]]) +
    poly([[572, 545], [650, 545], [815, 665], [815, 722]]) +
    poly([[1097, 357], [1278, 680], [920, 685]]) + poly([[1015, 620], [1062, 560], [1152, 540], [1193, 575]]),
    '多個圖形，包括圓形、三角形和不同的四邊形'),
  'rectangle-2022': () => figure('0 0 260 50', rect(10, 10, 240, 30), '長方形'),
  'segments-2022': () => figure('40 5 310 375',
    poly([[80, 35], [315, 125], [70, 345]]) + '<path class="line" d="M80,35 L190,237"/>' +
    circle(80, 35, 11, 'dot') + circle(315, 125, 11, 'dot') + circle(70, 345, 11, 'dot') + circle(75, 190, 11, 'dot'),
    '三角形，左邊中間有一點，頂點連一條線到右邊斜邊'),
  'triangles-2021': () => '<div class="shape-count-visual">' + '<span>▲</span>'.repeat(6) + '</div>',
  'triangles-2022': () => '<div class="shape-count-visual">' + '<span>▲</span>'.repeat(10) + '</div>',
};

function renderVisual(type) {
  const draw = type && FIGURES[type];
  els.visual.hidden = !draw;
  els.visual.innerHTML = draw ? draw() : '';
}

function chooseNextQuestion(preferUnanswered) {
  if (!state.filtered.length) {
    state.current = null;
    els.questionPrompt.textContent = '這個範圍暫時沒有題目。';
    els.answerChoices.innerHTML = '';
    els.feedback.textContent = '';
    return;
  }
  const unanswered = state.filtered.filter(question => !state.answered.has(question.id));
  const pool = preferUnanswered !== false && unanswered.length ? unanswered : state.filtered;
  state.current = shuffle(pool)[0];
  renderQuestion();
}

function renderQuestion() {
  const question = state.current;
  if (!question) return;
  els.yearBadge.textContent = question.year;
  els.topicBadge.textContent = question.topic;
  els.questionNumber.textContent = '第 ' + question.number + ' 題';
  els.sourcePage.textContent = 'PDF 第 ' + question.sourcePage + ' 頁';
  els.questionPrompt.textContent = question.prompt;
  els.originalPrompt.textContent = question.original;
  els.reviewBadge.hidden = question.status !== 'review';
  els.feedback.textContent = '';
  els.feedback.className = 'feedback';
  els.nextButton.hidden = true;
  renderVisual(question.visual);
  els.progressBar.style.width = completionPercent() + '%';
  els.answerChoices.innerHTML = '';
  shuffle(question.choices).forEach(choice => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.textContent = choice;
    button.addEventListener('click', () => answerQuestion(choice, button));
    els.answerChoices.appendChild(button);
  });
}

function answerQuestion(choice, clickedButton) {
  const question = state.current;
  if (!question) return;
  const buttons = Array.from(els.answerChoices.querySelectorAll('button'));
  buttons.forEach(button => { button.disabled = true; });
  const isCorrect = String(choice) === String(question.answer);
  clickedButton.classList.add(isCorrect ? 'correct' : 'wrong');
  state.answered.add(question.id);
  if (question.status === 'review') {
    state.completedReview.add(question.id);
    els.feedback.className = 'feedback review';
    els.feedback.textContent = '完成練習！這題的答案仍待按原圖覆核，所以不計入完成率。';
  } else if (isCorrect) {
    state.correct.add(question.id);
    els.feedback.className = 'feedback good';
    els.feedback.textContent = '答對了！' + question.explanation;
  } else {
    els.feedback.className = 'feedback bad';
    els.feedback.textContent = '再想一想。答案是「' + question.answer + '」。' + question.explanation;
    const answerButton = buttons.find(button => String(button.textContent) === String(question.answer));
    if (answerButton) answerButton.classList.add('correct');
  }
  saveProgress();
  renderStats();
  els.progressBar.style.width = completionPercent() + '%';
  els.nextButton.hidden = false;
}

function renderSources() {
  els.sourceList.innerHTML = state.sources.map(source =>
    '<div class="source-item"><strong>' + escapeHtml(source.year) + '</strong><span>' +
    escapeHtml(source.note) + '</span><a href="' + escapeHtml(source.url) +
    '" target="_blank" rel="noopener">開啟 Drive PDF ↗</a></div>'
  ).join('');
}

async function init() {
  loadProgress();
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    state.questions = data.questions || [];
    state.sources = data.sources || [];
    renderSources();
    updateTopicOptions();
    updatePool();
    chooseNextQuestion(true);
  } catch (error) {
    els.questionPrompt.textContent = '題庫未能載入，請重新整理頁面。';
    els.feedback.textContent = error.message;
  }
}

els.yearFilter.addEventListener('change', () => {
  updateTopicOptions();
  updatePool();
  chooseNextQuestion(true);
});
els.topicFilter.addEventListener('change', () => {
  updatePool();
  chooseNextQuestion(true);
});
els.shuffleButton.addEventListener('click', () => chooseNextQuestion(false));
els.nextButton.addEventListener('click', () => chooseNextQuestion(true));
els.resetProgress.addEventListener('click', () => {
  if (!window.confirm('要清除這部裝置上的 TIMO 練習進度嗎？')) return;
  state.answered.clear();
  state.correct.clear();
  state.completedReview.clear();
  saveProgress();
  renderStats();
  chooseNextQuestion(true);
});

init();
