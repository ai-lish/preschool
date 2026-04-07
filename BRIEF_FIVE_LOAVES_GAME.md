# 五餅二魚遊戲 — 項目簡報

## 基本資料
| 項目 | 內容 |
|------|------|
| 名稱 | 五餅二魚 |
| 檔案 | `five_loaves_game.html` |
| URL | https://ai-lish.github.io/preschool/five_loaves_game.html |
| GitHub | `ai-lish/preschool` (main branch) |
| 語言 | 粵/簡/英/日（4語言）|

---

## 故事結構

| 日 | 主題 | 互動方式 |
|----|------|----------|
| 第1日 | 耶穌教導群眾 | 點擊群眾人物出現 👨‍👩‍👧‍👦 |
| 第2日 | 小男孩的午餐 | 點擊籃子出現5個餅🥯 + 2條魚 🐟 |
| 第3日 | 耶穌祝福分餅 | 點擊餅和魚，耶穌手向上 ✨ |
| 第4日 | 群眾得飽足 | 拖曳食物分給小朋友 👶👧👦 |
| 第5日 | 收籃子 | 數12個籃子，點擊收集 🧺 |

---

## 核心訊息
- **分享**：小男孩願意分享，即使只有很少
- **耶穌的大能**：小小奉獻能餵飽五千人
- **感恩**：珍惜所有，不浪費

---

## 技術架構

### 音頻策略
- URL: `https://raw.githubusercontent.com/ai-lish/preschool/main/audio/five_loaves/`
- 命名: `{key}_{lang}.mp3`（如 `f1Narr_zhHK.mp3`）
- 音頻 key: `f1Narr`, `f1Hint`, `f1Fail`, `f1Success`, `f2Narr` 等

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
- 五餅二魚 icon — 1個餅 + 2條魚在籃子裡 🧺

### 場景圖（5張）
- `scene1_crowd.png` — 群眾坐在草地上，山景背景
- `scene2_basket.png` — 小男孩捧著5餅2魚的籃子
- `scene3_bless.png` — 耶穌雙手向天，周圍有光環
- `scene4_feeding.png` — 群眾吃飽，各人笑呵呵
- `scene5_baskets.png` — 12個滿滿的籃子

### 角色圖（6張）
- `jesus.png` — 耶穌穿白袍，慈祥微笑
- `boy.png` — 小男孩捧籃子
- `child1-3.png` — 3個不同年齡層小朋友

### 物品圖（5張）
- `loaf.png` — 5個圓餅（白麵包）
- `fish.png` — 2條小魚
- `basket_full.png` — 裝滿食物的籃子
- `basket_empty.png` — 空籃子

### 背景圖（2張）
- `bg_grass_field.png` — 綠草山坡，藍天白雲
- `bg_dinner.png` — 户外野餐場景

---

## 代碼關鍵函數

| 函數 | 功能 |
|------|------|
| `goToDay(n)` | 跳轉到指定日 |
| `completeDay(day)` | 完成指定日 |
| `playAudio(key)` | 播放音頻 |
| `showFeedback(msg, type)` | 顯示成功/失敗反饋 |
| `f2ShowLunch()` | 點擊籃子出現5餅2魚 |
| `f3BlessFood()` | 祝福動畫 |
| `f4DistributeFood()` | 分發食物遊戲 |

---

## 檔案結構
```
preschool/
├── five_loaves_game.html   # 主遊戲
├── index.html              # 首頁（故事分類）
├── audio/five_loaves/     # 五餅二魚音頻
│   ├── f1Narr_zhHK.mp3
│   ├── f1Hint_zhHK.mp3
│   ├── f1Fail_zhHK.mp3
│   ├── f1Success_zhHK.mp3
│   └── ...
└── img/
    ├── five-loaves-icon.png
    └── five_loaves/
        ├── scene1_crowd.png
        ├── scene2_basket.png
        ├── scene3_bless.png
        ├── scene4_feeding.png
        ├── scene5_baskets.png
        ├── jesus.png
        ├── boy.png
        ├── child1.png
        ├── child2.png
        ├── child3.png
        ├── loaf.png
        ├── fish.png
        ├── basket_full.png
        ├── basket_empty.png
        ├── bg_grass_field.png
        └── bg_dinner.png
```

---

## 家長提示「知心一點點」

