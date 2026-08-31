/* Public child runtime: no authoring, source-document, or adult settings code. */
(() => {
  "use strict";

  const STORAGE_KEY = "yueguang-mirror-reader-v1";
  const params = new URLSearchParams(window.location.search);
  const REQUESTED_BOOK_ID = params.get("book") || "";
  const BOOKS = window.MINIMAX_BOOKS || {};
  const RECOGNITION = window.MINIMAX_RECOGNITION || { books: {} };
  const PREBUILT = window.MINIMAX_ASSETS || { books: {} };
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const colorCanvas = document.createElement("canvas");
  const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
  const frameCanvas = document.createElement("canvas");
  const frameContext = frameCanvas.getContext("2d", { willReadFrequently: true });
  const RECOGNITION_THRESHOLD = 0.62;
  const $ = (selector) => document.querySelector(selector);

  const workspace = $("#workspace");
  const title = $("#workspaceTitle");
  const summary = $("#workspaceSummary");
  const video = $("#cameraVideo");
  const empty = $("#cameraEmpty");
  const cameraStatus = $("#cameraStatus");
  const readout = $("#cameraReadout");
  const startButton = $("#startCamera");
  const stopButton = $("#stopCamera");
  const detectButton = $("#toggleDetection");
  const recognitionStatus = $("#recognitionStatus");
  const interactionTitle = $("#interactionTitle");
  const interactionIntro = $("#interactionIntro");
  const detectedLabel = $("#detectedLabel");
  const detectedPage = $("#detectedPage");
  const interactionPrompt = $("#interactionPrompt");
  const interactionImage = $("#interactionImage");
  const interactionAudio = $("#interactionAudio");
  const beforeAudio = $("#beforeAudio");
  const afterAudio = $("#afterAudio");
  const reactionAudio = $("#reactionAudio");
  const hintAudio = $("#hintAudio");
  const backgroundMusic = $("#backgroundMusic");
  const speakButton = $("#speakInteraction");
  const playHintButton = $("#playHint");
  const interactionAction = $("#interactionAction");
  const flowStatus = $("#flowStatus");
  const toggleMusicButton = $("#toggleMusic");
  const assetState = $("#assetState");
  const dialog = $("#bookDialog");
  const dialogAudio = $("#dialogAudio");
  const dialogTitle = $("#dialogTitle");
  const dialogText = $("#dialogText");
  const dialogImage = $("#dialogImage");
  const markComplete = $("#markComplete");
  const childWelcome = $("#childWelcome");
  const childBookName = $("#childBookName");
  const childBookPicker = $("#childBookPicker");
  const childStart = $("#childStart");
  const changeBookButton = $("#changeBook");

  let state = loadState();
  let selectedBookId = REQUESTED_BOOK_ID && BOOKS[REQUESTED_BOOK_ID] ? REQUESTED_BOOK_ID : null;
  let currentBookId = null;
  let currentPage = null;
  let cameraStream = null;
  let recognitionTimer = null;
  let recognitionEnabled = false;
  let stableKey = null;
  let stableCount = 0;
  let pendingBook = null;
  let musicSource = "";
  let musicBaseVolume = 0.14;
  let musicEnabled = true;
  let musicDucked = false;
  let currentAssets = null;
  let currentFlowId = null;
  let flowStarted = false;
  let flowCompleted = false;
  let interactionPage = null;
  let audioContext = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return {
        opened: Array.isArray(saved?.opened) ? saved.opened : [],
        completed: Array.isArray(saved?.completed) ? saved.completed : [],
        lastBook: saved?.lastBook || null
      };
    } catch (error) {
      return { opened: [], completed: [], lastBook: null };
    }
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
    if (markComplete && currentBookId) markComplete.textContent = state.completed.includes(currentBookId) ? "取消已完成" : "標記為已完成";
  }

  function centralSamplesFor(id) {
    const samples = RECOGNITION.books?.[id]?.samples;
    return samples && typeof samples === "object" ? samples : {};
  }

  function allSamples({ coverOnly = false } = {}) {
    const ids = selectedBookId && BOOKS[selectedBookId] ? [selectedBookId] : Object.keys(BOOKS);
    const list = [];
    ids.forEach((id) => Object.entries(centralSamplesFor(id)).forEach(([page, samples]) => {
      if (coverOnly && String(page) !== "1") return;
      (Array.isArray(samples) ? samples : [samples]).forEach((sample) => {
        if (sample && Array.isArray(sample.values)) list.push({ bookId: id, page, sample });
      });
    }));
    return list;
  }

  function drawFrame(crop = null) {
    const width = 64;
    const height = 48;
    frameCanvas.width = width;
    frameCanvas.height = height;
    frameContext.clearRect(0, 0, width, height);
    frameContext.save();
    frameContext.translate(width, 0);
    frameContext.scale(-1, 1);
    if (crop) {
      frameContext.drawImage(
        video,
        video.videoWidth * crop.x,
        video.videoHeight * crop.y,
        video.videoWidth * crop.width,
        video.videoHeight * crop.height,
        0,
        0,
        width,
        height
      );
    } else frameContext.drawImage(video, 0, 0, width, height);
    frameContext.restore();
    return frameContext.getImageData(0, 0, width, height);
  }

  function detectPageBounds(pixels, width = 64, height = 48) {
    const cornerPoints = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
    const cornerLuminance = cornerPoints.reduce((sum, [x, y]) => {
      const index = (y * width + x) * 4;
      return sum + pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    }, 0) / cornerPoints.length;
    const columnHits = Array(width).fill(0);
    const rowHits = Array(height).fill(0);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const luminance = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
        if (Math.abs(luminance - cornerLuminance) > 22) {
          columnHits[x] += 1;
          rowHits[y] += 1;
        }
      }
    }
    const columns = columnHits.map((hits, index) => hits > height * 0.12 ? index : -1).filter((index) => index >= 0);
    const rows = rowHits.map((hits, index) => hits > width * 0.12 ? index : -1).filter((index) => index >= 0);
    if (!columns.length || !rows.length) return null;
    const x = Math.min(...columns);
    const y = Math.min(...rows);
    const right = Math.max(...columns);
    const bottom = Math.max(...rows);
    const bounds = { x, y, width: right - x + 1, height: bottom - y + 1 };
    return bounds.width >= width * 0.35 && bounds.height >= height * 0.45 ? bounds : null;
  }

  function fingerprintFromFrame(framePixels, cropToPage = false) {
    if (!video.videoWidth || video.readyState < 2) return null;
    const width = 32;
    const height = 24;
    canvas.width = width;
    canvas.height = height;
    colorCanvas.width = 16;
    colorCanvas.height = 12;
    frameContext.putImageData(framePixels, 0, 0);
    const bounds = cropToPage ? detectPageBounds(framePixels.data) : null;
    const source = bounds ? [bounds.x, bounds.y, bounds.width, bounds.height] : [0, 0, frameCanvas.width, frameCanvas.height];
    context.drawImage(frameCanvas, ...source, 0, 0, width, height);
    colorContext.drawImage(frameCanvas, ...source, 0, 0, colorCanvas.width, colorCanvas.height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const values = [];
    let total = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const luminance = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
      values.push(luminance);
      total += luminance;
    }
    const mean = total / values.length;
    const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) || 1;
    const colorPixels = colorContext.getImageData(0, 0, colorCanvas.width, colorCanvas.height).data;
    const color = [];
    for (let index = 0; index < colorPixels.length; index += 4) {
      const red = colorPixels[index];
      const green = colorPixels[index + 1];
      const blue = colorPixels[index + 2];
      const sum = red + green + blue || 1;
      color.push(
        Math.round((red / sum) * 1000) / 1000,
        Math.round((green / sum) * 1000) / 1000,
        Math.round((blue / sum) * 1000) / 1000
      );
    }
    return { values: values.map((value) => Math.round(((value - mean) / deviation) * 100) / 100), color };
  }

  function fingerprints() {
    if (!video.videoWidth || video.readyState < 2) return [];
    const crops = [
      null,
      { x: 0.05, y: 0, width: 0.90, height: 0.80 },
      { x: 0.14, y: 0, width: 0.72, height: 0.78 },
      { x: 0.18, y: 0, width: 0.64, height: 0.68 },
      { x: 0.24, y: 0, width: 0.52, height: 0.68 },
      { x: 0.26, y: 0.12, width: 0.48, height: 0.66 },
      { x: 0.30, y: 0.18, width: 0.40, height: 0.58 },
      { x: 0.34, y: 0.22, width: 0.32, height: 0.50 },
      { x: 0.09, y: 0.05, width: 0.82, height: 0.90 },
      { x: 0.16, y: 0.125, width: 0.68, height: 0.75 }
    ];
    return crops.flatMap((crop) => {
      const frame = drawFrame(crop);
      return [fingerprintFromFrame(frame), fingerprintFromFrame(frame, true)];
    }).filter(Boolean);
  }

  function similarity(first, second) {
    if (!first || !second || !Array.isArray(first.values) || first.values.length !== second.values?.length) return 0;
    let dot = 0;
    let firstPower = 0;
    let secondPower = 0;
    for (let index = 0; index < first.values.length; index += 1) {
      dot += first.values[index] * second.values[index];
      firstPower += first.values[index] ** 2;
      secondPower += second.values[index] ** 2;
    }
    const denominator = Math.sqrt(firstPower * secondPower);
    const luminanceScore = denominator ? (dot / denominator + 1) / 2 : 0;
    if (!Array.isArray(first.color) || !Array.isArray(second.color) || first.color.length !== second.color.length) return luminanceScore;
    const colorDistance = first.color.reduce((sum, value, index) => sum + Math.abs(value - second.color[index]), 0) / first.color.length;
    const colorScore = Math.max(0, 1 - colorDistance * 1.5);
    return luminanceScore * 0.72 + colorScore * 0.28;
  }

  function resetRecognition() {
    stableKey = null;
    stableCount = 0;
    if (readout) readout.textContent = currentBookId ? "等待書頁" : "等待封面";
  }

  function stopMedia(media) {
    if (!media) return;
    media.pause();
    try { media.currentTime = 0; } catch (error) {}
  }

  function setMediaSource(media, source) {
    if (!media) return;
    stopMedia(media);
    if (source) {
      media.src = source;
      media.hidden = true;
      media.load();
    } else {
      media.removeAttribute("src");
      media.hidden = true;
      media.load();
    }
  }

  function setMusicDucked(ducked) {
    musicDucked = ducked;
    if (backgroundMusic && musicSource) backgroundMusic.volume = ducked ? Math.min(musicBaseVolume, 0.035) : musicBaseVolume;
  }

  function updateMusicButton() {
    if (!toggleMusicButton) return;
    toggleMusicButton.disabled = !musicSource;
    toggleMusicButton.setAttribute("aria-pressed", musicEnabled ? "true" : "false");
    toggleMusicButton.textContent = musicEnabled ? "🎵 背景音樂：開啟" : "🎵 背景音樂：關閉";
  }

  function clearMusic() {
    musicSource = "";
    musicBaseVolume = 0.14;
    stopMedia(backgroundMusic);
    if (backgroundMusic) {
      backgroundMusic.removeAttribute("src");
      backgroundMusic.load();
    }
    updateMusicButton();
  }

  function syncMusic(asset, start = false) {
    const source = asset?.backgroundMusic || "";
    if (!source) {
      clearMusic();
      return;
    }
    if (musicSource !== source) {
      stopMedia(backgroundMusic);
      musicSource = source;
      backgroundMusic.src = source;
      backgroundMusic.loop = true;
      backgroundMusic.load();
    }
    musicBaseVolume = Math.max(0, Math.min(1, Number(asset.backgroundMusicVolume ?? 0.14)));
    backgroundMusic.volume = musicEnabled ? (musicDucked ? Math.min(musicBaseVolume, 0.035) : musicBaseVolume) : 0;
    updateMusicButton();
    if (start && musicEnabled) backgroundMusic.play().catch(() => {});
  }

  function assetPackFor(id) {
    return PREBUILT.books?.[id] || null;
  }

  function assetsFor(id, page) {
    const pack = assetPackFor(id);
    if (!pack) return null;
    const pageAsset = pack.pages?.[String(page)];
    if (pageAsset) return { ...(pack.pageDefault || {}), ...pageAsset, backgroundMusic: pack.backgroundMusic, backgroundMusicVolume: pack.backgroundMusicVolume };
    return pack.pageDefault ? { ...pack.pageDefault, backgroundMusic: pack.backgroundMusic, backgroundMusicVolume: pack.backgroundMusicVolume } : null;
  }

  function storyMedia() {
    return [interactionAudio, beforeAudio, afterAudio, reactionAudio].filter(Boolean);
  }

  function stopStoryMedia() {
    storyMedia().forEach((media) => {
      media.onended = null;
      stopMedia(media);
    });
  }

  function playAudioSequence(mediaList, statusText, failureText = "再按一次就可以繼續播放。", done = null) {
    const clips = mediaList.filter((media) => media?.src);
    if (!clips.length) {
      if (assetState) assetState.textContent = failureText;
      if (done) done();
      return;
    }
    stopStoryMedia();
    let index = 0;
    const next = () => {
      const media = clips[index++];
      if (!media) {
        setMusicDucked(false);
        if (done) done();
        return;
      }
      media.onended = () => {
        media.onended = null;
        next();
      };
      media.play().then(() => {
        if (assetState && statusText) assetState.textContent = statusText;
      }).catch(() => {
        media.onended = null;
        setMusicDucked(false);
        if (assetState) assetState.textContent = failureText;
      });
    };
    next();
  }

  function unlockAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playTone(audio, frequency, startAt, duration, type = "sine", volume = 0.07) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.03);
  }

  function playNoise(audio, startAt, duration, lowFrequency, highFrequency, volume = 0.14) {
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * 0.8;
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(lowFrequency, startAt);
    filter.frequency.exponentialRampToValueAtTime(highFrequency, startAt + duration);
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), startAt + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(startAt);
    source.stop(startAt + duration + 0.03);
  }

  function playSoundEffect(effect) {
    const audio = unlockAudio();
    if (!audio || !effect) return;
    const now = audio.currentTime + 0.01;
    if (effect === "wolf-blow") {
      playNoise(audio, now, 0.75, 280, 1500, 0.18);
      playTone(audio, 180, now, 0.65, "sine", 0.06);
    } else if (effect === "wood-crash") {
      playNoise(audio, now, 0.42, 90, 520, 0.28);
      playTone(audio, 135, now + 0.04, 0.24, "triangle", 0.1);
      playTone(audio, 92, now + 0.17, 0.3, "triangle", 0.08);
    } else if (effect === "chair-break") {
      playNoise(audio, now, 0.3, 150, 760, 0.2);
      playTone(audio, 220, now, 0.16, "square", 0.07);
      playTone(audio, 125, now + 0.11, 0.25, "square", 0.07);
    } else if (effect === "footsteps") {
      playTone(audio, 115, now, 0.12, "triangle", 0.08);
      playTone(audio, 105, now + 0.2, 0.12, "triangle", 0.08);
      playTone(audio, 98, now + 0.4, 0.14, "triangle", 0.08);
    } else if (effect === "pot") {
      playTone(audio, 780, now, 0.08, "bell", 0.12);
      playTone(audio, 520, now + 0.08, 0.34, "triangle", 0.1);
      playNoise(audio, now + 0.08, 0.25, 130, 420, 0.12);
    } else if (effect === "porridge") {
      playTone(audio, 420, now, 0.12, "sine", 0.08);
      playTone(audio, 620, now + 0.13, 0.16, "sine", 0.08);
    } else if (effect === "success") {
      playTone(audio, 660, now, 0.16, "sine", 0.08);
      playTone(audio, 880, now + 0.13, 0.24, "sine", 0.08);
    }
  }

  function updateFlowUi() {
    const flow = currentAssets?.flow;
    const hasAfter = Boolean(afterAudio?.src);
    if (!flow || !hasAfter) {
      if (flowStatus) flowStatus.textContent = currentAssets?.audio ? "故事語音會自動播放。" : "這一頁的預製語音未準備好。";
      if (interactionAction) interactionAction.hidden = true;
      return;
    }
    const afterState = flow.stage && flow.stage !== "before";
    if (flowStatus) {
      flowStatus.textContent = afterState
        ? (flowCompleted ? "互動完成 · 可以繼續下一頁" : "互動完成 · 正在讀出後半段")
        : (flowCompleted ? "已完成互動 · 可以再玩一次" : flowStarted ? "第一段已讀 · 按提示完成互動" : "準備讀第一段");
    }
    if (interactionAction) {
      interactionAction.hidden = afterState;
      interactionAction.disabled = false;
      interactionAction.textContent = flowCompleted ? "再玩一次　↻" : "完成互動，繼續故事　→";
    }
  }

  function playStoryAudio() {
    const primary = beforeAudio?.src ? beforeAudio : interactionAudio;
    playAudioSequence([primary], "第一段故事語音正在播放。", "按「重播第一段」就可以繼續聽。", updateFlowUi);
  }

  function playHintAudio() {
    if (!hintAudio?.src) return;
    stopStoryMedia();
    stopMedia(hintAudio);
    hintAudio.play().then(() => {
      if (assetState) assetState.textContent = "女聲玩法提示正在播放。";
    }).catch(() => {
      if (assetState) assetState.textContent = "再按一次就可以播放玩法提示。";
    });
  }

  function completeInteraction() {
    const flow = currentAssets?.flow;
    if (!flow || !afterAudio?.src) return;
    flowStarted = true;
    interactionPage = currentPage;
    flowCompleted = true;
    if (interactionAction) interactionAction.disabled = true;
    if (flowStatus) flowStatus.textContent = "互動完成 · 正在讀出後半段";
    playSoundEffect(flow.soundEffect || "success");
    playAudioSequence([afterAudio, reactionAudio], "互動後故事語音正在播放。", "再按一次就可以聽到互動後的故事。", updateFlowUi);
  }

  function resetInteraction() {
    stopStoryMedia();
    stopMedia(hintAudio);
    currentPage = null;
    currentAssets = null;
    currentFlowId = null;
    flowStarted = false;
    flowCompleted = false;
    interactionPage = null;
    if (detectedLabel) detectedLabel.textContent = "目前狀態";
    if (detectedPage) detectedPage.textContent = "尚未辨認";
    if (interactionTitle) interactionTitle.textContent = "等待確認書本";
    if (interactionIntro) interactionIntro.textContent = "鏡頭辨認書本後會先彈出確認視窗。";
    if (interactionPrompt) interactionPrompt.textContent = "先把書頁放到鏡子前，再和小朋友一起確認。";
    if (interactionImage) {
      interactionImage.hidden = true;
      interactionImage.removeAttribute("src");
    }
    setMediaSource(interactionAudio, "");
    setMediaSource(beforeAudio, "");
    setMediaSource(afterAudio, "");
    setMediaSource(reactionAudio, "");
    setMediaSource(hintAudio, "");
    if (playHintButton) playHintButton.disabled = true;
    if (interactionAction) interactionAction.hidden = true;
    if (flowStatus) flowStatus.textContent = "等待預製資產";
    if (assetState) assetState.textContent = "等待預製資產";
    clearMusic();
  }

  function showPage(page, score) {
    const book = BOOKS[currentBookId];
    if (!book || !page) return;
    const previousPage = currentPage;
    currentPage = String(page);
    detectedLabel.textContent = "已確認書本 · 頁面辨識";
    detectedPage.textContent = `第 ${page} 頁${score ? ` · 信心 ${Math.round(score * 100)}%` : ""}`;
    interactionTitle.textContent = book.pageTitle;
    interactionIntro.textContent = book.intro;
    const assets = assetsFor(currentBookId, page);
    const previousFlowId = currentFlowId;
    const nextFlowId = assets?.flow?.id || null;
    const flowChanged = previousFlowId !== nextFlowId;
    currentAssets = assets;
    currentFlowId = nextFlowId;
    if (flowChanged) {
      flowStarted = false;
      flowCompleted = false;
      interactionPage = null;
    }
    interactionPrompt.textContent = assets?.flow?.prompt || book.pagePrompt.replace("{page}", String(page));
    if (assets?.image) {
      interactionImage.src = assets.image;
      interactionImage.hidden = false;
    } else {
      interactionImage.hidden = true;
      interactionImage.removeAttribute("src");
    }
    setMediaSource(interactionAudio, assets?.audio || "");
    setMediaSource(beforeAudio, assets?.beforeAudio || assets?.audio || "");
    setMediaSource(afterAudio, assets?.afterAudio || "");
    setMediaSource(reactionAudio, assets?.reactionAudio || "");
    setMediaSource(hintAudio, assets?.hintAudio || "");
    playHintButton.disabled = !assets?.hintAudio;
    syncMusic(assets, false);
    updateFlowUi();
    const isAfterState = Boolean(assets?.flow && assets.flow.stage && assets.flow.stage !== "before");
    if (assets?.flow && isAfterState) {
      const enteredFlowAtAfterState = flowChanged || !flowStarted;
      if (enteredFlowAtAfterState) {
        flowStarted = true;
        interactionPage = currentPage;
        playSoundEffect(assets.flow.soundEffect || "success");
        playAudioSequence(
          [beforeAudio, afterAudio, reactionAudio],
          "互動後故事語音正在播放。",
          "再按一次就可以聽到這一頁的故事。",
          () => { flowCompleted = true; updateFlowUi(); }
        );
      } else if (interactionPage !== currentPage || previousPage !== currentPage) {
        interactionPage = currentPage;
        playSoundEffect(assets.flow.soundEffect || "success");
        playAudioSequence(
          [afterAudio, reactionAudio],
          "互動後故事語音正在播放。",
          "再按一次就可以聽到這一頁的故事。",
          () => { flowCompleted = true; updateFlowUi(); }
        );
      }
    } else if (!assets?.flow || !flowStarted) {
      flowStarted = Boolean(assets?.audio || assets?.beforeAudio);
      flowCompleted = false;
      playStoryAudio();
    }
    if (assets?.backgroundMusic && musicEnabled) syncMusic(assets, true);
  }

  function showBookDialog(id, page, score) {
    if (pendingBook || !BOOKS[id] || (selectedBookId && selectedBookId !== id)) return;
    pendingBook = { bookId: id, page, score };
    const book = BOOKS[id];
    const assets = assetPackFor(id);
    dialogTitle.textContent = `是「${book.title}」嗎？`;
    dialogText.textContent = selectedBookId === id ? "鏡頭找到你剛才選的這本書。按確認，故事會自己讀出來。" : "鏡頭看到這本書。按確認，故事會自己讀出來。";
    const cancelButton = $("#cancelBook");
    if (cancelButton) cancelButton.textContent = selectedBookId === id ? "重試這一本" : "不是這一本";
    if (assets?.confirm?.image) {
      dialogImage.src = assets.confirm.image;
      dialogImage.hidden = false;
    } else {
      dialogImage.hidden = true;
      dialogImage.removeAttribute("src");
    }
    if (assets?.confirm?.audio) {
      dialogAudio.src = assets.confirm.audio;
      dialogAudio.hidden = true;
      dialogAudio.load();
      dialogAudio.play().catch(() => {});
    }
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function activateBook(id, page) {
    if (!BOOKS[id]) return;
    selectedBookId = id;
    currentBookId = id;
    state.lastBook = id;
    if (!state.opened.includes(id)) state.opened.push(id);
    persist();
    workspace.hidden = false;
    title.textContent = BOOKS[id].title;
    summary.textContent = "故事文字會自動播放；想探索畫面時，再按玩法提示。";
    showPage(page, 1);
    recognitionStatus.textContent = `已確認 ${BOOKS[id].title}，開始伴讀。`;
  }

  function scan() {
    if (!recognitionEnabled) return;
    const entries = allSamples({ coverOnly: !currentBookId });
    if (!entries.length) {
      recognitionStatus.textContent = "這本書的辨識資料未載入，請重新開啟閱讀頁。";
      return;
    }
    const currentFrames = fingerprints();
    if (!currentFrames.length) return;
    let best = null;
    let secondBest = null;
    entries.forEach((entry) => currentFrames.forEach((current) => {
      const score = similarity(current, entry.sample);
      if (!best || score > best.score) {
        secondBest = best;
        best = { ...entry, score };
      } else if (!secondBest || score > secondBest.score) secondBest = { ...entry, score };
    }));
    const ambiguous = best && secondBest && best.bookId !== secondBest.bookId && best.score - secondBest.score < 0.04;
    if (!best || best.score < RECOGNITION_THRESHOLD || ambiguous) {
      resetRecognition();
      recognitionStatus.textContent = currentBookId
        ? "請把整頁書本放在鏡面畫面上半部中央，保持穩定。"
        : `請先把「${BOOKS[selectedBookId]?.title || "所選書本"}」的封面放在鏡面畫面上半部中央。`;
      return;
    }
    const key = currentBookId ? `${best.bookId}:${best.page}` : best.bookId;
    stableCount = stableKey === key ? stableCount + 1 : 1;
    stableKey = key;
    readout.textContent = `正在看 ${BOOKS[best.bookId].title} · ${Math.round(best.score * 100)}%`;
    if (stableCount < 3) {
      recognitionStatus.textContent = `正在確認 ${BOOKS[best.bookId].title}… (${stableCount}/3) 請保持穩定。`;
      return;
    }
    if (currentBookId !== best.bookId) {
      showBookDialog(best.bookId, best.page, best.score);
      return;
    }
    if (currentPage !== String(best.page)) showPage(best.page, best.score);
    recognitionStatus.textContent = `已認到 ${BOOKS[best.bookId].title} 第 ${best.page} 頁。`;
  }

  function startRecognition() {
    if (!cameraStream || !selectedBookId || !allSamples({ coverOnly: !currentBookId }).length) return;
    stopRecognition(false);
    recognitionEnabled = true;
    detectButton.disabled = true;
    recognitionStatus.textContent = currentBookId
      ? "正在找下一頁…"
      : `正在確認「${BOOKS[selectedBookId]?.title || "所選書本"}」封面…`;
    scan();
    recognitionTimer = window.setInterval(scan, 900);
  }

  function stopRecognition(updateStatus = true) {
    if (recognitionTimer) window.clearInterval(recognitionTimer);
    recognitionTimer = null;
    recognitionEnabled = false;
    if (updateStatus && cameraStream) recognitionStatus.textContent = "已暫停找書。";
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraStatus.textContent = "此裝置不支援前鏡頭，請改用較新的瀏覽器。";
      return;
    }
    if (cameraStream) {
      startRecognition();
      return;
    }
    try {
      unlockAudio();
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      video.srcObject = cameraStream;
      await video.play();
      empty.hidden = true;
      startButton.disabled = true;
      stopButton.disabled = false;
      cameraStatus.textContent = "前鏡頭已開啟，請把鏡面中的書頁放在畫面上半部中央。";
      startRecognition();
    } catch (error) {
      cameraStream = null;
      const reason = error?.name === "NotAllowedError" ? "你拒絕了前鏡頭權限。" : error?.name === "NotFoundError" ? "找不到可用的前鏡頭。" : "前鏡頭暫時無法啟動。";
      cameraStatus.textContent = `${reason} 請在 HTTPS 或 localhost 開啟。`;
    }
  }

  function stopCamera() {
    stopRecognition(false);
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    video.srcObject = null;
    empty.hidden = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    cameraStatus.textContent = "相機已停止。按開始閱讀再試一次。";
    stopStoryMedia();
    stopMedia(hintAudio);
    clearMusic();
  }

  function openDetection() {
    if (!selectedBookId || !BOOKS[selectedBookId]) {
      workspace.hidden = true;
      childWelcome.hidden = false;
      renderChildWelcome();
      return;
    }
    currentBookId = null;
    workspace.hidden = false;
    const selected = BOOKS[selectedBookId];
    title.textContent = "把書放到鏡子前";
    summary.textContent = `${selected.title} · 請把封面放在畫面上半部中央；鏡頭只會核對這一本。`;
    resetRecognition();
    resetInteraction();
    if (cameraStream) startRecognition();
  }

  function renderChildWelcome() {
    if (!childWelcome || !childBookName || !childStart) return;
    const selected = selectedBookId && BOOKS[selectedBookId] ? BOOKS[selectedBookId] : null;
    childBookName.textContent = selected
      ? `今天讀「${selected.title}」。選定後，鏡頭只會找這一本，不會跳去問其他故事。`
      : "先選一本故事。選定後，鏡頭只會找這一本；確認封面後，故事會自己讀出來。";
    childStart.disabled = !selected;
    childStart.textContent = selected ? `開始讀「${selected.title}」　→` : "先選一本書";
    if (childBookPicker) childBookPicker.hidden = Boolean(REQUESTED_BOOK_ID && selected);
    document.querySelectorAll("[data-child-book]").forEach((node) => {
      node.classList.toggle("selected", node.dataset.childBook === selectedBookId);
      node.setAttribute("aria-pressed", node.dataset.childBook === selectedBookId ? "true" : "false");
    });
  }

  function chooseChildBook(id) {
    if (!BOOKS[id]) return;
    selectedBookId = id;
    renderChildWelcome();
  }

  function showChildWelcome() {
    stopCamera();
    currentBookId = null;
    pendingBook = null;
    workspace.hidden = true;
    childWelcome.hidden = false;
    renderChildWelcome();
  }

  function wireAudio() {
    [interactionAudio, beforeAudio, afterAudio, reactionAudio].filter(Boolean).forEach((media) => {
      media.addEventListener("play", () => { stopMedia(hintAudio); setMusicDucked(true); });
      media.addEventListener("pause", () => setMusicDucked(false));
      media.addEventListener("ended", () => setMusicDucked(false));
    });
    hintAudio?.addEventListener("play", () => { stopStoryMedia(); setMusicDucked(true); });
    hintAudio?.addEventListener("pause", () => setMusicDucked(false));
    hintAudio?.addEventListener("ended", () => setMusicDucked(false));
    backgroundMusic?.addEventListener("error", () => {});
    toggleMusicButton?.addEventListener("click", () => {
      if (!musicSource) return;
      musicEnabled = !musicEnabled;
      if (!musicEnabled) stopMedia(backgroundMusic);
      else backgroundMusic.play().catch(() => {});
      updateMusicButton();
    });
  }

  function setup() {
    document.body.classList.add("child-mode");
    const cameraNote = document.querySelector(".grid > .card:first-child .card-head p");
    const cameraLabel = document.querySelector(".readout span");
    if (cameraNote) cameraNote.textContent = "鏡面反射後由程式水平校正；相機影像只在本機取樣，不錄影、不上傳。";
    if (cameraLabel) cameraLabel.textContent = "MIRROR · CORRECTED";
    [$("#saveSample"), $("#clearSamples"), detectButton, stopButton].forEach((node) => { if (node) node.hidden = true; });
    document.querySelectorAll("[data-child-book]").forEach((node) => {
      node.addEventListener("click", () => chooseChildBook(node.dataset.childBook));
    });
    renderChildWelcome();
    childWelcome.hidden = false;
    childStart.addEventListener("click", () => {
      if (!selectedBookId) return;
      childWelcome.hidden = true;
      openDetection();
      startCamera();
    });
    startButton.addEventListener("click", startCamera);
    stopButton.addEventListener("click", stopCamera);
    changeBookButton?.addEventListener("click", showChildWelcome);
    $("#closeWorkspace")?.addEventListener("click", () => { stopCamera(); workspace.hidden = true; });
    $("#confirmBook").addEventListener("click", () => {
      if (!pendingBook) return;
      const item = pendingBook;
      pendingBook = null;
      stopMedia(dialogAudio);
      if (dialog.open) dialog.close();
      activateBook(item.bookId, item.page);
    });
    $("#cancelBook").addEventListener("click", () => {
      pendingBook = null;
      stopMedia(dialogAudio);
      if (dialog.open) dialog.close();
      resetRecognition();
      recognitionStatus.textContent = selectedBookId ? `再找一次「${BOOKS[selectedBookId].title}」的封面。` : "再找一次書本。";
    });
    dialog.addEventListener("cancel", () => { pendingBook = null; stopMedia(dialogAudio); resetRecognition(); });
    speakButton?.addEventListener("click", (event) => { event.preventDefault(); playStoryAudio(); });
    interactionAction?.addEventListener("click", (event) => { event.preventDefault(); completeInteraction(); });
    playHintButton?.addEventListener("click", (event) => { event.preventDefault(); playHintAudio(); });
    markComplete?.addEventListener("click", () => {
      if (!currentBookId) return;
      state.completed = state.completed.includes(currentBookId) ? state.completed.filter((id) => id !== currentBookId) : [...state.completed, currentBookId];
      persist();
    });
    wireAudio();
    resetInteraction();
  }

  setup();
  window.addEventListener("beforeunload", stopCamera);
})();
