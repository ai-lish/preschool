'use strict';

const COPYBOOK_DATA_URL = 'data/ark-k2.json';
const COPYBOOK_KEY = 'preschool-ark-k2-v1';
const copybookUi = {
  wordList: document.getElementById('copybookWordList'),
  canvas: document.getElementById('copybookCanvas'),
  title: document.getElementById('practiceTitle'),
  model: document.getElementById('copybookModelGlyph'),
  date: document.getElementById('copybookDateLabel'),
  feedback: document.getElementById('copybookFeedback'),
  currentStroke: document.getElementById('copybookCurrentStroke'),
  attempt: document.getElementById('copybookAttemptLabel'),
  strokeStrip: document.getElementById('copybookStrokeStrip'),
  hint: document.getElementById('copybookStrokeHint'),
  tip: document.getElementById('copybookTipText'),
  demo: document.getElementById('copybookDemo'),
  retry: document.getElementById('copybookRetry'),
  printScope: document.getElementById('copybookPrintScope'),
  printButton: document.getElementById('copybookPrintButton'),
  printPages: document.getElementById('copybookPrintPages'),
};
const context = copybookUi.canvas.getContext('2d');
let data;
let progress;
let language = 'zhHK';
let activeSetId = 'zhongwenbu';
let activeItem = null;
let activeCharacter = null;
let practiceAttempt = 0;
let strokeIndex = 0;
let completedStrokes = [];
let activePointer = null;
let demoInProgress = false;
let finished = false;

function localized(value) {
  if (value && typeof value === 'object') return value[language] || value.zhHK || '';
  return value == null ? '' : String(value);
}

function hongKongDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Hong_Kong',
  }).formatToParts(new Date());
  const values = {};
  parts.forEach(part => { if (part.type !== 'literal') values[part.type] = part.value; });
  return values.year + '-' + values.month + '-' + values.day;
}

function todayItem() {
  const items = data.copybook.sets.find(set => set.id === 'zhongwenbu').items;
  return items.filter(item => item.date <= hongKongDate()).sort((a, b) => b.date.localeCompare(a.date))[0] || items[0];
}

function activeSet() {
  return data.copybook.sets.find(set => set.id === activeSetId) || data.copybook.sets[0];
}

function resolveItem(item) {
  if (item.characterId) return data.characters.find(character => character.id === item.characterId);
  return item;
}

function hkFormatDate(date) {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return language === 'zhCN' ? month + '月' + day + '日' : month + '月' + day + '日';
}

function readProgress() {
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(COPYBOOK_KEY) || 'null'); } catch (error) { stored = null; }
  progress = ArkK2Progress.migrateProgress(stored, 'zhHK');
  language = progress.language === 'zhCN' ? 'zhCN' : 'zhHK';
  persistProgress();
}

function persistProgress() {
  try { localStorage.setItem(COPYBOOK_KEY, JSON.stringify(progress)); } catch (error) { /* Local-only progress can remain unavailable in private browsing. */ }
}

function updateLanguageButtons() {
  document.documentElement.lang = language === 'zhCN' ? 'zh-CN' : 'zh-HK';
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  document.querySelectorAll('[data-set]').forEach(button => {
    const set = data.copybook.sets.find(item => item.id === button.dataset.set);
    button.setAttribute('aria-pressed', String(button.dataset.set === activeSetId));
    if (set) button.textContent = localized(set.title);
  });
  document.querySelector('.copybook-header h1').textContent = language === 'zhCN' ? '练字簿' : '練字簿';
  document.querySelector('.copybook-header .site-subtitle').textContent = language === 'zhCN' ? '慢慢写，一笔一笔来' : '慢慢寫，一筆一筆來';
  document.getElementById('copybookTipHeading').textContent = language === 'zhCN' ? '家长小提示' : '家長小提示';
  copybookUi.demo.textContent = language === 'zhCN' ? '看示范' : '睇示範';
  copybookUi.retry.textContent = language === 'zhCN' ? '重试这一笔' : '重試這一筆';
  document.querySelector('.copybook-print-card label').textContent = language === 'zhCN' ? '打印内容' : '列印內容';
  copybookUi.printScope.options[0].textContent = language === 'zhCN' ? '本周字' : '本週字';
  copybookUi.printScope.options[1].textContent = language === 'zhCN' ? '全组' : '全組';
  copybookUi.printButton.textContent = language === 'zhCN' ? '打印练字簿' : '列印練字簿';
  document.getElementById('copybookCompletionNote').textContent = language === 'zhCN'
    ? '完成屏幕练习只作本机记录，不计分、不加星。'
    : '完成螢幕練習只作本機紀錄，不計分、不加星。';
  document.title = (language === 'zhCN' ? '练字簿 — K2 升小准备' : '練字簿 — K2 升小準備');
}

