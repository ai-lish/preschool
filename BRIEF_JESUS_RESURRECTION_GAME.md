# 耶穌復活遊戲 — 項目簡報

## 基本資料
| 項目 | 內容 |
|------|------|
| 名稱 | 耶穌復活 |
| 檔案 | `jesus_resurrection_game.html` |
| URL | https://ai-lish.github.io/preschool/jesus_resurrection_game.html |
| GitHub | `ai-lish/preschool` (main branch) |
| 語言 | 粵/簡/英/日（4語言）|

---

## 故事結構

| 日 | 主題 | 互動方式 |
|----|------|----------|
| 第1日 | 棕枝主日 | 點擊驢仔進入耶路撒冷 🐴🌿 |
| 第2日 | 最後晚餐 | 點擊麵包和杯 🍞🍷 |
| 第3日 | 十架犧牲 | 點擊十字架 + 點擊心 ❤️ |
| 第4日 | 空坟墓 | 點擊坟墓，石頭打開 💎 |
| 第5日 | 耶穌復活 | 點擊天使，耶穌顯現 ✝️👼 |

---

## 核心訊息
- **耶穌為我死**：耶穌愛我哋，願意為我犧牲
- **耶穌復活得勝**：耶穌战勝死亡，第三日復活
- **主耶穌再嚟**：耶穌應許，我哋有一天也會復活

---

## 技術架構

### 音頻策略
- URL: `https://raw.githubusercontent.com/ai-lish/preschool/main/audio/jesus_resurrection/`
- 命名: `{key}_{lang}.mp3`（如 `r1Narr_zhHK.mp3`）
- 音頻 key: `r1Narr`, `r1Hint`, `r1Fail`, `r1Success`, `r2Narr` 等

### Voice IDs
| 語言 | Voice ID |
|------|----------|
| 粵語 | `Cantonese_GentleLady` |
| 國語 | `female-tianmei` |
| 英文 | `English_Trustworthy_Man` |
| 日文 | `Japanese_KindLady` |

---

## 圖片需求清單

### icon（1張）
- 耶穌復活 icon — 空坟墓 + 光明 ✝️🌅

### 場景圖（5張）
- `scene1_palm.png` — 群眾拿棕櫚枝和衣服铺路，耶穌騎驢進城
- `scene2_supper.png` — 最後晚餐，耶穌與門徒坐在一起
- `scene3_cross.png` — 耶穌在十字架上，太陽黑暗
- `scene4_tomb.png` — 空坟墓，大石頭滾開，光明照入
- `scene5_appear.png` — 耶穌顯現，天使在空中

### 角色圖（4張）
- `jesus_on_donkey.png` — 耶穌騎驢，溫柔慈祥
- `jesus_cross.png` — 耶穌在十字架上
- `jesus_alive.png` — 復活的耶穌，光明溫暖
- `angel.png` — 天使，白衣，光芒

### 物品圖（3張）
- `palm_branch.png` — 棕櫚枝（群眾拿着）
- `bread_cup.png` — 聖餐的餅和杯
- `donkey.png` — 驢仔

### 背景圖（2張）
- `bg_jerusalem.png` — 耶路撒冷城
- `bg_tomb.png` — 坟墓內外

---

## 代碼關鍵函數

| 函數 | 功能 |
|------|------|
| `goToDay(n)` | 跳轉到指定日 |
| `completeDay(day)` | 完成指定日 |
| `playAudio(key)` | 播放音頻 |
| `showFeedback(msg, type)` | 顯示成功/失敗反饋 |
| `r1EnterJerusalem()` | 點擊驢仔進城動畫 |
| `r2LastSupper()` | 點擊餅和杯動畫 |
| `r3OnCross()` | 點擊十字架動畫 |
| `r4OpenTomb()` | 石頭滾開動畫 |
| `r5JesusAppear()` | 耶穌顯現動畫 |

---

## 檔案結構
```
preschool/
├── jesus_resurrection_game.html   # 主遊戲
├── index.html              # 首頁（故事分類）
├── audio/jesus_resurrection/    # 耶穌復活音頻
│   ├── r1Narr_zhHK.mp3
│   ├── r1Hint_zhHK.mp3
│   └── ...
└── img/
    ├── jesus-resurrection-icon.png
    └── jesus_resurrection/
        ├── scene1_palm.png
        ├── scene2_supper.png
        ├── scene3_cross.png
        ├── scene4_tomb.png
        ├── scene5_appear.png
        ├── jesus_on_donkey.png
        ├── jesus_cross.png
        ├── jesus_alive.png
        ├── angel.png
        ├── palm_branch.png
        ├── bread_cup.png
        ├── donkey.png
        ├── bg_jerusalem.png
        └── bg_tomb.png
```

---

## 家長提示「知心一點點」

