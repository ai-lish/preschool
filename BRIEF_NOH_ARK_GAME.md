# 挪亞方舟遊戲 — 項目簡報

## 基本資料
| 項目 | 內容 |
|------|------|
| 名稱 | 挪亞方舟 |
| 檔案 | `noah_game.html` |
| URL | https://ai-lish.github.io/preschool/noah_game.html |
| GitHub | `ai-lish/preschool` (main branch) |
| 語言 | 粵/簡/英/日（4語言）|

---

## 故事結構

| 日 | 主題 | 互動方式 |
|----|------|----------|
| 第1日 | 建造方舟 | 點擊釘子建造方舟（8粒釘子）🔨🚢 |
| 第2日 | 動物登船 | 拖拉卡通動物，一對對上船（每物種 x2）🚢 |
| 第3日 | 大雨降臨 | 點擊雲朵落雨 🌧️ |
| 第4日 | 洪水氾濫 | 方舟漂浮 🌊 |
| 第5日 | 鴿子探路 | 放出鴿子 🕊️ |
| 第6日 | 彩虹之約 | 點擊彩虹完成！ 🌈 |

---

## 技術架構

### HTML
單一檔案，所有 CSS + JS 內嵌

### 音頻策略
- URL: `https://raw.githubusercontent.com/ai-lish/preschool/main/audio/noah/`
- 命名: `{key}_{lang}.mp3`（如 `n1Narr_zhHK.mp3`）
- 音頻 key: `n1Narr`, `n1Success`, `n2Narr`, `n2Success` 等

### Voice IDs
| 語言 | Voice ID |
|------|----------|
| 粵語 | `Cantonese_GentleLady` |
| 國語 | `female-tianmei` |
| 英文 | `English_Trustworthy_Man` |
| 日文 | `Japanese_KindLady` |

---

## 現有資源

### 音頻（33個）
- `audio/noah/` — Day 1-6 全部 narrations + feedbacks
- 粵語/英語音頻完整（各13個）
- 日語音頻部分缺失（n4-n6, summary 待補）

### 卡通動物圖片（8張）
- `img/noah/animals/elephant.jpg` — 大象
- `img/noah/animals/lion.jpg` — 獅子
- `img/noah/animals/wolf.jpg` — 狼
- `img/noah/animals/sheep.jpg` — 羊
- `img/noah/animals/cow.jpg` — 牛
- `img/noah/animals/horse.jpg` — 馬
- `img/noah/animals/rabbit.jpg` — 兔
- `img/noah/animals/deer.jpg` — 鹿
- 風格：K1幼教卡通，白背景，MiniMax Image-01 生成

### 場景圖片
- `img/noah-icon.png` — 故事 icon
- `img/noah/scene1_build.png` — 建造方舟場景
- `img/noah/scene2_animals.png` — 動物登船場景
- `img/noah/scene3_rain.png` — 大雨場景
- `img/noah/scene4_flood.png` — 洪水場景
- `img/noah/scene5_rainbow.png` — 彩虹場景

---

## 代碼關鍵函數

| 函數 | 功能 |
|------|------|
| `goToDay(n)` | 跳轉到指定日 |
| `completeDay(day)` | 完成指定日 |
| `playAudio(key)` | 播放音頻 |
| `showFeedback(msg, type)` | 顯示成功/失敗反饋 |
| `n5ReleaseDove()` | 放出鴿子 |
| `n6ClickRainbow()` | 點擊彩虹完成 |

---

## 檔案結構
```
preschool/
├── noah_game.html         # 主遊戲
├── index.html            # 首頁（故事分類）
├── audio/noah/           # 挪亞方舟音頻
│   ├── n1Narr_zhHK.mp3
│   ├── n1Success_zhHK.mp3
│   └── ...
└── img/
    ├── noah-icon.png
    └── noah/             # 場景圖片
        ├── scene1_build.png
        ├── scene2_animals.png
        ├── scene3_rain.png
        ├── scene4_flood.png
        └── scene5_rainbow.png
```

---

---

## 家長提示「知心一點點」

每個 Day 完成後顯示：

| Day | 提示 | 出處 |
|-----|------|------|
| 1 | 建造活動有助幼兒理解秩序和完成感。 | Montessori 教學法 |
| 2 | 配對遊戲有助分類概念和數學思維早期發展。 | Piaget 認知發展論 |
| 3 | 2-3歲幼兒對天氣現象好奇，可借此機會認識自然。 | 香港教育局 K1-K3 課程指引 |
| 4 | 水的浮力係物理概念，但可以從玩水活動感受。 | Montessori 教學法 |
| 5 | 鴿子係和平既象徵，可以借此教導和諧與分享。 | 美國兒科學會 |
| 6 | 彩虹係光既折射，有助幼兒理解光既特性。 | WHO 幼兒身體活動指引 |

---

## Learning Activities（學習活動）

每個 Day 完成後的嵌入式學習：

| Day | 學習活動 | 內容 |
|-----|----------|------|
| 1 | 數數 | 數釘子數量 |
| 2 | 配對 + 數數 | 配對動物 + 數每對有幾多隻 |
| 3 | 數數 | 數雨點/雲朵數量 |
| 4 | 分類 | 哪些會浮？哪些會沉？（浮性概念）|
| 5 | 數數 | 數鴿子放出幾次 |
| 6 | 數顏色 | 數彩虹有幾多隻顏色 |

---

## 已知的問題/限制

1. **粵語 TTS** — MiniMax `Cantonese_GentleLady` 並非真正粵語，輸出實為普通話口音
2. **日語音頻** — 部分文件因 rate limit 未生成

---

## 總結

這是一個 **6日互動故事遊戲**，用於幼兒教育。每個 Day 有獨立的 narration + 互動任務 + 成功反饋。遊戲框架完整，資源（圖片）已生成，音頻大部完成。