function setActive(item, setId) {
  activeSetId = setId || activeSetId;
  activeItem = item;
  activeCharacter = resolveItem(item);
  if (!activeCharacter) return;
  practiceAttempt = 0;
  strokeIndex = 0;
  completedStrokes = [];
  finished = false;
  drawWordList();
  renderPractice();
}

function drawWordList() {
  copybookUi.wordList.replaceChildren();
  const week = todayItem();
  activeSet().items.forEach(item => {
    const character = resolveItem(item);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copybook-word-button';
    button.setAttribute('aria-pressed', String(activeItem && item.id === activeItem.id));
    const glyph = document.createElement('span');
    glyph.className = 'copybook-word-char';
    glyph.textContent = item.char;
    button.append(glyph);
    if (activeSetId === 'zhongwenbu') {
      const date = document.createElement('small');
      date.className = 'copybook-word-date';
      date.textContent = hkFormatDate(item.date);
      button.append(date);
      if (item.date === week.date) {
        const badge = document.createElement('span');
        badge.className = 'copybook-word-badge';
        badge.textContent = language === 'zhCN' ? '本周' : '本週';
        button.append(badge);
      } else if (item.date > hongKongDate()) {
        const badge = document.createElement('span');
        badge.className = 'copybook-word-badge';
        badge.textContent = language === 'zhCN' ? '未教' : '未教';
        button.append(badge);
      }
    }
    button.addEventListener('click', () => setActive(item, activeSetId));
    copybookUi.wordList.append(button);
  });
}

function strokeLabel(stroke) {
  const name = localized(stroke.name);
  return language === 'zhCN' ? name.replace('橫', '横').replace('豎', '竖').replace('撇', '撇').replace('捺', '捺').replace('點', '点').replace('鈎', '钩').replace('折', '折') : name;
}

function drawStrokeStrip() {
  copybookUi.strokeStrip.replaceChildren();
  copybookUi.retry.hidden = finished || strokeIndex >= activeCharacter.strokes.length;
  activeCharacter.strokes.forEach((stroke, index) => {
    const step = document.createElement('span');
    step.className = 'copybook-stroke-step';
    if (completedStrokes.includes(index)) step.classList.add('is-done');
    else if (index === strokeIndex && !finished) step.classList.add('is-current');
    step.textContent = (index + 1) + ' · ' + strokeLabel(stroke);
    copybookUi.strokeStrip.append(step);
  });
  if (finished) {
    copybookUi.currentStroke.textContent = language === 'zhCN' ? '完成啦！' : '完成喇！';
    copybookUi.attempt.textContent = language === 'zhCN' ? '4 次练习完成' : '4 次練習完成';
    copybookUi.hint.textContent = localized(data.copybook.practice.praise);
  } else if (strokeIndex >= activeCharacter.strokes.length) {
    copybookUi.currentStroke.textContent = language === 'zhCN' ? '这一遍完成啦！' : '呢一遍完成喇！';
    copybookUi.attempt.textContent = language === 'zhCN' ? '准备下一遍' : '準備下一遍';
    copybookUi.hint.textContent = '';
  } else {
    copybookUi.currentStroke.textContent = (language === 'zhCN' ? '第 ' : '第 ') + (strokeIndex + 1) + (language === 'zhCN' ? ' 笔：' : ' 筆：') + strokeLabel(activeCharacter.strokes[strokeIndex]);
    const trace = practiceAttempt < data.copybook.practice.traceAttempts;
    copybookUi.attempt.textContent = trace
      ? (language === 'zhCN' ? '描红 ' : '描紅 ') + (practiceAttempt + 1) + '／' + data.copybook.practice.traceAttempts
      : (language === 'zhCN' ? '自己写 ' : '自己寫 ') + (practiceAttempt - data.copybook.practice.traceAttempts + 1) + '／' + data.copybook.practice.independentAttempts;
    copybookUi.hint.textContent = strokeDirectionHint(activeCharacter.strokes[strokeIndex]);
  }
}

