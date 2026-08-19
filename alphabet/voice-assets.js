// Pre-generated MiniMax Speech-2.8 HD audio used by the alphabet game.
// The files are kept as normal MP3 assets so the page never needs an API key.
(function () {
  'use strict';

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const path = function (name) { return 'audio/voices/' + name + '.mp3'; };

  window.MINIMAX_VOICE_ASSETS = {
    phonics: Object.fromEntries(letters.map(function (letter) {
      return [letter, path('phonics-' + letter.toLowerCase())];
    })),
    challenge: Object.fromEntries(letters.map(function (letter) {
      return [letter, path('challenge-' + letter.toLowerCase())];
    })),
    say: Object.fromEntries(letters.map(function (letter) {
      return [letter, path('say-' + letter.toLowerCase())];
    })),
    feedback: {
      success: path('feedback-success'),
      tryAgain: path('feedback-try-again'),
      greatJob: path('feedback-great-job'),
      awesome: path('feedback-awesome'),
      star: path('feedback-star'),
      incredible: path('feedback-incredible'),
      fantastic: path('feedback-fantastic'),
      practiceComplete: path('feedback-practice-complete'),
      oneMoreStar: path('feedback-one-more-star'),
      nextLetter: path('feedback-next-letter'),
      ready: path('feedback-ready'),
      match: path('prompt-match'),
      sound: path('prompt-sound'),
      xSound: path('prompt-x-sound'),
      order: path('prompt-order'),
      correct: path('feedback-correct')
    }
  };
})();
