
(function () {
  'use strict';

  const SONG_NOTES = {
    A: { title: 'A is for Adam', cue: 'Clap and sing: “A is for Adam!”', chant: 'A says /æ/ — Adam!' },
    B: { title: 'B is for Bible', cue: 'Open your Bible and sing along!', chant: 'B says /b/ — Bible!' },
    C: { title: 'C is for Creation', cue: 'Look around and sing about God’s creation.', chant: 'C says /k/ — Creation!' },
    D: { title: 'D is for David', cue: 'Sing bravely like David with your little harp.', chant: 'D says /d/ — David!' },
    E: { title: 'E is for Eden', cue: 'Make a garden shape with your hands.', chant: 'E says /ē/ — Eden!' },
    F: { title: 'F is for Fish', cue: 'Swim your hands like a fish while you sing.', chant: 'F says /f/ — Fish!' },
    G: { title: 'G is for God', cue: 'Point up high when you sing “God”.', chant: 'G says /g/ — God!' },
    H: { title: 'H is for Heaven', cue: 'Reach up to the sky and sing together.', chant: 'H says /h/ — Heaven!' },
    I: { title: 'I is for Isaac', cue: 'Smile and sing about Isaac’s happy family.', chant: 'I says /ĭ/ — Isaac!' },
    J: { title: 'J is for Jesus', cue: 'Make a heart with your hands for Jesus.', chant: 'J says /j/ — Jesus!' },
    K: { title: 'K is for King', cue: 'Put on an imaginary crown and sing.', chant: 'K says /k/ — King!' },
    L: { title: 'L is for Lamb', cue: 'Pretend to be a soft little lamb.', chant: 'L says /l/ — Lamb!' },
    M: { title: 'M is for Moses', cue: 'Make a walking motion as Moses leads the way.', chant: 'M says /m/ — Moses!' },
    N: { title: 'N is for Noah', cue: 'Make a boat with your hands and sing.', chant: 'N says /n/ — Noah!' },
    O: { title: 'O is for Olive', cue: 'Wave like a dove carrying an olive branch.', chant: 'O says /ŏ/ — Olive!' },
    P: { title: 'P is for Prayer', cue: 'Fold your hands and sing a gentle prayer song.', chant: 'P says /p/ — Prayer!' },
    Q: { title: 'Q is for Queen', cue: 'Give a royal wave while you sing.', chant: 'Q says /kw/ — Queen!' },
    R: { title: 'R is for Rainbow', cue: 'Draw a rainbow in the air with one finger.', chant: 'R says /r/ — Rainbow!' },
    S: { title: 'S is for Star', cue: 'Twinkle your fingers like a star.', chant: 'S says /s/ — Star!' },
    T: { title: 'T is for Temple', cue: 'Build a little temple with your hands.', chant: 'T says /t/ — Temple!' },
    U: { title: 'U is for Universe', cue: 'Stretch your arms wide for the big universe.', chant: 'U says /ū/ — Universe!' },
    V: { title: 'V is for Vine', cue: 'Let your fingers grow like a vine.', chant: 'V says /v/ — Vine!' },
    W: { title: 'W is for Water', cue: 'Make wave motions while you sing.', chant: 'W says /w/ — Water!' },
    X: { title: 'X is for foX', cue: 'Tap the X at the end of foX.', chant: 'X is in foX — /ks/!' },
    Y: { title: 'Y is for Youth', cue: 'Jump up and sing with brave young hearts.', chant: 'Y says /y/ — Youth!' },
    Z: { title: 'Z is for Zion', cue: 'Climb your fingers up like a mountain.', chant: 'Z says /z/ — Zion!' }
  };

  const PRACTICE_TYPES = ['case', 'sound', 'order'];
  const TOTAL_ROUNDS = 5;
  const state = {
    songLetter: null,
    practiceLetter: null,
    round: 0,
    score: 0,
    correctLabel: '',
    type: '',
    sessionActive: false,
    answerLocked: false
  };

  let songAudio;
  let originalSwitchTab;
  let originalLoadLetter;
  let lyricsRequestId = 0;

  function byId(id) {
    return document.getElementById(id);
  }

  function getLetterData(letter) {
    return ALPHABET_DATA[letter] || { word: letter, phonics: '', phrase: '' };
  }

  function getSongMeta(letter) {
    const data = getLetterData(letter);
    const note = SONG_NOTES[letter] || {};
    const songPath = (typeof LETTER_SONGS !== 'undefined' && LETTER_SONGS[letter])
      ? LETTER_SONGS[letter]
      : 'songs/' + letter.toLowerCase() + '-song.mp3';

    return {
      title: note.title || (letter + ' is for ' + data.word),
      cue: note.cue || ('Sing with ' + letter + ' and ' + data.word + '!'),
      chant: note.chant || (letter + ' for ' + data.word + '!'),
      word: data.word,
      path: songPath,
      lyricsPath: 'songs/lyrics/' + letter.toLowerCase() + '-' + data.word.toLowerCase() + '.txt'
    };
  }

  function announce(text) {
    if (typeof window.playMiniMaxText === 'function') window.playMiniMaxText(text);
  }

  function renderSongLyrics(letter, meta) {
    const text = byId('song-lyrics-text');
    const status = byId('song-lyrics-status');
    if (!text || !status) return;

    const requestId = ++lyricsRequestId;
    text.textContent = 'Loading lyrics…';
    status.textContent = 'Loading…';
    status.classList.remove('is-ready', 'is-error');

    fetch(meta.lyricsPath)
      .then(function (response) {
        if (!response.ok) throw new Error('Lyrics unavailable');
        return response.text();
      })
      .then(function (lyrics) {
        if (requestId !== lyricsRequestId) return;
        const cleanLyrics = lyrics
          .replace(/^\s*\[Intro\]\s*/i, '')
          .trim();
        text.textContent = cleanLyrics || 'Lyrics are coming soon.';
        status.textContent = 'English lyrics';
        status.classList.add('is-ready');
      })
      .catch(function () {
        if (requestId !== lyricsRequestId) return;
        text.textContent = 'Lyrics are not available for this song yet.';
        status.textContent = 'Unavailable';
        status.classList.add('is-error');
      });
  }

  function renderSongLetterPicker() {
    const picker = byId('song-letter-picker');
    if (!picker) return;

    picker.innerHTML = '';
    Object.keys(ALPHABET_DATA).forEach(function (letter) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = letter;
      button.setAttribute('aria-label', 'Play the ' + letter + ' song');
      button.addEventListener('click', function () {
        loadLetter(letter);
      });
      picker.appendChild(button);
    });
    updateSongPicker();
  }

  function updateSongPicker() {
    const picker = byId('song-letter-picker');
    if (!picker) return;
    Array.from(picker.children).forEach(function (button) {
      button.classList.toggle('is-current', button.textContent === state.songLetter);
    });
  }

  function renderSongForLetter(letter) {
    state.songLetter = letter;
    const meta = getSongMeta(letter);
    const title = byId('song-title');
    const word = byId('song-word');
    const cue = byId('song-cue');
    const chant = byId('song-chant');
    const badge = byId('song-letter-badge');

    if (title) title.textContent = meta.title;
    if (word) word.textContent = 'Word: ' + meta.word;
    if (cue) cue.textContent = meta.cue;
    if (chant) chant.textContent = meta.chant;
    if (badge) badge.textContent = letter + letter.toLowerCase();
    renderSongLyrics(letter, meta);

    if (songAudio) {
      const changed = songAudio.dataset.letter !== letter;
      if (changed) {
        songAudio.pause();
        songAudio.dataset.letter = letter;
        songAudio.src = meta.path;
        songAudio.load();
        updateSongButton();
      }
    }
    updateSongPicker();
  }

  function updateSongButton() {
    const button = byId('song-play');
    if (!button || !songAudio) return;
    button.textContent = songAudio.paused ? '▶ Play song' : '⏸ Pause song';
  }

  function playSong() {
    if (!songAudio) return;
    if (songAudio.paused) {
      songAudio.play().catch(function () {
        const cue = byId('song-cue');
        if (cue) cue.textContent = 'Tap the audio controls once to start the song.';
      });
    } else {
      songAudio.pause();
    }
    updateSongButton();
  }

  function replaySong() {
    if (!songAudio) return;
    songAudio.currentTime = 0;
    songAudio.play().catch(function () {});
    updateSongButton();
  }

  function moveSong(offset) {
    const keys = Object.keys(ALPHABET_DATA);
    const index = keys.indexOf(currentLetterKey);
    const nextIndex = (index + offset + keys.length) % keys.length;
    loadLetter(keys[nextIndex]);
  }

  function setPracticeLanding() {
    const letter = currentLetterKey;
    state.practiceLetter = letter;
    state.sessionActive = false;
    state.round = 0;
    state.score = 0;
    state.answerLocked = false;

    const data = getLetterData(letter);
    const target = byId('practice-target');
    const prompt = byId('practice-prompt');
    const options = byId('practice-options');
    const feedback = byId('practice-feedback');
    const start = byId('practice-start');
    const best = byId('practice-best');

    if (target) target.textContent = letter + letter.toLowerCase();
    if (prompt) prompt.textContent = 'Ready to practise ' + letter + ' and ' + data.word + '?';
    if (options) options.innerHTML = '';
    if (feedback) {
      feedback.textContent = 'Three quick games: match, listen, and order.';
      feedback.classList.remove('is-wrong');
    }
    if (start) start.textContent = '⭐ Start 5-round practice';
    if (best) {
      best.textContent = 'Best score: ' + getBestScore(letter) + '/' + TOTAL_ROUNDS;
    }
    updatePracticeScore();
  }

  function getBestScore(letter) {
    try {
      return Number(localStorage.getItem('alphabet-best-' + letter) || 0);
    } catch (error) {
      return 0;
    }
  }

  function saveBestScore(letter, score) {
    try {
      const best = Math.max(getBestScore(letter), score);
      localStorage.setItem('alphabet-best-' + letter, String(best));
      return best;
    } catch (error) {
      return score;
    }
  }

  function updatePracticeScore() {
    const round = byId('practice-round');
    const score = byId('practice-score');
    if (round) round.textContent = state.sessionActive
      ? 'Round ' + Math.min(state.round + 1, TOTAL_ROUNDS) + '/' + TOTAL_ROUNDS
      : '5 rounds';
    if (score) score.textContent = 'Score ' + state.score;
  }

  function uniqueRandomItems(items, count) {
    return items.slice().sort(function () {
      return Math.random() - 0.5;
    }).slice(0, count);
  }

  function renderPracticeQuestion() {
    if (!state.sessionActive) return;

    const letter = state.practiceLetter;
    const data = getLetterData(letter);
    const type = PRACTICE_TYPES[state.round % PRACTICE_TYPES.length];
    const target = byId('practice-target');
    const prompt = byId('practice-prompt');
    const options = byId('practice-options');
    const feedback = byId('practice-feedback');

    state.type = type;
    state.correctLabel = '';
    state.answerLocked = false;

    if (target) target.textContent = letter + letter.toLowerCase();
    if (options) options.innerHTML = '';
    if (feedback) {
      feedback.textContent = '';
      feedback.classList.remove('is-wrong');
    }

    let choices;
    if (type === 'case') {
      const correct = letter.toLowerCase();
      const distractors = uniqueRandomItems(
        Object.keys(ALPHABET_DATA)
          .filter(function (item) { return item !== letter; })
          .map(function (item) { return item.toLowerCase(); }),
        2
      );
      choices = [correct].concat(distractors);
      if (prompt) prompt.textContent = 'Find the small letter that matches ' + letter + '.';
      state.correctLabel = correct;
    } else if (type === 'sound') {
      const allLetters = Object.keys(ALPHABET_DATA);
      let correctWord = data.word;
      let pool;
      if (letter === 'X') {
        if (prompt) prompt.textContent = 'Which word has the X sound at the end?';
        correctWord = 'foX';
        pool = allLetters
          .filter(function (item) { return item !== letter; })
          .map(function (item) { return getLetterData(item).word; })
          .filter(function (word) { return word.toLowerCase() !== 'fox'; });
      } else {
        if (prompt) prompt.textContent = 'Which word starts with ' + letter + '?';
        pool = allLetters
          .filter(function (item) { return item !== letter && item !== 'X'; })
          .map(function (item) { return getLetterData(item).word; })
          .filter(function (word) { return word.charAt(0).toUpperCase() !== letter; });
      }
      choices = [correctWord].concat(uniqueRandomItems(pool, 2));
      state.correctLabel = correctWord;
    } else {
      const index = Object.keys(ALPHABET_DATA).indexOf(letter);
      const askAfter = letter === 'A';
      const correct = askAfter ? Object.keys(ALPHABET_DATA)[index + 1] : Object.keys(ALPHABET_DATA)[index - 1];
      const promptText = askAfter
        ? 'What letter comes after A?'
        : 'What letter comes before ' + letter + '?';
      if (prompt) prompt.textContent = promptText;
      choices = [correct].concat(uniqueRandomItems(
        Object.keys(ALPHABET_DATA).filter(function (item) { return item !== correct && item !== letter; }),
        2
      ));
      state.correctLabel = correct;
    }

    uniqueRandomItems(choices, choices.length).forEach(function (choice) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'practice-option';
      button.textContent = choice;
      button.dataset.correct = choice === state.correctLabel ? 'true' : 'false';
      options.appendChild(button);
    });

    updatePracticeScore();
    announce(type === 'sound'
      ? 'Find the word for letter ' + letter + '.'
      : (prompt ? prompt.textContent : 'Your turn!'));
  }

  function startPracticeSession() {
    state.practiceLetter = currentLetterKey;
    state.round = 0;
    state.score = 0;
    state.sessionActive = true;
    const start = byId('practice-start');
    if (start) start.textContent = 'Restart practice';
    renderPracticeQuestion();
  }

  function completePractice() {
    state.sessionActive = false;
    state.answerLocked = false;
    const best = saveBestScore(state.practiceLetter, state.score);
    const prompt = byId('practice-prompt');
    const options = byId('practice-options');
    const feedback = byId('practice-feedback');
    const start = byId('practice-start');
    const bestLabel = byId('practice-best');

    if (prompt) prompt.textContent = 'You finished the ' + state.practiceLetter + ' challenge!';
    if (options) options.innerHTML = '';
    if (feedback) {
      feedback.textContent = '🎉 Great work! You scored ' + state.score + '/' + TOTAL_ROUNDS + '.';
      feedback.classList.remove('is-wrong');
    }
    if (start) start.textContent = '⭐ Try again';
    if (bestLabel) bestLabel.textContent = 'Best score: ' + best + '/' + TOTAL_ROUNDS;
    updatePracticeScore();
    announce('Great job! You finished your letter practice.');
  }

  function handlePracticeOption(event) {
    const button = event.target.closest('.practice-option');
    if (!button || !state.sessionActive || state.answerLocked) return;

    const feedback = byId('practice-feedback');
    if (button.dataset.correct !== 'true') {
      button.classList.add('is-wrong');
      if (feedback) {
        feedback.textContent = 'Almost! Try another one.';
        feedback.classList.add('is-wrong');
      }
      announce('Try again!');
      window.setTimeout(function () {
        button.classList.remove('is-wrong');
      }, 450);
      return;
    }

    state.answerLocked = true;
    button.classList.add('is-correct');
    state.score += 1;
    if (feedback) {
      feedback.textContent = '✅ Yes! ' + state.correctLabel + '!';
      feedback.classList.remove('is-wrong');
    }
    announce('Yes! ' + state.correctLabel + '!');
    window.setTimeout(function () {
      state.round += 1;
      if (state.round >= TOTAL_ROUNDS) {
        completePractice();
      } else {
        renderPracticeQuestion();
      }
    }, 800);
  }

  function activateTab4() {
    const module = byId('module-4');
    const tab = byId('tab-4');
    if (!module || !tab) return;

    [1, 2, 3].forEach(function (index) {
      const section = byId('module-' + index);
      const button = byId('tab-' + index);
      if (section) section.classList.add('hidden');
      if (button) {
        button.classList.remove('bg-white', 'text-macaron-dark', 'scale-105', 'border-macaron-blue');
        button.classList.add('bg-white/70', 'text-gray-400');
      }
    });

    module.classList.remove('hidden');
    tab.classList.remove('bg-white/70', 'text-gray-400');
    tab.classList.add('bg-white', 'text-macaron-dark', 'scale-105', 'border-macaron-blue');
    if (typeof stopMusic === 'function') stopMusic();
    renderSongForLetter(currentLetterKey);
    if (state.practiceLetter !== currentLetterKey) setPracticeLanding();
  }

  function deactivateTab4() {
    const module = byId('module-4');
    const tab = byId('tab-4');
    if (module) module.classList.add('hidden');
    if (tab) {
      tab.classList.remove('bg-white', 'text-macaron-dark', 'scale-105', 'border-macaron-blue');
      tab.classList.add('bg-white/70', 'text-gray-400');
    }
  }

  function initExtension() {
    songAudio = byId('song-player');
    if (songAudio) {
      songAudio.addEventListener('play', updateSongButton);
      songAudio.addEventListener('pause', updateSongButton);
      songAudio.addEventListener('ended', updateSongButton);
    }

    const play = byId('song-play');
    const replay = byId('song-replay');
    const previous = byId('song-previous');
    const next = byId('song-next');
    const start = byId('practice-start');
    const speak = byId('practice-speak');
    const options = byId('practice-options');

    if (play) play.addEventListener('click', playSong);
    if (replay) replay.addEventListener('click', replaySong);
    if (previous) previous.addEventListener('click', function () { moveSong(-1); });
    if (next) next.addEventListener('click', function () { moveSong(1); });
    if (start) start.addEventListener('click', startPracticeSession);
    if (speak) speak.addEventListener('click', function () {
      announce('Letter ' + currentLetterKey + '. ' + getLetterData(currentLetterKey).word + '.');
    });
    if (options) options.addEventListener('click', handlePracticeOption);

    renderSongLetterPicker();
    renderSongForLetter(currentLetterKey);
    setPracticeLanding();
  }

  originalSwitchTab = window.switchTab;
  originalLoadLetter = window.loadLetter;

  window.switchTab = function (tabIndex) {
    if (tabIndex === 4) {
      activateTab4();
      return;
    }
    deactivateTab4();
    return originalSwitchTab(tabIndex);
  };

  window.loadLetter = function (letter) {
    const stayingInSongRoom = byId('module-4') && !byId('module-4').classList.contains('hidden');
    originalLoadLetter(letter);
    renderSongForLetter(letter);
    setPracticeLanding();
    if (stayingInSongRoom) activateTab4();
  };

  window.addEventListener('load', initExtension);
})();