function pathDirection(stroke) {
  const points = stroke.points || [];
  if (points.length < 2) return '';
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last[0] - first[0];
  const dy = last[1] - first[1];
  if (points.length > 2 && points[1][0] > first[0] && points[points.length - 1][1] > points[1][1] && Math.abs(points[1][1] - first[1]) < 25 && Math.abs(points[points.length - 1][0] - points[1][0]) < 25) return 'fold';
  if (Math.abs(dy) < Math.abs(dx) * 0.25) return dx >= 0 ? 'right' : 'left';
  if (Math.abs(dx) < Math.abs(dy) * 0.25) return dy >= 0 ? 'down' : 'up';
  if (dx < 0 && dy > 0) return 'leftDown';
  if (dx > 0 && dy > 0) return 'rightDown';
  if (dx > 0 && dy < 0) return 'rightUp';
  return 'guide';
}

function strokeDirectionHint(stroke) {
  const words = language === 'zhCN'
    ? { start: '从绿点落笔，', right: '向右拉。', down: '向下写。', leftDown: '向左下方拉。', rightDown: '向右下方拉。', rightUp: '向右上方提。', fold: '向右写到角位，不要提笔，再向下。', up: '向上写。', left: '向左拉。', guide: '照着绿点和箭头方向慢慢写。' }
    : { start: '由綠點落筆，', right: '向右拉。', down: '向下寫。', leftDown: '向左下方拉。', rightDown: '向右下方拉。', rightUp: '向右上方提。', fold: '向右寫到角位，唔好提筆，再向下。', up: '向上寫。', left: '向左拉。', guide: '跟住綠點同箭咀方向慢慢寫。' };
  const direction = pathDirection(stroke);
  return words.start + words[direction];
}

function strokePoints(stroke) {
  return stroke.points.map(point => [Number(point[0]), Number(point[1])]);
}

function drawGrid() {
  context.clearRect(0, 0, 1000, 1000);
  context.fillStyle = '#fffdf9';
  context.fillRect(0, 0, 1000, 1000);
  context.strokeStyle = '#cdbfa8';
  context.lineWidth = 5;
  context.setLineDash([]);
  context.strokeRect(4, 4, 992, 992);
  context.lineWidth = 3;
  context.setLineDash([16, 15]);
  context.beginPath();
  context.moveTo(500, 0); context.lineTo(500, 1000);
  context.moveTo(0, 500); context.lineTo(1000, 500);
  context.moveTo(0, 0); context.lineTo(1000, 1000);
  context.moveTo(1000, 0); context.lineTo(0, 1000);
  context.stroke();
  context.setLineDash([]);
}

function drawPath(points, color, width, dashed) {
  if (!points || !points.length) return;
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(point => context.lineTo(point[0], point[1]));
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.setLineDash(dashed ? [20, 16] : []);
  context.stroke();
  context.setLineDash([]);
}

function drawArrow(points) {
  if (points.length < 2) return;
  const end = points[points.length - 1];
  const before = points[points.length - 2];
  const angle = Math.atan2(end[1] - before[1], end[0] - before[0]);
  const size = 34;
  context.beginPath();
  context.moveTo(end[0], end[1]);
  context.lineTo(end[0] - size * Math.cos(angle - Math.PI / 6), end[1] - size * Math.sin(angle - Math.PI / 6));
  context.moveTo(end[0], end[1]);
  context.lineTo(end[0] - size * Math.cos(angle + Math.PI / 6), end[1] - size * Math.sin(angle + Math.PI / 6));
  context.strokeStyle = '#278d73';
  context.lineWidth = 12;
  context.lineCap = 'round';
  context.stroke();
}

