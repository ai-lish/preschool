# 創造七日遊戲 — 項目簡報

## 基本資料
| 項目 | 內容 |
|------|------|
| 名稱 | 神的創造 / 七日創造 |
| 檔案 | `creation_game.html` |
| URL | https://ai-lish.github.io/preschool/creation_game.html |
| GitHub | `ai-lish/preschool` (main branch) |
| 語言 | 粵/簡/英/日（4語言）|

---

## 故事結構

| 日 | 主題 | 互動方式 |
|----|------|----------|
| 第1日 | 光 | 對著咪高峰大聲說話，出現光 ☀️ |
| 第2日 | 天空 | 拖曳白雲上天空、拖水滴落地下 💧☁️ |
| 第3日 | 陸地植物 | 點擊累積 → 匯聚大地 → 長出植物結果 🌱🌳🍎 |
| 第4日 | 太陽月亮星星 | 拖太陽/月亮/星星到正確位置 🌞🌙⭐ |
| 第5日 | 魚和鳥 | 點擊魚網捕魚、點擊樹趕鳥出來 🐟🐦 |
| 第6日 | 動物和人 | 點擊動物、亞當出現、深呼吸3次、夏娃出現 👤 |

---

## 技術架構

### HTML
單一檔案，所有 CSS + JS 內嵌

### 音頻策略
- URL: `https://raw.githubusercontent.com/ai-lish/preschool/main/audio/creation/`
- 命名: `{key}_{lang}.mp3`（如 `d1Narr_zhHK.mp3`）
- 音頻 key: `d1Narr`, `d1Success`, `d2Narr`, `d2Success` 等

### Voice IDs
| 語言 | Voice ID |
|------|----------|
| 粵語 | `Cantonese_GentleLady` |
| 國語 | `female-tianmei` |
| 英文 | `English_Trustworthy_Man` |
| 日文 | `Japanese_KindLady` |

---

## 現有資源

### 音頻（52個）
- `audio/creation/` — Day 1-6 全部 narrations + feedbacks（4語言）

### 圖片
- `img/creation-icon.png` — 故事 icon（七日元素）
- 場景背景圖（花園、水下、果園等）

---

## 代碼關鍵函數

| 函數 | 功能 |
|------|------|
| `goToDay(n)` | 跳轉到指定日 |
| `completeDay1-6()` | 完成指定日 |
| `playAudio(key)` | 播放音頻 |
| `showFeedback(msg, type)` | 顯示成功/失敗反饋 |
| `startMic()` / `tickMic()` | 咪高峰音量檢測 |
| `applyLang()` | 應用語言切換 |

---

## 檔案結構
```
preschool/
├── creation_game.html     # 主遊戲
├── index.html            # 首頁（故事分類）
├── audio/creation/        # 創造遊戲音頻
│   ├── d1Narr_zhHK.mp3
│   ├── d1Success_zhHK.mp3
│   └── ...
└── img/
    ├── creation-icon.png
    └── creation/          # 背景圖
```

---

## 已知的問題/限制

1. **粵語 TTS** — MiniMax `Cantonese_GentleLady` 並非真正粵語，輸出實為普通話口音
2. **Day 1 音量阈值** — 已調整至 15（適用於移動設備）
3. **長按 Fallback** — 當咪高峰無法使用時，支援長按代替

---

## 總結

這是一個 **6日互動故事遊戲**，用於幼兒教育。每個 Day 有獨立的 narration + 互動任務 + 成功反饋。語言支援完整，但粵語 TTS 質量有待改善。
