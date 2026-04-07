# 浪子回頭遊戲 — 項目簡報

## 基本資料
| 項目 | 內容 |
|------|------|
| 名稱 | 浪子回頭 |
| 檔案 | `prodigal_son_game.html` |
| URL | https://ai-lish.github.io/preschool/prodigal_son_game.html |
| GitHub | `ai-lish/preschool` (main branch) |
| 語言 | 粵/簡/英/日（4語言）|

---

## 故事結構

| 日 | 主題 | 互動方式 |
|----|------|----------|
| 第1日 | 父親分家產 | 點擊分開两份禮物 🎁 |
| 第2日 | 小兒子遠走 | 拖曳脚步離開家 🏠→🌍 |
| 第3日 | 艱苦度日 | 點擊雨/風/飢餓 💧🌬️🍞 |
| 第4日 | 醒悟回家 | 點擊轉向，跑回家 🏃‍♂️ |
| 第5日 | 父親接納 | 抱抱+穿上新衣 👕👞 |

---

## 核心訊息
- **饒恕**：父親完全接納回頭的兒子
- **回家**：無論幾錯，回家最重要
- **父愛**：父親天天等候，唔放棄

---

## 技術架構

### 音頻策略
- URL: `https://raw.githubusercontent.com/ai-lish/preschool/main/audio/prodigal_son/`
- 命名: `{key}_{lang}.mp3`（如 `p1Narr_zhHK.mp3`）
- 音頻 key: `p1Narr`, `p1Hint`, `p1Fail`, `p1Success`, `p2Narr` 等

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
- 浪子回頭 icon — 父親攬住兒子 ❤️

### 場景圖（5張）
- `scene1_gift.png` — 父親分两份禮物俾兩個仔
- `scene2_leave.png` — 小兒子拿包袱離開
- `scene3_hard.png` — 流浪在外，風吹雨打
- `scene4_return.png` — 小兒子看見父親
- `scene5_embrace.png` — 父親攬住仔着新衣

### 角色圖（4張）
- `father.png` — 父親白髮慈祥
- `younger_son.png` — 小兒子
- `older_son.png` — 大仔着實穩重
- `younger_son_poor.png` — 小兒子流浪後破衣爛衫

### 物品圖（3張）
- `gift_1.png` — 金錢/財產（一份）
- `gift_2.png` — 金錢/財產（另一份）
- `new_clothes.png` — 全新袍子+鞋子

### 背景圖（2張）
- `bg_home.png` — 溫暖的家
- `bg_road.png` — 流浪既路

---

## 代碼關鍵函數

| 函數 | 功能 |
|------|------|
| `goToDay(n)` | 跳轉到指定日 |
| `completeDay(day)` | 完成指定日 |
| `playAudio(key)` | 播放音頻 |
| `showFeedback(msg, type)` | 顯示成功/失敗反饋 |
| `p2DragFeet()` | 拖曳脚圖標離開 |
| `p4TurnBack()` | 點擊转向跑回家 |
| `p5Embrace()` | 父子相擁動畫 |

---

## 檔案結構
```
preschool/
├── prodigal_son_game.html   # 主遊戲
├── index.html              # 首頁（故事分類）
├── audio/prodigal_son/     # 浪子回頭音頻
│   ├── p1Narr_zhHK.mp3
│   ├── p1Hint_zhHK.mp3
│   └── ...
└── img/
    ├── prodigal-son-icon.png
    └── prodigal_son/
        ├── scene1_gift.png
        ├── scene2_leave.png
        ├── scene3_hard.png
        ├── scene4_return.png
        ├── scene5_embrace.png
        ├── father.png
        ├── younger_son.png
        ├── older_son.png
        ├── younger_son_poor.png
        ├── gift_1.png
        ├── gift_2.png
        ├── new_clothes.png
        ├── bg_home.png
        └── bg_road.png
```

---

## 家長提示「知心一點點」

| Day | 提示 | 出處 |
|-----|------|------|
| 1 | 公平分享適合2-3歲，可借此討論「你鐘意分享嗎？」| 香港教育局 K1-K3 課程指引 |
| 2 | 離家冒險係幼兒常見心理，可借此討論「你幾時想自己試？」| Piaget 前運思期 |
| 3 | 吃苦後醒悟係學習方式，可借此討論「辛苦點算？」| Vygotsky 最近發展區 |
| 4 | 決定改變需要勇氣，可借此討論「知錯能改係好事」| 基督教教育 |
| 5 | 完全饒恕接納係神的性情，可借此認識父神既愛| 約翰福音 3:16 |