function drawCanvas(inputPath) {
  drawGrid();
  const tracing = practiceAttempt < data.copybook.practice.traceAttempts;
  if (tracing) activeCharacter.strokes.forEach(stroke => drawPath(strokePoints(stroke), '#dedede', 46, false));
  completedStrokes.forEach(index => drawPath(strokePoints(activeCharacter.strokes[index]), '#28816b', 34, false));
  if (!finished && practiceAttempt < data.copybook.practice.traceAttempts && strokeIndex < activeCharacter.strokes.length) {
    const target = strokePoints(activeCharacter.strokes[strokeIndex]);
    if (tracing) drawPath(target, '#f1a393', 42, false);
    const start = target[0];
    context.beginPath();
    context.arc(start[0], start[1], 30, 0, Math.PI * 2);
    context.fillStyle = '#61bd6b';
    context.fill();
    context.fillStyle = '#fff';
    context.font = 'bold 28px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(strokeIndex + 1), start[0], start[1]);
    drawArrow(target);
  }
  if (inputPath && inputPath.length > 1) drawPath(inputPath, '#0b5e58', 34, false);
}

function renderPractice() {
  if (!activeCharacter) return;
  const exerciseWord = language === 'zhCN' ? '练习' : '練習';
  copybookUi.title.textContent = exerciseWord + '「' + (localized(activeCharacter.label) || activeCharacter.char) + '」';
  copybookUi.model.textContent = activeCharacter.char;
  const isChineseSet = activeSetId === 'zhongwenbu';
  const dateText = isChineseSet ? hkFormatDate(activeItem.date) : '';
  const status = isChineseSet && activeItem.date > hongKongDate() ? (language === 'zhCN' ? ' · 未教' : ' · 未教') : '';
  copybookUi.date.textContent = dateText + status;
  copybookUi.tip.textContent = localized(data.copybook.prompts.general) + (['kou', 'ri'].includes(activeItem.id) ? '；' + localized(data.copybook.prompts.horizontalFold) : '');
  copybookUi.feedback.classList.remove('is-retry');
  copybookUi.feedback.textContent = localized(data.copybook.practice.retry);
  drawStrokeStrip();
  drawCanvas();
}

function pointFromEvent(event) {
  const rect = copybookUi.canvas.getBoundingClientRect();
  return [Math.max(0, Math.min(1000, (event.clientX - rect.left) / rect.width * 1000)), Math.max(0, Math.min(1000, (event.clientY - rect.top) / rect.height * 1000))];
}

function finishPracticeAttempt() {
  practiceAttempt += 1;
  if (practiceAttempt >= data.copybook.practice.traceAttempts + data.copybook.practice.independentAttempts) {
    finished = true;
    completedStrokes = activeCharacter.strokes.map((_, index) => index);
    const day = hongKongDate();
    ArkK2Progress.recordCopybookCompletion(progress, activeItem.id, day);
    progress.lastPracticeDate = day;
    persistProgress();
    copybookUi.feedback.classList.remove('is-retry');
    copybookUi.feedback.textContent = localized(data.copybook.practice.praise);
  } else {
    strokeIndex = 0;
    completedStrokes = [];
    copybookUi.feedback.classList.remove('is-retry');
    copybookUi.feedback.textContent = practiceAttempt < data.copybook.practice.traceAttempts
      ? (language === 'zhCN' ? '再描一次，慢慢来。' : '再描一次，慢慢嚟。')
      : (language === 'zhCN' ? '现在自己写，照着刚才的顺序。' : '而家自己寫，跟住頭先嘅次序。');
  }
  drawStrokeStrip();
  drawCanvas();
}

