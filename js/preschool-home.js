'use strict';

const LEVEL_STORAGE_KEY = 'preschool-level-v1';

document.querySelectorAll('[data-level-link]').forEach(link => {
  link.addEventListener('click', () => {
    try {
      localStorage.setItem(LEVEL_STORAGE_KEY, link.dataset.levelLink);
    } catch (error) {
      // Navigation still works when local storage is unavailable.
    }
  });
});

try {
  const lastChoice = localStorage.getItem(LEVEL_STORAGE_KEY);
  if (lastChoice === 'k2' || lastChoice === 'nk1') {
    const badge = document.querySelector('[data-last-choice="' + lastChoice + '"]');
    if (badge) badge.classList.add('is-visible');
  }
} catch (error) {
  // The home page remains usable without local storage.
}
