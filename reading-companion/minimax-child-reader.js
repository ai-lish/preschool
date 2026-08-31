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
  const frameCanvas = document.createElement("canvas");
  const frameContext = frameCanvas.getContext("2d", { willReadFrequently: true });
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
  const hintAudio = $("#hintAudio");
  const backgroundMusic = $("#backgroundMusic");
  const speakButton = $("#speakInteraction");
  const playHintButton = $("#playHint");
  const toggleMusicButton = $("#toggleMusic");
  const assetState = $("#assetState");
  const dialog = $("#bookDialog");
  const dialogAudio = $("#dialogAudio");
  const dialogTitle = $("#dialogTitle");
  const dialogText = $("#dialogText");
  const dialogImage = $("#dialogImage");
  const markComplete = $("#markComplete");

  let state = loadState();
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

  function allSamples() {
    const ids = REQUESTED_BOOK_ID && BOOKS[REQUESTED_BOOK_ID] ? [REQUESTED_BOOK_ID] : Object.keys(BOOKS);
    const list = [];
    ids.forEach((id) => Object.entries(centralSamplesFor(id)).forEach(([page, samples]) => {
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
    frameContext.putImageData(framePixels, 0, 0);
    const bounds = cropToPage ? detectPageBounds(framePixels.data) : null;
    if (bounds) context.drawImage(frameCanvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, width, height);
    else context.drawImage(frameCanvas, 0, 0, frameCanvas.width, frameCanvas.height, 0, 0, width, height);
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
    return { values: values.map((value) => Math.round(((value - mean) / deviation) * 100) / 100) };
  }

  function fingerprints() {
    if (!video.videoWidth || video.readyState < 2) return [];
    const full = drawFrame();
    const centre = drawFrame({ x: 0.09, y: 0.05, width: 0.82, height: 0.90 });
    const inner = drawFrame({ x: 0.16, y: 0.125, width: 0.68, height: 0.75 });
    return [
      fingerprintFromFrame(full),
      fingerprintFromFrame(centre),
      fingerprintFromFrame(inner),
      fingerprintFromFrame(full, true),
      fingerprintFromFrame(centre, true)
    ].filter(Boolean);
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
    return denominator ? (dot / denominator + 1) / 2 : 0;
  }

  function resetRecognition() {
    stableKey = null;
    stableCount = 0;
    if (readout) readout.textContent = "等待書頁";
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

  function playStoryAudio() {
    if (!interactionAudio?.src) {
      if (assetState) assetState.textContent = "這一頁的故事語音未準備好。";
      return;
    }
    stopMedia(hintAudio);
    interactionAudio.currentTime = 0;
    interactionAudio.play().catch(() => {
      if (assetState) assetState.textContent = "按「重播故事語音」就可以繼續聽。";
    });
  }

  function playHintAudio() {
    if (!hintAudio?.src) return;
    stopMedia(interactionAudio);
    hintAudio.currentTime = 0;
    hintAudio.play().catch(() => {
      if (assetState) assetState.textContent = "再按一次就可以播放玩法提示。";
    });
  }

  function resetInteraction() {
    currentPage = null;
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
    setMediaSource(hintAudio, "");
    if (playHintButton) playHintButton.disabled = true;
    if (assetState) assetState.textContent = "等待預製資產";
    clearMusic();
  }

  function showPage(page, score) {
    const book = BOOKS[currentBookId];
    if (!book || !page) return;
    currentPage = String(page);
    detectedLabel.textContent = "已確認書本 · 頁面辨識";
    detectedPage.textContent = `第 ${page} 頁${score ? ` · 信心 ${Math.round(score * 100)}%` : ""}`;
    interactionTitle.textContent = book.pageTitle;
    interactionIntro.textContent = book.intro;
    interactionPrompt.textContent = book.pagePrompt.replace("{page}", String(page));
    const assets = assetsFor(currentBookId, page);
    if (assets?.image) {
      interactionImage.src = assets.image;
      interactionImage.hidden = false;
    } else {
      interactionImage.hidden = true;
      interactionImage.removeAttribute("src");
    }
    setMediaSource(interactionAudio, assets?.audio || "");
    setMediaSource(hintAudio, assets?.hintAudio || "");
    playHintButton.disabled = !assets?.hintAudio;
    syncMusic(assets, false);
    assetState.textContent = assets?.audio ? (assets.hintAudio ? "故事語音會自動播放；想玩時再按玩法提示。" : "故事語音會自動播放。") : "這一頁的預製語音未準備好。";
    playStoryAudio();
    if (assets?.backgroundMusic && musicEnabled) syncMusic(assets, true);
  }

  function showBookDialog(id, page, score) {
    if (pendingBook || !BOOKS[id]) return;
    pendingBook = { bookId: id, page, score };
    const book = BOOKS[id];
    const assets = assetPackFor(id);
    dialogTitle.textContent = `是「${book.title}」嗎？`;
    dialogText.textContent = "鏡頭看到這本書。按確認，故事會自己讀出來。";
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
    const entries = allSamples();
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
    const ambiguous = best && secondBest && (best.bookId !== secondBest.bookId || best.page !== secondBest.page) && best.score - secondBest.score < 0.04;
    if (!best || best.score < 0.83 || ambiguous) {
      resetRecognition();
      recognitionStatus.textContent = "請把整頁書本放在鏡面畫面上半部中央，保持穩定。";
      return;
    }
    const key = `${best.bookId}:${best.page}`;
    stableCount = stableKey === key ? stableCount + 1 : 1;
    stableKey = key;
    readout.textContent = `正在看 ${BOOKS[best.bookId].title} · ${Math.round(best.score * 100)}%`;
    if (stableCount < 3) return;
    if (currentBookId !== best.bookId) {
      showBookDialog(best.bookId, best.page, best.score);
      return;
    }
    if (currentPage !== String(best.page)) showPage(best.page, best.score);
    recognitionStatus.textContent = `已認到 ${BOOKS[best.bookId].title} 第 ${best.page} 頁。`;
  }

  function startRecognition() {
    if (!cameraStream || !allSamples().length) return;
    stopRecognition(false);
    recognitionEnabled = true;
    detectButton.disabled = true;
    recognitionStatus.textContent = "正在找書本…找到後會請你確認。";
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
    stopMedia(interactionAudio);
    stopMedia(hintAudio);
    clearMusic();
  }

  function openDetection() {
    currentBookId = null;
    workspace.hidden = false;
    const selected = REQUESTED_BOOK_ID && BOOKS[REQUESTED_BOOK_ID] ? BOOKS[REQUESTED_BOOK_ID] : null;
    title.textContent = "把書放到鏡子前";
    summary.textContent = `${selected ? selected.title + " · " : ""}請把書頁放在畫面上半部中央；找到後會先請你確認。`;
    resetRecognition();
    resetInteraction();
    if (cameraStream) startRecognition();
  }

  function wireAudio() {
    interactionAudio?.addEventListener("play", () => { stopMedia(hintAudio); setMusicDucked(true); });
    interactionAudio?.addEventListener("pause", () => setMusicDucked(false));
    interactionAudio?.addEventListener("ended", () => setMusicDucked(false));
    hintAudio?.addEventListener("play", () => { stopMedia(interactionAudio); setMusicDucked(true); });
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
    const childWelcome = $("#childWelcome");
    const childBookName = $("#childBookName");
    const selected = REQUESTED_BOOK_ID && BOOKS[REQUESTED_BOOK_ID] ? BOOKS[REQUESTED_BOOK_ID] : null;
    if (selected) childBookName.textContent = `今天讀「${selected.title}」。按開始，將書放到鏡子前；確認後故事會自己讀出來。`;
    childWelcome.hidden = false;
    $("#childStart").addEventListener("click", () => {
      childWelcome.hidden = true;
      openDetection();
      startCamera();
    });
    startButton.addEventListener("click", startCamera);
    stopButton.addEventListener("click", stopCamera);
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
      recognitionStatus.textContent = "再找一次書本。";
    });
    dialog.addEventListener("cancel", () => { pendingBook = null; stopMedia(dialogAudio); resetRecognition(); });
    speakButton?.addEventListener("click", (event) => { event.preventDefault(); playStoryAudio(); });
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
