// Shared MiniMax Speech-2.8 HD voice assets for the K2 learning pages.
(function () {
  'use strict';

  const base = 'audio/core-voices/';
  const path = name => base + name + '.mp3';

  const characterKeys = {
    '一': 'yi',
    '二': 'er',
    '三': 'san',
    '四': 'si',
    '五': 'wu',
    '人': 'ren',
    '大': 'da',
    '小': 'xiao',
    '日': 'ri',
    '月': 'yue',
    '水': 'shui',
    '火': 'huo',
    '山': 'shan',
    '木': 'mu',
    '口': 'kou',
    '天': 'tian',
    '地': 'di',
    '上': 'shang',
    '下': 'xia',
    '左': 'zuo',
    '右': 'you',
  };

  const characters = {};
  Object.entries(characterKeys).forEach(([character, key]) => {
    characters[character] = {
      zh: path('character-' + key + '-zh'),
      en: path('character-' + key + '-en'),
    };
  });

  window.CORE_VOICE_ASSETS = {
    numbers: Object.fromEntries(
      Array.from({ length: 20 }, (_, index) => [String(index + 1), path('number-' + (index + 1))])
    ),
    characters,
    feedback: {
      correct: path('feedback-correct-zh'),
      matchComplete: path('feedback-match-complete-zh'),
    },
  };
})();
