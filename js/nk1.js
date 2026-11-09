'use strict';

const NK1_MANIFEST_URL = 'audio/nk1/manifest.json';
const NK1_KEYS = ['alphabet_song', 'shapes', 'recognize_picture_words', 'counting', 'doodle_drawing'];
let nk1AudioAssets = [];
let nk1ActiveAudio = null;
let nk1ActiveResolve = null;
let nk1PlaybackToken = 0;

function setNk1Status(message) {
  document.getElementById('nk1AudioStatus').textContent = message;
}

function stopNk1Audio() {
  nk1PlaybackToken += 1;
  if (nk1ActiveAudio) {
    nk1ActiveAudio.pause();
    nk1ActiveAudio.currentTime = 0;
    nk1ActiveAudio = null;
  }
  if (nk1ActiveResolve) {
    const resolve = nk1ActiveResolve;
    nk1ActiveResolve = null;
    resolve(false);
  }
}

async function playNk1Clip(key, token) {
  const asset = nk1AudioAssets.find(item => item.key === key && item.status === 'generated');
  if (!asset || !asset.path) {
    setNk1Status('語音檔暫時未能載入。');
    return false;
  }
  return new Promise(resolve => {
    const audio = new Audio(asset.path);
    nk1ActiveAudio = audio;
    let settled = false;
    const finish = played => {
      if (settled) return;
      settled = true;
      if (nk1ActiveAudio === audio) nk1ActiveAudio = null;
      if (nk1ActiveResolve === finish) nk1ActiveResolve = null;
      resolve(played);
    };
    nk1ActiveResolve = finish;
    audio.addEventListener('ended', () => {
      finish(true);
    }, { once: true });
    audio.addEventListener('error', () => {
      if (token === nk1PlaybackToken) setNk1Status('語音檔暫時未能載入。');
      finish(false);
    }, { once: true });
    audio.play().catch(() => {
      if (token === nk1PlaybackToken) setNk1Status('請再按一次播放語音。');
      finish(false);
    });
  });
}

async function playNk1Sequence(keys) {
  stopNk1Audio();
  const token = nk1PlaybackToken;
  setNk1Status('');
  for (const key of keys) {
    if (token !== nk1PlaybackToken) return;
    const played = await playNk1Clip(key, token);
    if (!played || token !== nk1PlaybackToken) return;
    await new Promise(resolve => window.setTimeout(resolve, 180));
  }
}

async function loadNk1Audio() {
  try {
    const response = await fetch(NK1_MANIFEST_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error('manifest');
    const manifest = await response.json();
    nk1AudioAssets = Array.isArray(manifest.assets) ? manifest.assets : [];
  } catch (error) {
    setNk1Status('語音暫時未能載入；仍可選擇活動。');
  }
}

document.getElementById('readAllNames').addEventListener('click', () => {
  playNk1Sequence(['welcome', ...NK1_KEYS]);
});
document.querySelectorAll('[data-play-name]').forEach(button => {
  button.addEventListener('click', () => playNk1Sequence([button.dataset.playName]));
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopNk1Audio();
});
loadNk1Audio();
