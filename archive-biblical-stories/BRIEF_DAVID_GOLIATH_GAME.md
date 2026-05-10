# 大衛與歌利亞遊戲 — 項目簡報

## 基本資料
| 項目 | 內容 |
|------|------|
| 名稱 | 大衛與歌利亞 |
| 檔案 | `david_goliath_game.html` |
| URL | https://ai-lish.github.io/preschool/david_goliath_game.html |
| GitHub | `ai-lish/preschool` (main branch) |
| 語言 | 粵/簡/英/日（4語言）|

---

## 故事結構

| 日 | 主題 | 互動方式 |
|----|------|----------|
| 第1日 | 大衛牧羊 | 點擊保護羊羔 🐑 |
| 第2日 | 父親差遣 | 點擊書信出發 📜 |
| 第3日 | 歌利亞挑戰 | 點擊大巨人 💪 |
| 第4日 | 甩石出奇蹟 | 點擊甩石機弦 🎯 |
| 第5日 | 得勝回營 | 點擊慶祝跳舞 💃 |

---

## 核心訊息
- **靠主得勝**：大衛靠神既力量打敗歌利亞
- **勇氣來自神**：唔靠自己，靠神
- **不要看外表**：大衛細個，但神睇佢既心

---

## 技術架構

### 音頻策略
- URL: `https://raw.githubusercontent.com/ai-lish/preschool/main/audio/david_goliath/`
- 命名: `{key}_{lang}.mp3`（如 `d1Narr_zhHK.mp3`）
- 音頻 key: `d1Narr`, `d1Hint`, `d1Fail`, `d1Success`, `d2Narr` 等

### Voice IDs
| 語言 | Voice ID |
|------|----------|
| 粵語 | `Cantonese_BoyVoice`（大衛係小朋友要用男孩聲） |
| 國語 | `male-child-qn` |
| 英文 | `English_BoyVoice` |
| 日文 | `Japanese_BoyVoice` |

---

## 圖片需求清單

### icon（1張）
- 大衛與歌利亞 icon — 大衛用甩石機弦打敗巨人 🪨

### 場景圖（5張）
- `scene1_sheep.png` — 大衛喺山坡牧羊，羊群食草
- `scene2_letter.png` — 父親俾書信大衛，大衛出發
- `scene3_goliath.png` — 歌利亞高大威猛，以色列人驚晒
- `scene4_sling.png` — 大衛用甩石機弦，石頭飛向歌利亞
- `scene5_victory.png` — 大衛拎住歌利亞既劍，以色列人歡呼

### 角色圖（4張）
- `david_young.png` — 年輕大衛紅髮少年
- `david_sling.png` — 大衛拎住甩石機弦
- `goliath_big.png` — 歌利亞巨人全身盔甲
- `goliath_fall.png` — 歌利亞倒地

### 物品圖（3張）
- `sheep.png` — 羊羔（場景用）
- `sling.png` — 甩石機弦（近鏡）
- `goliath_sword.png` — 歌利亞既劍

### 背景圖（2張）
- `bg_hills.png` — 以色列山坡草原
- `bg_battle.png` — 戰場營地

---

## 代碼關鍵函數

| 函數 | 功能 |
|------|------|
| `goToDay(n)` | 跳轉到指定日 |
| `completeDay(day)` | 完成指定日 |
| `playAudio(key)` | 播放音頻 |
| `showFeedback(msg, type)` | 顯示成功/失敗反饋 |
| `d1ProtectSheep()` | 點擊保護羊羔動畫 |
| `d3GoliathAppear()` | 歌利亞出現動畫 |
| `d4SlingShot()` | 甩石擊中動畫 |
| `d5Celebrate()` | 慶祝跳舞動畫 |

---

## 檔案結構
```
preschool/
├── david_goliath_game.html   # 主遊戲
├── index.html              # 首頁（故事分類）
├── audio/david_goliath/    # 大衛與歌利亞音頻
│   ├── d1Narr_zhHK.mp3
│   ├── d1Hint_zhHK.mp3
│   └── ...
└── img/
    ├── david-goliath-icon.png
    └── david_goliath/
        ├── scene1_sheep.png
        ├── scene2_letter.png
        ├── scene3_goliath.png
        ├── scene4_sling.png
        ├── scene5_victory.png
        ├── david_young.png
        ├── david_sling.png
        ├── goliath_big.png
        ├── goliath_fall.png
        ├── sheep.png
        ├── sling.png
        ├── goliath_sword.png
        ├── bg_hills.png
        └── bg_battle.png
```

---

## 家長提示「知心一點點」

| Day | 提示 | 出處 |
|-----|------|------|
| 1 | 牧羊人大衛學習照顧羊群，可借此討論「你鐘意照顧邊個？」| 香港教育局 K1-K3 課程指引 |
| 2 | 聽從父母係美德，可借此討論「爸爸媽媽叫你做咩？」| 基督教教育 |
| 3 | 面對大巨人要靠主，可借此討論「你幾時覺得害怕？」| 撒母耳記上 17:45 |
| 4 | 用自己擅長的方式服事神，可借此討論「你擅長啲咩？」| 哥林多前書 12:22 |
| 5 | 靠主得勝要謙卑，可借此討論「贏咗點算？」| 腓立比書 2:3 |