| Day | 提示 | 出處 |
|-----|------|------|
| 1 | 耶穌溫柔地騎驢進入，可借此討論「溫柔係點嘅？」| 馬太福音 21:5 |
| 2 | 耶穌為門徒洗腳，可借此討論「你願意服事人嗎？」| 約翰福音 13:34 |
| 3 | 耶穌為我犧牲，可借此討論「愛係願意為人付出」| 約翰福音 3:16 |
| 4 | 死亡唔係終點，可借此討論「复活係咩意思？」| 馬太福音 28:6 |
| 5 | 耶穌活在我哋心中，可借此討論「耶穌依舊活潑」| 約翰福音 11:25 |

---

## Learning Activities（學習活動）

| Day | 學習活動 | 內容 |
|-----|----------|------|
| 1 | 大小認知 | 比較驢仔與棕櫚枝 |
| 2 | 數數 | 數有多少個餅和杯 |
| 3 | 情感認知 | 邊個表情係「愛」？ |
| 4 | 方向認知 | 石頭打開，邊個方向打開？ |
| 5 | 情感認知 | 邊個表情係「開心」？ |

---

## 音頻文字稿（粵語）

### 第1日 Narr（r1Narr_zhHK）
「今日係棕枝主日，群眾拿着棕櫚枝和衣服，迎接耶穌進入耶路撒冷。大家都話：『和散那！奉主名來的是應當稱頌的！』耶穌騎住驢仔，好溫柔咁行入城。」

### 第1日 Hint（r1Hint_zhHK）
「試下點擊驢仔，幫耶穌進入耶路撒冷！」

### 第1日 Fail（r1Fail_zhHK）
「再點擊一次驢仔！」

### 第1日 Success（r1Success_zhHK）
「耶穌好溫柔咁進入耶路撒冷，群眾都好開心！」

### 第2日 Narr（r2Narr_zhHK）
「耶穌同門徒一齊食最後晚餐。耶穌拿起餅，祝福之後分給門徒，話：『這是我的身體。』然後拿起杯，話：『這是我的血，為你們流出。』耶穌為門徒洗腳，教他們要彼此相愛。」

### 第2日 Hint（r2Hint_zhHK）
「點擊餅和杯，與耶穌一齊領聖餐！」

### 第2日 Fail（r2Fail_zhHK）
「全部都要點擊！」

### 第2日 Success（r2Success_zhHK）
「餅和杯代表耶穌的愛，門徒們都好感動…」

### 第3日 Narr（r3Narr_zhHK）
「耶穌被人帶去十字架。佢背住十字架上山，然後被釘在上面。太陽黑暗了，大地震動。耶穌話：『父啊！我將我的靈魂交在你手裡。』然後耶穌為釘佢的人禱告：『父啊！赦免他們！』」

### 第3日 Hint（r3Hint_zhHK）
「點擊十字架，然後點擊心心，感受耶穌的愛！」

### 第3日 Fail（r3Fail_zhHK）
「再點擊一次！」

### 第3日 Success（r3Success_zhHK）
「耶穌為我哋犧牲，佢既愛好大好大！」

### 第4日 Narr（r4Narr_zhHK）
「有人把耶穌的身體放在山洞裡的坟墓，用大石頭擋住门口。但係第三日清晨，天使來了！天使搖動大石頭，光明照入坟墓，話：『他不在這裡，已經復活了！』」

### 第4日 Hint（r4Hint_zhHK）
「點擊大石頭，讓天使打開坟墓！」

### 第4日 Fail（r4Fail_zhHK）
「再點擊一次！」

### 第4日 Success（r4Success_zhHK）
「坟墓係空既！耶穌已經復活喇！天使話：『他已經復活了！』」

### 第5日 Narr（r5Narr_zhHK）
「耶穌向門徒顯現，話：『願你們平安！』然後耶穌升天，坐在天父右邊。但耶穌應許：『我去原是為你們預備地方，我必再來接你們到我那裡去！』」

### 第5日 Hint（r5Hint_zhHK）
「點擊天使，迎接復活的耶穌！」

### 第5日 Fail（r5Fail_zhHK）
「再點擊一次！」

### 第5日 Success（r5Success_zhHK）
「耶穌活喇！佢應許會再嚟，永遠與我哋在一起！」

### Summary（rSummary_zhHK）
「今日我哋學了耶穌復活既故事。耶穌為我哋死，但第三日復活喇！耶穌話：『我是復活，我是生命。』死亡唔係終點，因為耶穌已戰勝死亡！我哋有一天也會像耶穌一样復活，永遠與神在一起！」

---

## 備註
- 優先順序：圖片生成 → 音頻生成 → HTML 製作
- MiniMax Image-01 每日50張配額，按優先順序使用
- 預計總圖片需求：15張（icon + 場景 + 角色 + 物品 + 背景）
- 耶穌復活係基督教核心故事，需要特別用心設計情感教育