function pointerDown(event) {
  if (finished || demoInProgress || activePointer !== null) return;
  activePointer = event.pointerId;
  copybookUi.canvas.setPointerCapture(event.pointerId);
  copybookUi.canvas.dataset.stroke = JSON.stringify([pointFromEvent(event)]);
  drawCanvas(JSON.parse(copybookUi.canvas.dataset.stroke));
}

function pointerMove(event) {
  if (activePointer !== event.pointerId) return;
  const path = JSON.parse(copybookUi.canvas.dataset.stroke || '[]');
  path.push(pointFromEvent(event));
  copybookUi.canvas.dataset.stroke = JSON.stringify(path);
  drawCanvas(path);
}

function pointerUp(event) {
  if (activePointer !== event.pointerId) return;
  activePointer = null;
  const path = JSON.parse(copybookUi.canvas.dataset.stroke || '[]');
  copybookUi.canvas.dataset.stroke = '';
  const target = strokePoints(activeCharacter.strokes[strokeIndex]);
  if (ArkK2Strokes.followsStroke(path, target)) {
    completedStrokes.push(strokeIndex);
    strokeIndex += 1;
    copybookUi.feedback.classList.remove('is-retry');
    copybookUi.feedback.textContent = strokeIndex >= activeCharacter.strokes.length
      ? (language === 'zhCN' ? '这一遍完成啦！' : '呢一遍完成喇！')
      : (language === 'zhCN' ? '对了，继续下一笔。' : '啱喇，繼續下一筆。');
    if (strokeIndex >= activeCharacter.strokes.length) {
      drawStrokeStrip();
      drawCanvas();
      window.setTimeout(finishPracticeAttempt, 450);
      return;
    }
  } else {
    copybookUi.feedback.classList.add('is-retry');
    copybookUi.feedback.textContent = localized(data.copybook.practice.retry);
  }
  drawStrokeStrip();
  drawCanvas();
}

function resetCurrentStroke() {
  copybookUi.canvas.dataset.stroke = '';
  activePointer = null;
  drawCanvas();
}

async function demoStroke(index) {
  if (index >= activeCharacter.strokes.length) {
    demoInProgress = false;
    drawCanvas();
    return;
  }
  const points = strokePoints(activeCharacter.strokes[index]);
  const steps = 24;
  let frame = 0;
  const animate = () => {
    frame += 1;
    const current = points.map((point, pointIndex) => {
      if (pointIndex === 0) return point;
      const previous = points[pointIndex - 1];
      const segmentLength = Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      const preceding = points.slice(0, pointIndex).reduce((sum, item, i) => i === 0 ? sum : sum + Math.hypot(item[0] - points[i - 1][0], item[1] - points[i - 1][1]), 0);
      const total = points.slice(1).reduce((sum, item, i) => sum + Math.hypot(item[0] - points[i][0], item[1] - points[i][1]), 0) || 1;
      const allowed = Math.max(0, Math.min(segmentLength, (frame / steps * total) - preceding));
      return [previous[0] + (point[0] - previous[0]) * allowed / (segmentLength || 1), previous[1] + (point[1] - previous[1]) * allowed / (segmentLength || 1)];
    });
    drawCanvas();
    drawPath(current, '#e45c4f', 42, false);
    if (frame < steps) requestAnimationFrame(animate);
    else window.setTimeout(() => demoStroke(index + 1), 180);
  };
  requestAnimationFrame(animate);
}

function playDemo() {
  if (demoInProgress) return;
  demoInProgress = true;
  drawCanvas();
  demoStroke(0);
}

