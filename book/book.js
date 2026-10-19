'use strict';

(() => {
  const STORAGE_KEY = 'preschool-coloring-book-v1';
  const MAX_STORAGE_BYTES = 3_500_000;
  const COLOR_SWATCHES = [
    { name: '紅色', color: '#f87171' }, { name: '橙色', color: '#fb923c' },
    { name: '黃色', color: '#facc15' }, { name: '綠色', color: '#86c99b' },
    { name: '藍色', color: '#60a5fa' }, { name: '紫色', color: '#c084fc' },
    { name: '啡色', color: '#a16207' }, { name: '黑色', color: '#28313b' },
  ];
  const LANGUAGES = {
    yue: {
      label: '粵語',
      matches: voice => /^yue(?:[-_]|$)/i.test(voice.lang || '')
        || (/^zh[-_]hk$/i.test(voice.lang || '') && /(粵語|粤语|cantonese|yue)/i.test(voice.name || '')),
      missing: '此裝置未找到粵語（香港）語音；此頁不會改用普通話代替。',
    },
    cmn: {
      label: '普通話',
      matches: voice => /^zh[-_](cn|tw|sg|mo)$/i.test(voice.lang || '') || /^cmn(?:[-_]|$)/i.test(voice.lang || ''),
      missing: '此裝置未找到普通話語音。請在裝置設定安裝普通話語音後重試。',
    },
    en: {
      label: 'English',
      matches: voice => /^en(?:[-_](us|gb|au|ca|nz|ie|za))?$/i.test(voice.lang || ''),
      missing: 'No English voice was found on this device.',
    },
  };
  const pages = window.K2_BOOK_PAGES;
  if (!Array.isArray(pages) || !pages.length) return;

  const $ = id => document.getElementById(id);
  const appFrame = $('appFrame');
  const worksheet = $('worksheet');
  const svgHost = $('svgHost');
  const artStage = $('artStage');
  const paintCanvas = $('paintCanvas');
  const paintContext = paintCanvas.getContext('2d');
  const writingCanvas = $('writingCanvas');
  const writingContext = writingCanvas.getContext('2d');
  let pageId = pages[0].id;
  let language = 'yue';
  let tool = 'fill';
  let brushColor = COLOR_SWATCHES[4].color;
  let currentWorkId = null;
  let dirty = false;
  let drawing = null;
  let voiceList = [];
  let voiceListReady = false;
  let voiceTimeout = null;
  let speechSequence = 0;
  let writingState = 'trace';
  let undoStack = [];
  let redoStack = [];
  let paintState = emptyPaintState();

  function emptyPaintState() {
    return { fills: {}, artStrokes: [], writingStrokes: [], writingMode: 'trace' };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function currentPage() {
    return pages.find(page => page.id === pageId) || pages[0];
  }

  function setStatus(message, kind = '') {
    const status = $('saveStatus');
    status.textContent = message;
    status.className = `save-status ${kind}`.trim();
  }

  function setDirty() {
    dirty = true;
    setStatus('有未儲存修改', '');
    $('exportWork').disabled = false;
  }

  function clearDirty() {
    dirty = false;
    setStatus(currentWorkId ? '已儲存到此瀏覽器' : '尚未儲存', currentWorkId ? 'saved' : '');
    $('exportWork').disabled = false;
  }

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `work-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function validColor(value) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  }

  function cleanStrokes(strokes) {
    if (!Array.isArray(strokes)) return [];
    return strokes.slice(-700).map(stroke => {
      if (!stroke || !Array.isArray(stroke.points)) return null;
      const points = stroke.points.slice(-12000).filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y))
        .map(point => ({ x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) }));
      if (!points.length) return null;
      return {
        color: validColor(stroke.color) ? stroke.color : '#28313b',
        size: Math.max(4, Math.min(44, Number(stroke.size) || 12)),
        erase: stroke.erase === true,
        points,
      };
    }).filter(Boolean);
  }

  function cleanPaintState(input) {
    const result = emptyPaintState();
    if (!input || typeof input !== 'object') return result;
    if (input.fills && typeof input.fills === 'object') {
      Object.entries(input.fills).forEach(([key, value]) => {
        if (/^[a-z0-9-]{1,50}$/i.test(key) && validColor(value)) result.fills[key] = value;
      });
    }
    result.artStrokes = cleanStrokes(input.artStrokes);
    result.writingStrokes = cleanStrokes(input.writingStrokes);
    result.writingMode = ['strokes', 'trace', 'free'].includes(input.writingMode) ? input.writingMode : 'trace';
    return result;
  }

  function validRecord(record) {
    return Boolean(record && typeof record === 'object' && pages.some(page => page.id === record.pageId) && record.state);
  }

  function readLibrary() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(validRecord).slice(0, 100).map(record => ({
        id: String(record.id || newId()),
        pageId: record.pageId,
        title: String(record.title || '我的畫冊').slice(0, 60),
        updatedAt: String(record.updatedAt || ''),
        state: cleanPaintState(record.state),
      }));
    } catch (error) {
      return [];
    }
  }

  let library = readLibrary();

  function libraryBytes(items = library) {
    return new Blob([JSON.stringify(items)]).size;
  }

  function updateStorageUsage() {
    const bytes = libraryBytes();
    const size = bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    let text = `${library.length} 件作品 · 約 ${size}（只存在此瀏覽器）`;
    if (bytes > 2_500_000) text += '；空間接近上限，請匯出備份';
    $('storageUsage').textContent = text;
  }

  function writeLibrary(nextLibrary) {
    const serialized = JSON.stringify(nextLibrary);
    const bytes = new Blob([serialized]).size;
    if (bytes > MAX_STORAGE_BYTES) {
      setStatus('儲存失敗：作品已超出本頁的建議容量，請先匯出備份或刪除舊作品。', 'error');
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
      library = nextLibrary;
      updateStorageUsage();
      return true;
    } catch (error) {
      setStatus('儲存失敗：此瀏覽器空間不足或停用了本機儲存。請先匯出作品檔，再釋出空間。', 'error');
      return false;
    }
  }

  function renderPageTabs() {
    const picker = $('pagePicker');
    picker.replaceChildren();
    pages.forEach((page, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'page-tab';
      button.dataset.page = page.id;
      button.setAttribute('aria-pressed', String(page.id === pageId));
      button.textContent = `${index + 1} · ${page.label}`;
      if (page.id === pageId) button.classList.add('active');
      button.addEventListener('click', () => switchPage(page.id));
      picker.append(button);
    });
  }

  function renderPage() {
    const page = currentPage();
    cancelSpeech();
    renderPageTabs();
    svgHost.innerHTML = page.svg;
    $('paperTitle').textContent = page.label;
    $('paperInstruction').textContent = `給${page.word}塗上喜歡的顏色，再聽一聽。`;
    $('pageNumber').textContent = `示範 ${pages.indexOf(page) + 1} / ${pages.length}`;
    $('lessonTitle').textContent = page.word;
    $('heroCharacter').textContent = page.character;
    $('writingChar').textContent = page.character;
    $('traceCharacter').textContent = page.character;
    $('paperFooterCharacter').textContent = page.label;
    $('lessonExplainer').textContent = page.explainer;
    updateWritingModeUI();
    renderSpeechText();
    renderPaintState();
    setTool(tool);
  }

  function renderSpeechText() {
    const words = currentPage().sentences[language];
    $('spokenWord').textContent = words.word;
    $('spokenSentence').textContent = words.sentence;
    refreshVoiceControls();
  }

  function switchPage(nextPageId) {
    if (nextPageId === pageId) return;
    if (dirty && !window.confirm('目前的修改尚未儲存。仍要切換到另一頁嗎？')) return;
    pageId = nextPageId;
    currentWorkId = null;
    paintState = emptyPaintState();
    writingState = 'trace';
    setDefaultTitle();
    resetHistory();
    clearDirty();
    renderPage();
  }

  function setDefaultTitle() {
    $('workTitle').value = `我的「${currentPage().character}」畫冊`;
  }

  function markUndoPoint() {
    undoStack.push(clone(paintState));
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
    updateHistoryButtons();
  }

  function resetHistory() {
    undoStack = [];
    redoStack = [];
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $('undo').disabled = !undoStack.length;
    $('redo').disabled = !redoStack.length;
    $('undoWriting').disabled = !paintState.writingStrokes.length;
  }

  function renderPaintState() {
    const fills = paintState.fills || {};
    svgHost.querySelectorAll('[data-fill]').forEach(region => {
      const fill = fills[region.getAttribute('data-fill')];
      if (fill) region.style.setProperty('--region-fill', fill);
      else region.style.removeProperty('--region-fill');
    });
    redrawCanvas(paintCanvas, paintContext, paintState.artStrokes, 760, 560);
    redrawCanvas(writingCanvas, writingContext, paintState.writingStrokes, 960, 560);
    updateWritingModeUI();
    updateHistoryButtons();
  }

  function canvasSize(canvas, context, logicalWidth, logicalHeight) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return { width, height, scaleX: width / logicalWidth, scaleY: height / logicalHeight };
  }

  function redrawCanvas(canvas, context, strokes, logicalWidth, logicalHeight) {
    const size = canvasSize(canvas, context, logicalWidth, logicalHeight);
    context.clearRect(0, 0, size.width, size.height);
    strokes.forEach(stroke => {
      if (!stroke.points.length) return;
      const points = stroke.points;
      const lineWidth = stroke.size * size.scaleX;
      context.save();
      context.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
      context.strokeStyle = stroke.color;
      context.fillStyle = stroke.color;
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      if (points.length === 1) {
        const x = points[0].x * size.width;
        const y = points[0].y * size.height;
        context.beginPath();
        context.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.beginPath();
        context.moveTo(points[0].x * size.width, points[0].y * size.height);
        for (let index = 1; index < points.length; index += 1) {
          context.lineTo(points[index].x * size.width, points[index].y * size.height);
        }
        context.stroke();
      }
      context.restore();
    });
  }

  function setTool(nextTool) {
    tool = nextTool;
    artStage.classList.toggle('draw-mode', tool !== 'fill');
    appFrame.classList.toggle('is-brush', tool === 'brush');
    appFrame.classList.toggle('is-eraser', tool === 'eraser');
    document.querySelectorAll('[data-tool]').forEach(button => {
      const selected = button.dataset.tool === tool;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function buildPalette() {
    const palette = $('palette');
    COLOR_SWATCHES.forEach(swatch => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-chip';
      button.style.backgroundColor = swatch.color;
      button.title = swatch.name;
      button.setAttribute('aria-label', swatch.name);
      button.setAttribute('aria-pressed', String(brushColor === swatch.color));
      button.addEventListener('click', () => {
        brushColor = swatch.color;
        palette.querySelectorAll('.color-chip').forEach(chip => chip.setAttribute('aria-pressed', String(chip === button)));
      });
      palette.append(button);
    });
  }

  function beginStroke(event, targetCanvas) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    const rect = targetCanvas.getBoundingClientRect();
    markUndoPoint();
    const stroke = {
      color: targetCanvas === paintCanvas && tool === 'eraser' ? '#ffffff' : brushColor,
      size: targetCanvas === paintCanvas && tool === 'eraser' ? Math.max(32, Number($('brushSize').value) * 2) : Number($('brushSize').value),
      erase: targetCanvas === paintCanvas && tool === 'eraser',
      points: [{ x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }],
    };
    drawing = { canvas: targetCanvas, stroke, rect };
    if (targetCanvas === paintCanvas) paintState.artStrokes.push(stroke);
    else paintState.writingStrokes.push(stroke);
    targetCanvas.setPointerCapture(event.pointerId);
    renderPaintState();
    setDirty();
  }

  function continueStroke(event) {
    if (!drawing) return;
    event.preventDefault();
    const rect = drawing.canvas.getBoundingClientRect();
    drawing.stroke.points.push({
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    });
    renderPaintState();
  }

  function endStroke() {
    if (!drawing) return;
    drawing = null;
    setDirty();
  }

  paintCanvas.addEventListener('pointerdown', event => {
    if (tool === 'fill') return;
    beginStroke(event, paintCanvas);
  });
  writingCanvas.addEventListener('pointerdown', event => beginStroke(event, writingCanvas));
  [paintCanvas, writingCanvas].forEach(canvas => {
    canvas.addEventListener('pointermove', continueStroke);
    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointercancel', endStroke);
    canvas.addEventListener('lostpointercapture', endStroke);
  });

  svgHost.addEventListener('click', event => {
    if (tool !== 'fill') return;
    const region = event.target.closest('[data-fill]');
    if (!region) return;
    const regionId = region.getAttribute('data-fill');
    markUndoPoint();
    paintState.fills[regionId] = brushColor;
    renderPaintState();
    setDirty();
  });

  $('brushSize').addEventListener('change', () => {});
  document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => setTool(button.dataset.tool)));
  $('undo').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(clone(paintState));
    paintState = undoStack.pop();
    renderPaintState();
    setDirty();
  });
  $('redo').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(clone(paintState));
    paintState = redoStack.pop();
    renderPaintState();
    setDirty();
  });
  $('clearPicture').addEventListener('click', () => {
    if (!Object.keys(paintState.fills).length) return;
    markUndoPoint();
    paintState.fills = {};
    renderPaintState();
    setDirty();
  });
  $('undoWriting').addEventListener('click', () => {
    if (!paintState.writingStrokes.length) return;
    markUndoPoint();
    paintState.writingStrokes.pop();
    renderPaintState();
    setDirty();
  });
  $('clearWriting').addEventListener('click', () => {
    if (!paintState.writingStrokes.length) return;
    markUndoPoint();
    paintState.writingStrokes = [];
    renderPaintState();
    setDirty();
  });

  function updateWritingModeUI() {
    writingState = ['strokes', 'trace', 'free'].includes(paintState.writingMode) ? paintState.writingMode : 'trace';
    const radio = document.querySelector(`input[name="writingMode"][value="${writingState}"]`);
    if (radio) radio.checked = true;
    $('writingArea').classList.remove('mode-trace', 'mode-strokes', 'mode-free');
    $('writingArea').classList.add(`mode-${writingState}`);
    const hints = {
      strokes: '可先由家長示範，再一筆一劃慢慢寫；頁面不提供筆順示範或自動評分。',
      trace: '沿著淡色字描一描。頁面不提供筆順示範或自動評分。',
      free: '不看描字，試試自己寫；每個孩子的進度都不同。',
    };
    $('writingHint').textContent = hints[writingState];
  }
  document.querySelectorAll('input[name="writingMode"]').forEach(input => input.addEventListener('change', () => {
    if (input.value === paintState.writingMode) return;
    markUndoPoint();
    paintState.writingMode = input.value;
    updateWritingModeUI();
    setDirty();
  }));

  function findVoice(langKey) {
    const config = LANGUAGES[langKey];
    const candidates = voiceList.filter(voice => config.matches(voice));
    if (!candidates.length) return null;
    const preferred = { yue: ['yue-hk', 'zh-hk'], cmn: ['zh-cn', 'cmn-cn', 'zh-tw', 'zh-sg', 'zh-mo'], en: ['en-us', 'en-gb', 'en-au'] }[langKey];
    return candidates.find(voice => preferred.includes((voice.lang || '').toLowerCase().replace('_', '-')))
      || candidates.find(voice => voice.default)
      || candidates[0];
  }

  function refreshVoiceControls() {
    const config = LANGUAGES[language];
    const voice = findVoice(language);
    const buttons = [$('listenSequence'), $('replayWord'), $('replaySentence')];
    buttons.forEach(button => { button.disabled = !voice; });
    const status = $('voiceStatus');
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') {
      status.textContent = '此瀏覽器不支援 Web Speech 語音播放。';
      status.classList.add('unavailable');
      return;
    }
    if (voice) {
      status.textContent = `使用此裝置語音：${voice.name}（${voice.lang}）。切換語言或頁面會停止播放。`;
      status.classList.remove('unavailable');
    } else if (voiceListReady) {
      status.textContent = config.missing;
      status.classList.add('unavailable');
    } else {
      status.textContent = '正在檢查此裝置的語音…';
      status.classList.remove('unavailable');
    }
  }

  function loadVoices() {
    if (!('speechSynthesis' in window)) {
      voiceListReady = true;
      refreshVoiceControls();
      return;
    }
    const available = window.speechSynthesis.getVoices();
    if (available.length) {
      voiceList = available;
      voiceListReady = true;
      if (voiceTimeout) window.clearTimeout(voiceTimeout);
    }
    refreshVoiceControls();
  }

  function cancelSpeech() {
    speechSequence += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function utterance(text, voice, onend) {
    const item = new SpeechSynthesisUtterance(text);
    item.voice = voice;
    item.lang = voice.lang;
    item.rate = language === 'en' ? 0.82 : 0.78;
    item.onend = onend;
    item.onerror = event => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        $('voiceStatus').textContent = `語音播放失敗：${event.error || '未知原因'}。`;
        $('voiceStatus').classList.add('unavailable');
      }
    };
    return item;
  }

  function speakSingle(part) {
    cancelSpeech();
    const voice = findVoice(language);
    if (!voice) return refreshVoiceControls();
    const words = currentPage().sentences[language];
    window.speechSynthesis.speak(utterance(words[part], voice));
  }

  function playSequence() {
    cancelSpeech();
    const sequence = speechSequence;
    const voice = findVoice(language);
    if (!voice) return refreshVoiceControls();
    const words = currentPage().sentences[language];
    const next = () => {
      if (sequence !== speechSequence) return;
      window.speechSynthesis.speak(utterance(words.sentence, voice));
    };
    window.speechSynthesis.speak(utterance(words.word, voice, next));
  }

  $('listenSequence').addEventListener('click', playSequence);
  $('replayWord').addEventListener('click', () => speakSingle('word'));
  $('replaySentence').addEventListener('click', () => speakSingle('sentence'));
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.language === language) return;
    cancelSpeech();
    language = button.dataset.language;
    document.querySelectorAll('[data-language]').forEach(tab => tab.setAttribute('aria-selected', String(tab === button)));
    renderSpeechText();
  }));
  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    voiceTimeout = window.setTimeout(() => {
      voiceListReady = true;
      loadVoices();
      refreshVoiceControls();
    }, 1800);
  } else {
    voiceListReady = true;
    refreshVoiceControls();
  }

  function openRecord(record) {
    if (dirty && !window.confirm('目前的修改尚未儲存。開啟其他作品會放棄這些修改，仍要繼續嗎？')) return;
    pageId = record.pageId;
    currentWorkId = record.id;
    paintState = cleanPaintState(record.state);
    $('workTitle').value = String(record.title || '我的畫冊').slice(0, 60);
    resetHistory();
    clearDirty();
    renderPage();
    $('savedDrawer').hidden = true;
  }

  function renderLibrary() {
    const list = $('savedList');
    list.replaceChildren();
    if (!library.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-library';
      empty.textContent = '還未儲存作品。選好示範頁並完成畫畫後，按「儲存作品」。';
      list.append(empty);
    }
    library.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).forEach(record => {
      const page = pages.find(item => item.id === record.pageId);
      const item = document.createElement('li');
      item.className = 'saved-item';
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'open-saved';
      const title = document.createElement('strong');
      title.textContent = record.title;
      const meta = document.createElement('small');
      const dateText = record.updatedAt ? new Date(record.updatedAt).toLocaleString('zh-HK', { dateStyle: 'short', timeStyle: 'short' }) : '日期未記錄';
      meta.textContent = `${page ? page.label : '畫冊'} · ${dateText}`;
      open.append(title, meta);
      open.addEventListener('click', () => openRecord(record));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'delete-saved';
      remove.textContent = '刪除';
      remove.setAttribute('aria-label', `刪除作品：${record.title}`);
      remove.addEventListener('click', () => {
        if (!window.confirm(`確定刪除「${record.title}」？刪除後無法在此瀏覽器復原。請先匯出備份。`)) return;
        const updated = library.filter(entry => entry.id !== record.id);
        if (!writeLibrary(updated)) return;
        if (currentWorkId === record.id) {
          currentWorkId = null;
          paintState = emptyPaintState();
          setDefaultTitle();
          resetHistory();
          clearDirty();
          renderPage();
        }
        renderLibrary();
      });
      item.append(open, remove);
      list.append(item);
    });
    updateStorageUsage();
    $('exportWork').disabled = false;
  }

  function saveWork() {
    const title = $('workTitle').value.trim().slice(0, 60) || `我的「${currentPage().character}」畫冊`;
    const record = {
      id: currentWorkId || newId(), pageId, title,
      updatedAt: new Date().toISOString(), state: cleanPaintState(paintState),
    };
    const index = library.findIndex(entry => entry.id === record.id);
    const next = library.slice();
    if (index >= 0) next[index] = record;
    else next.unshift(record);
    if (!writeLibrary(next)) return;
    currentWorkId = record.id;
    dirty = false;
    setStatus('已儲存到此瀏覽器', 'saved');
    $('exportWork').disabled = false;
    renderLibrary();
  }

  $('saveWork').addEventListener('click', saveWork);
  $('workTitle').addEventListener('input', setDirty);
  $('showLibrary').addEventListener('click', () => {
    renderLibrary();
    $('savedDrawer').hidden = false;
    $('savedDrawer').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('closeLibrary').addEventListener('click', () => { $('savedDrawer').hidden = true; });
  $('newWork').addEventListener('click', () => {
    if (dirty && !window.confirm('目前的修改尚未儲存。建立新作品會放棄這些修改，仍要繼續嗎？')) return;
    currentWorkId = null;
    paintState = emptyPaintState();
    writingState = 'trace';
    document.querySelector('input[name="writingMode"][value="trace"]').checked = true;
    setDefaultTitle();
    resetHistory();
    clearDirty();
    renderPage();
    $('savedDrawer').hidden = true;
  });

  function downloadJson(record) {
    const data = {
      type: 'preschool-coloring-work', schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      work: { id: record.id, pageId: record.pageId, title: record.title, updatedAt: record.updatedAt, state: record.state },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${record.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 50) || 'picture-book'}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $('exportWork').addEventListener('click', () => {
    const saved = library.find(entry => entry.id === currentWorkId);
    const record = saved || {
      id: currentWorkId || newId(), pageId,
      title: $('workTitle').value.trim().slice(0, 60) || `我的「${currentPage().character}」畫冊`,
      updatedAt: new Date().toISOString(), state: cleanPaintState(paintState),
    };
    downloadJson(record);
  });
  $('importFile').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 4_000_000) throw new Error('作品檔超過 4 MB，請先確認檔案。');
      const data = JSON.parse(await file.text());
      if (data.type !== 'preschool-coloring-work' || data.schemaVersion !== 1 || !validRecord(data.work)) {
        throw new Error('這不是可辨識的小小畫冊作品備份檔。');
      }
      const source = data.work;
      const record = {
        id: newId(), pageId: source.pageId,
        title: `${String(source.title || '匯入作品').slice(0, 52)}（匯入）`,
        updatedAt: new Date().toISOString(), state: cleanPaintState(source.state),
      };
      if (!writeLibrary([record, ...library])) return;
      renderLibrary();
      openRecord(record);
      setStatus('已匯入並儲存；仍只在此瀏覽器', 'saved');
    } catch (error) {
      setStatus(`匯入失敗：${error.message || '檔案格式不正確。'}`, 'error');
    } finally {
      event.target.value = '';
    }
  });

  function setPrintModeClass() {
    const selected = document.querySelector('input[name="printMode"]:checked')?.value || 'original';
    worksheet.classList.toggle('print-original', selected === 'original');
  }
  document.querySelectorAll('input[name="printMode"]').forEach(input => input.addEventListener('change', setPrintModeClass));
  $('printPage').addEventListener('click', () => {
    setPrintModeClass();
    window.print();
  });
  window.addEventListener('beforeprint', setPrintModeClass);
  window.addEventListener('resize', renderPaintState);
  window.addEventListener('beforeunload', event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  buildPalette();
  setDefaultTitle();
  renderPage();
  renderLibrary();
  clearDirty();
})();
