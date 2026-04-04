# 🌱 幼兒聖經故事平台

為 K1-K3（3-6歲）幼兒設計的聖經故事互動學習平台，以**廣東話**主要語言，透過遊戲學習聖經故事和品格教育。

**線上試玩：** https://ai-lish.github.io/preschool/

---

## 📋 專案狀態

| 故事 | 遊戲 | 狀態 |
|------|------|------|
| 創造七日 | 互動故事 + 語音 | ✅ 完成 |
| 挪亞方舟 | 六日互動遊戲 | ✅ Day 2 卡通化 |
| 摩西過紅海 | - | 🔜 待建 |
| 大衛與歌利亞 | - | 🔜 待建 |
| 耶穌降生 | - | 🔜 待建 |

---

## 🎮 遊戲內容

### 📂 頁面結構

```
preschool/
├── index.html              # 主頁（聖經故事分類）
├── creation_game.html      # 創造七日遊戲（Day 1-6 + Day 7 休息日）
├── noah_game.html          # 挪亞方舟六日遊戲
└── audio/                  # 語音檔案（各遊戲音頻）
    ├── creation/           # 創造七日音頻
    └── noah/               # 挪亞方舟音頻
```

### 創造七日遊戲

| 日 | 主題 | 互動方式 |
|----|------|----------|
| Day 0 | 歡迎頁 | 揀語言、開始/離開 |
| Day 1 | 光 | 大聲講「要有光」出現光 |
| Day 2 | 天空 | 拖雲上天空、拖水落大海 |
| Day 3 | 陸地植物 | 點水聚水、陸地浮現、點擊發芽 |
| Day 4 | 太陽月亮星星 | 太陽→白天、星星→黑夜 |
| Day 5 | 魚和鳥 | 撈魚、搖樹搵雀 |
| Day 6 | 動物和人 | 點擊動物、對泥土吹氣創造亞當夏娃 |

### 挪亞方舟遊戲

| 日 | 主題 | 互動方式 |
|----|------|----------|
| Day 1 | 建造方舟 | 點擊 8 粒釘子建造方舟 |
| Day 2 | 動物登船 | 拖卡通動物到方舟，一對對上船（8對） |
| Day 3 | 大雨降臨 | 點擊 4 朵雲落雨 |
| Day 4 | 洪水氾濫 | 按鈕讓方舟漂浮 |
| Day 5 | 鴿子探路 | 放出鴿子🕊️ |
| Day 6 | 彩虹之約 | 點擊彩虹🌈完成 |

**卡通動物（Day 2）：**
- elephant.jpg, lion.jpg, wolf.jpg, sheep.jpg
- cow.jpg, horse.jpg, rabbit.jpg, deer.jpg
- 風格：K1幼教卡通，MiniMax Image-01 生成

---

## 🛠️ 技術架構

- **格式：** 獨立 HTML 檔案（無需後端）
- **圖片：** AI 生成（MiniMax Image-01），存於 GitHub repo
- **語音：** MiniMax Speech-2.8-HD TTS（粵/普/英/日）
- **字體：** Noto Sans TC + PingFang HK（支援廣東話）
- **目標瀏覽器：** Safari（iOS/macOS）
- **GitHub：** ai-lish/preschool

---

## 📚 設計文檔

| 文檔 | 用途 |
|------|------|
| `BIBLE_STORIES_DESIGN.md` | 聖經故事整體設計方向 |
| `NOAH_ARK_DESIGN.md` | 挪亞方舟詳細設計 |
| `BRIEF_NOH_ARK_GAME.md` | 挪亞方舟遊戲簡報 |
| `BRIEF_CREATION_GAME.md` | 創造七日遊戲簡報 |
| `IMAGE_GENERATION_PLAN.md` | 圖像生成優先計劃 |
| `ASSET_PLAN.md` | 素材管理計劃 |

---

## 🔧 已知問題

- ⚠️ 粵語 TTS：MiniMax `Cantonese_GentleLady` 並非真正粵語（實際為普通話口音）
- ⚠️ 日語音頻：挪亞方舟 n4-n6Narr/success + summary 仍缺
- ⚠️ 創造七日 Day 6：亞當夏娃未能成功觸發呼吸動畫

---

## 👥 團隊

- **發起人：** Zach Li（李老師）
- **Agent 團隊：** Boss（協調）、師弟（代碼）、T仔（測試）、小詩（評估）

---

## 📱 使用方式

用 Safari 打開：https://ai-lish.github.io/preschool/