---

## Learning Activities（學習活動）

| Day | 學習活動 | 內容 |
|-----|----------|------|
| 1 | 數數 | 數两份禮物邊個多 |
| 2 | 方向認知 | 邊個方向係「離開」？ |
| 3 | 情感認知 | 邊個表情係「傷心」？ |
| 4 | 方向認知 | 邊個方向係「回家」？ |
| 5 | 情感認知 | 邊個表情係「開心」？ |

---

## 音頻文字稿（粵語）

### 第1日 Narr（p1Narr_zhHK）
「从前有個父親，兩個仔。大仔乖順喺屋企，細仔就想要分家產，自己出去闖。父親話：『好啦，你想清楚就好！』」

### 第1日 Hint（p1Hint_zhHK）
「試下點擊礼物，睇下父親分咗啲咩俾細仔！」

### 第1日 Fail（p1Fail_zhHK）
「再點擊一次！」

### 第1日 Success（p1Success_zhHK）
「細仔得到佢那份財產，準備離開屋企去外面闖喇！」

### 第2日 Narr（p2Narr_zhHK）
「細仔拿住財產，離開咗屋企。佢去咗好遠好遠嘅地方，任意放蕩，浪費曉所有金錢。」

### 第2日 Hint（p2Hint_zhHK）
「試下拖曳個脚圖標，一路拖向遠方！」

### 第2日 Fail（p2Fail_zhHK）
「拖遠啲！離開屋企先至可以繼續！」

### 第2日 Success（p2Success_zhHK）
「細仔離開咗屋企，唔記得咗屋企既溫暖…」

### 第3日 Narr（p3Narr_zhHK）
「後來遇著荒年，細仔生活好慘。佢幫人放豬，餓到想食豬既食物，但都冇得食。佢終於諗起屋企…」

### 第3日 Hint（p3Hint_zhHK）
「點擊風雨同飢餓，感受細仔既辛苦！」

### 第3日 Fail（p3Fail_zhHK）
「再點擊一次！」

### 第3日 Success（p3Success_zhHK）
「原來屋企既工人都有足夠既食物！細仔決定返去見父親！」

### 第4日 Narr（p4Narr_zhHK）
「當細仔仲喺遠方的時候，父親已經日日望住路口。一日，父親終於見到個仔，仲係遠方就跑去攬住佢！」

### 第4日 Hint（p4Hint_zhHK）
「試下點擊轉向標誌，細仔轉身跑回家！」

### 第4日 Fail（p4Fail_zhHK）
「轉向另一邊！」

### 第4日 Success（p4Success_zhHK）
「父親跑去迎接，攬住個仔，錫咗佢一啖！」

### 第5日 Narr（p5Narr_zhHK）
「父親話：『快啲攞新袍嚟幫佢着上，戒指戴上，鞋子着上！』即刻擺設宴席，因為個仔死而復生、失而又得！」

### 第5日 Hint（p5Hint_zhHK）
「點擊新袍同戒指，為細仔着上新裝！」

### 第5日 Fail（p5Fail_zhHK）
「全部都要着上！」

### 第5日 Success（p5Success_zhHK）
「我個仔終於返嚟喇！父親好開心，大仔就唔明白…你話父親點解咁開心？」

### Summary（pSummary_zhHK）
「今日我哋學咗浪子回頭的故事。細仔任性離開，但父親日日等他回來。當細仔願意回家，父親即刻原諒，完全接納。只要我哋願意回家，天父都會張開手臂迎接我哋！」

---

## 下一個故事框架（大衛與歌利亞）

### 故事結構（預測）
- 第1日：大衛被父親差送去軍營
- 第2日：歌利亞挑戰以色列人
- 第3日：大衛拒絕掃羅的盔甲
- 第4日：用甩石機弦打敗歌利亞
- 第5日：以色列人得勝歡呼

### 核心訊息（預測）
- 靠主得勝
- 勇气来自神
- 不要看外表，要看內心

### 圖片需求（預測）
- 大衛牧羊圖
- 歌利亞巨人
- 甩石機弦
- 勝利的廣場

---

## 備註
- 優先順序：圖片生成 → 音頻生成 → HTML 製作
- MiniMax Image-01 每日50張配額，按優先順序使用
- 預計總圖片需求：15張（icon + 場景 + 角色 + 物品 + 背景）