| Day | 提示 | 出處 |
|-----|------|------|
| 1 | 2-3歲幼兒開始理解「群體」概念，可借此機會學習分享。 | 香港教育局 K1-K3 課程指引 |
| 2 | 數數5個餅可配合實際物品操作，建立數量概念。 | Piaget 前運思期 |
| 3 | 祝福既概念可聯繫到飯前祈禱，培養感恩心。 | 基督教教育 |
| 4 | 分享遊戲有助幼兒理解「公平」同「慷慨」。 | Vygotsky 最近發展區 |
| 5 | 數12個籃子可延伸為簡單減法（原本籃子更多）。 | Montessori 數學教育 |

---

## Learning Activities（學習活動）

| Day | 學習活動 | 內容 |
|-----|----------|------|
| 1 | 數數 | 數草地上有幾多個人物 |
| 2 | 數數 | 數5個餅 + 2條魚 |
| 3 | 情感教育 | 說「感謝耶穌」 |
| 4 | 分享遊戲 | 與同伴分享玩具 |
| 5 | 數數 + 減法概念 | 數12個籃子，問「邊個最多？」|

---

## 音頻文字稿（粵語）

### 第1日 Narr（f1Narr_zhHK）
「耶穌教導群眾好多道理。群眾越來越多，有男有女，有老有嫩！小朋友，你數數看在場有幾多人？」

### 第1日 Hint（f1Hint_zhHK）
「試下點擊每一個人物，睇下佢哋係邊個！」

### 第1日 Fail（f1Fail_zhHK）
「未數完喎，再試多次！」

### 第1日 Success（f1Success_zhHK）
「真係好多人呀！有五千個男人，女人同小朋友就更加多喇！」

### 第2日 Narr（f2Narr_zhHK）
「有一個小朋友帶咗自己嘅午餐——5個餅，同2條魚。不過群眾咁多人，這啲食物點夠食呢？」

### 第2日 Hint（f2Hint_zhHK）
「試下點擊個籃子，睇下入面有咩！」

### 第2日 Fail（f2Fail_zhHK）
「再點一次個籃子啦！」

### 第2日 Success（f2Success_zhHK）
「5個餅、2條魚！就係呢啲嘢，餵飽咗五千人！」

### 第3日 Narr（f3Narr_zhHK）
「門徒將食物送到耶穌面前。耶穌望住天，祝福呢啲食物，然後擘開——奇蹟就發生喇！」

### 第3日 Hint（f3Hint_zhHK）
「點擊個餅同魚，睇下耶穌做啲咩！」

### 第3日 Fail（f3Fail_zhHK）
「試下再點擊食物！」

### 第3日 Success（f3Success_zhHK）
「耶穌祝福完，餅同魚越分越多，多到分不完！」

### 第4日 Narr（f4Narr_zhHK）
「群眾人人都食飽咗！小朋友，試下將食物分俾每個小朋友，睇下佢哋笑唔笑！」

### 第4日 Hint（f4Hint_zhHK）
「將食物拖去每個小朋友度！」

### 第4日 Fail（f4Fail_zhHK）
「記得每個小朋友都要分到嘢食！」

### 第4日 Success（f4Success_zhHK）
「每個人都食飽咗！仲要剩低好多添！」

### 第5日 Narr（f5Narr_zhHK）
「耶穌話：『唔好得閒置，將剩低嘅收起。』門徒執埋，足足執到12籃！12籃喎，比原本5個餅仲多！」

### 第5日 Hint（f5Hint_zhHK）
「試下點擊每一個籃子！」

### 第5日 Fail（f5Fail_zhHK）
「12個籃子，要全部點晒！」

### 第5日 Success（f5Success_zhHK）
「12籃！耶穌用小小奉獻，餵飽咗五千人。小朋友，你今日願意分享嗎？」

### Summary（fSummary_zhHK）
「今日我哋學咗五餅二魚的故事。雖然只得小小，但耶穌祝福之後，夠餵飽五千人。只要我哋願意分享，耶穌就可以用我哋嘅小小奉獻，做大事！」

---

## 下一個故事框架（浪子回頭）

### 故事結構（預測）
- 第1日：大手用分家產，小兒子要求分
- 第2日：小兒子離家，放蕩失敗
- 第3日：小兒子醒悟，決定回家
- 第4日：父親接納，肥牛犢宴席

### 核心訊息（預測）
- 饒恕
- 回家
- 父愛

### 圖片需求（預測）
- 父子圖
- 豪華房子
- 流浪場景
- 肥牛犢
- 跑回家的兒子

---

## 備註
- 優先順序：圖片生成 → 音頻生成 → HTML 製作
- MiniMax Image-01 每日50張配額，按優先順序使用
- 預計總圖片需求：15張（icon + 場景 + 角色 + 物品 + 背景）
