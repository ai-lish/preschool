'use strict';

const K2_STORAGE_KEY = 'preschool-k2-guide-v1';
const k2Inputs = Array.from(document.querySelectorAll('input[data-k2-key]'));
const todayInputs = k2Inputs.filter(input => input.dataset.k2Group === 'today');
const routineInputs = k2Inputs.filter(input => input.dataset.k2Group === 'routine');
const todayStamp = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Hong_Kong',
}).format(new Date());

function readK2Progress() {
  try {
    const saved = JSON.parse(localStorage.getItem(K2_STORAGE_KEY) || '{}');
    if (saved.values) return saved;
    return { values: saved, todayDate: '' };
  } catch (error) {
    return { values: {}, todayDate: '' };
  }
}

function writeK2Progress() {
  const values = Object.fromEntries(k2Inputs.map(input => [input.dataset.k2Key, input.checked]));
  try {
    localStorage.setItem(K2_STORAGE_KEY, JSON.stringify({ values, todayDate: todayStamp }));
  } catch (error) {
    // The checklist still works when browser storage is unavailable.
  }
}

function updateProgress(inputs, targetId) {
  const done = inputs.filter(input => input.checked).length;
  const target = document.getElementById(targetId);
  if (target) target.textContent = `${done} / ${inputs.length}`;
}

function updateK2Progress() {
  updateProgress(todayInputs, 'todayProgress');
  updateProgress(routineInputs, 'routineProgress');
}

const savedProgress = readK2Progress();
k2Inputs.forEach(input => {
  const isTodayTask = input.dataset.k2Group === 'today';
  const todayIsCurrent = savedProgress.todayDate === todayStamp;
  input.checked = savedProgress.values[input.dataset.k2Key] === true && (!isTodayTask || todayIsCurrent);
  input.addEventListener('change', () => {
    writeK2Progress();
    updateK2Progress();
  });
});

function resetGroup(inputs) {
  inputs.forEach(input => { input.checked = false; });
  writeK2Progress();
  updateK2Progress();
}

document.getElementById('resetToday').addEventListener('click', () => resetGroup(todayInputs));
document.getElementById('resetRoutine').addEventListener('click', () => resetGroup(routineInputs));
updateK2Progress();
