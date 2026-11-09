'use strict';

const ARK_PROGRESS_KEY = 'preschool-ark-k2-v1';
const GUIDE_PROGRESS_KEY = 'preschool-k2-guide-v1';
const ARK_LEVEL_IDS = ['animal-listening', 'stroke-writing', 'sheep-counting', 'animal-math'];
const GUIDE_TODAY_KEYS = ['today-english', 'today-number', 'today-chinese', 'today-routine'];

function readStoredJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch (error) {
    return null;
  }
}

function readArkHubProgress() {
  const saved = readStoredJson(ARK_PROGRESS_KEY);
  const levels = saved && saved.levels && typeof saved.levels === 'object' ? saved.levels : {};
  let totalStars = 0;
  let highestUnlocked = 0;
  let firstUnplayed = -1;
  ARK_LEVEL_IDS.forEach((id, index) => {
    const record = levels[id] || {};
    const stars = Number.isInteger(record.stars) ? Math.max(0, Math.min(3, record.stars)) : 0;
    const plays = Number.isInteger(record.playCount) ? Math.max(0, record.playCount) : 0;
    totalStars += stars;
    if (index === 0 || (levels[ARK_LEVEL_IDS[index - 1]] || {}).stars >= 1) {
      highestUnlocked = index;
      if (plays === 0 && firstUnplayed < 0) firstUnplayed = index;
    }
    const segment = document.querySelector('[data-level-progress="' + id + '"]');
    if (segment) segment.classList.toggle('is-earned', stars > 0);
  });
  document.getElementById('arkTotalStars').textContent = String(totalStars);
  const recordCount = Object.values(levels).some(record => Number.isInteger(record && record.playCount) && record.playCount > 0);
  const levelToContinue = firstUnplayed >= 0 ? firstUnplayed : highestUnlocked;
  document.getElementById('arkContinueLabel').textContent = recordCount
    ? '繼續第 ' + (levelToContinue + 1) + ' 級'
    : '開始';
}

function todayInHongKong() {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Hong_Kong',
  }).format(new Date());
}

function readGuideTodayProgress() {
  const saved = readStoredJson(GUIDE_PROGRESS_KEY);
  if (!saved || saved.todayDate !== todayInHongKong() || !saved.values || typeof saved.values !== 'object') return;
  const done = GUIDE_TODAY_KEYS.filter(key => saved.values[key] === true).length;
  const output = document.getElementById('guideProgress');
  output.textContent = '今日完成 ' + done + ' / ' + GUIDE_TODAY_KEYS.length;
  output.hidden = false;
}

readArkHubProgress();
readGuideTodayProgress();