function buildPrintPage(item) {
  const character = resolveItem(item);
  const page = document.createElement('article');
  page.className = 'copybook-print-page';
  const lines = document.createElement('div');
  lines.className = 'copybook-print-lines';
  ['日期：____________', '姓名：____________'].forEach(value => {
    const field = document.createElement('span');
    field.textContent = value;
    lines.append(field);
  });
  const top = document.createElement('div');
  top.className = 'copybook-print-top';
  const model = document.createElement('div');
  model.className = 'copybook-print-model';
  model.textContent = item.char;
  const title = document.createElement('div');
  title.className = 'copybook-print-title';
  title.textContent = item.char + (language === 'zhCN' ? '　笔顺' : '　筆順');
  const strip = document.createElement('div');
  strip.className = 'copybook-print-strokes';
  character.strokes.forEach((stroke, index) => {
    const step = document.createElement('span');
    step.textContent = (index + 1) + ' ' + strokeLabel(stroke);
    strip.append(step);
  });
  title.append(strip);
  top.append(model, title);
  const grid = document.createElement('div');
  grid.className = 'copybook-practice-grid';
  for (let row = 0; row < 5; row += 1) {
    if (row === 1 || row === 3) {
      for (let column = 0; column < 5; column += 1) {
        const spacer = document.createElement('span');
        spacer.className = 'copybook-practice-cell is-spacer' + (column === 0 ? ' is-instruction' : '');
        if (column === 0) spacer.dataset.printInstruction = language === 'zhCN' ? '请隔行书写' : '請隔行書寫';
        grid.append(spacer);
      }
      continue;
    }
    for (let column = 0; column < 5; column += 1) {
      const cell = document.createElement('span');
      cell.className = 'copybook-practice-cell';
      if (column === 0) {
        cell.classList.add('is-model');
        cell.textContent = item.char;
      } else if (column === 1 || column === 2) {
        cell.classList.add('is-trace');
        cell.textContent = item.char;
      }
      grid.append(cell);
    }
  }
  page.append(lines, top, grid);
  return page;
}

function printWorkbook() {
  copybookUi.printPages.replaceChildren();
  const chosen = copybookUi.printScope.value === 'all'
    ? activeSet().items
    : [todayItem()];
  chosen.forEach(item => copybookUi.printPages.append(buildPrintPage(item)));
  document.body.classList.add('printing');
  window.setTimeout(() => window.print(), 50);
}

window.addEventListener('afterprint', () => document.body.classList.remove('printing'));

function installEvents() {
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
    language = button.dataset.language;
    progress.language = language;
    persistProgress();
    updateLanguageButtons();
    drawWordList();
    renderPractice();
  }));
  document.querySelectorAll('[data-set]').forEach(button => button.addEventListener('click', () => {
    const setId = button.dataset.set;
    const requested = new URLSearchParams(window.location.search).get('char');
    const set = data.copybook.sets.find(entry => entry.id === setId);
    const item = set.items.find(entry => entry.id === requested || entry.characterId === requested) || set.items[0];
    setActive(item, setId);
    updateLanguageButtons();
  }));
  copybookUi.canvas.addEventListener('pointerdown', pointerDown);
  copybookUi.canvas.addEventListener('pointermove', pointerMove);
  copybookUi.canvas.addEventListener('pointerup', pointerUp);
  copybookUi.canvas.addEventListener('pointercancel', pointerUp);
  copybookUi.demo.addEventListener('click', playDemo);
  copybookUi.retry.addEventListener('click', resetCurrentStroke);
  copybookUi.printButton.addEventListener('click', printWorkbook);
}

async function startCopybook() {
  const response = await fetch(COPYBOOK_DATA_URL, { cache: 'no-cache' });
  if (!response.ok) throw new Error('Copybook content unavailable.');
  data = await response.json();
  readProgress();
  const params = new URLSearchParams(window.location.search);
  activeSetId = params.get('set') === 'xieqian' ? 'xieqian' : 'zhongwenbu';
  const requested = params.get('char');
  const set = activeSet();
  const item = set.items.find(entry => entry.id === requested || entry.characterId === requested) || set.items[0];
  setActive(item, activeSetId);
  updateLanguageButtons();
  installEvents();
  if (params.get('print') === 'week') {
    copybookUi.printScope.value = 'week';
    printWorkbook();
  }
}

startCopybook().catch(error => {
  copybookUi.feedback.textContent = '練字簿暫時未能載入，請用本機靜態伺服器開啟。';
  console.error('Copybook initialization failed:', error.message);
});