---

## Learning Activities（學習活動）

| Day | 學習活動 | 內容 |
|-----|----------|------|
| 1 | 數數 | 數羊群有幾多隻羊 |
| 2 | 方向認知 | 邊個方向係軍營？ |
| 3 | 大小認知 | 比較大小（歌利亞 VS 大衛） |
| 4 | 方向認知 | 甩石飛向邊個方向？ |
| 5 | 情感認知 | 邊個表情係「開心」？ |

---

## 音頻文字稿（粵語）

### 第1日 Narr（d1Narr_zhHK）
「从前有個細路仔叫大衛，佢幫爸爸牧羊。一日，有隻大野狼出現，想要叼走羊羔。大衛勇敢保護羊群，趕走大野狼！」

### 第1日 Hint（d1Hint_zhHK）
「試下點擊羊羔，幫大衛保護羊群！」

### 第1日 Fail（d1Fail_zhHK）
「再點擊一次保護羊羔！」

### 第1日 Success（d1Success_zhHK）
「大衛好勇敢，保護晒所有羊羔！爸爸睇見好開心！」

### 第2日 Narr（d2Narr_zhHK）
「爸爸叫大衛去軍營送野貨比哥哥們。大衛帶住甩石機弦出發，一路上睇見好多人好驚既樣子。原來有個好高大既巨人叫歌利亞，日日挑釁以色列人！」

### 第2日 Hint（d2Hint_zhHK）
「點擊書信，幫大衛出發去軍營！」

### 第2日 Fail（d2Fail_zhHK）
「點擊書信，先可以出發！」

### 第2日 Success（d2Success_zhHK）
「大衛到咗軍營，聽見歌利亞既挑戰…」

### 第3日 Narr（d3Narr_zhHK）
「歌利亞好高大，成身盔甲，佢大聲話：『你哋邊個敢同我打？』以色列個個軍人都驚晒，掃羅王既軍隊冇人敢出聲。但大衛話：『我敢！』」

### 第3日 Hint（d3Hint_zhHK）
「點擊大巨人歌利亞，睇下佢有幾高大！」

### 第3日 Fail（d3Fail_zhHK）
「再點擊一次歌利亞！」

### 第3日 Success（d3Success_zhHK）
「歌利亞好大隻，但大衛唔驚！因为大衛知道神會幫佢！」

### 第4日 Narr（d4Narr_zhHK）
「掃羅王比盔甲大衛着，但大衛話：『我唔需要！』大衛帶住5塊石，同甩石機弦，去面對歌利亞。歌利亞大笑，但大衛話：『我唔靠刀槍，我靠神！』」

### 第4日 Hint（d4Hint_zhHK）
「點擊甩石機弦，向歌利亞發射石頭！」

### 第4日 Fail（d4Fail_zhHK）
「再拉一次！」

### 第4日 Success（d4Success_zhHK）
「石頭飛向歌利亞，打中佢既頭！巨人倒下喇！」

### 第5日 Narr（d5Narr_zhHK）
「以色列軍隊大獲全勝！大家跑上山坡，唱歌跳舞慶祝。大衛拎住歌利亞既劍，眾人話：『大衛打敗咗巨人！』」

### 第5日 Hint（d5Hint_zhHK）
「點擊慶祝，與大衛一齊歡呼！」

### 第5日 Fail（d5Fail_zhHK）
「再點擊一次！」

### 第5日 Success（d5Success_zhHK）
「靠主凡事都能！大衛雖然年輕，但佢既勇氣來自神！」

### Summary（dSummary_zhHK）
「今日我哋學咗大衛與歌利亞既故事。大衛雖然係細路仔，但佢靠住神既力量，打敗咗高大既巨人。聖經話：『不要看外表，要看內心。』我哋都可以像大衛一樣，靠主耶穌，面對困難唔驚！」

---

## 下一個故事框架（耶穌復活）

### 故事結構（預測）
- 第1日：耶穌被釘十架
- 第2日：耶穌被埋葬
- 第3日：天使告訴妇女耶穌復活
- 第4日：耶穌向門徒顯現
- 第5日：耶穌升天

### 核心訊息（預測）
- 耶穌為我哋死
- 耶穌復活得勝
- 主耶穌再嚟

### 圖片需求（預測）
- 十架
- 空坟墓
- 天使
- 復活耶穌
- 升天

---

## 備註
- 優先順序：圖片生成 → 音頻生成 → HTML 製作
- MiniMax Image-01 每日50張配額，按優先順序使用
- 預計總圖片需求：15張（icon + 場景 + 角色 + 物品 + 背景）
- 大衛用男孩聲音，注意 Voice ID 選擇
