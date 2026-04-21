# 🌱 幼兒聖經故事平台

為 K1-K3（3-6歲）幼兒設計的聖經故事互動學習平台，支援粵/普/英/日四種語言。

**線上試玩：** https://ai-lish.github.io/preschool/

---

## 📋 專案狀態

| 故事 | 遊戲 | 狀態 | 備註 |
|------|------|------|------|
| 創造七日 | 六日互動遊戲 + 語音 | ✅ 完成 | 讚美詩朗讀 |
| 挪亞方舟 | 六日互動遊戲 + 動物叫聲 | ✅ 完成 | 拖曳配對 |
| 摩西過紅海 | 六日互動遊戲 + 學習活動 | ✅ 完成 | Canvas繪畫 |
| 大衛與歌利亞 | 互動故事 | ✅ 完成 | — |
| 五餅二魚 | 五日互動遊戲 | ✅ 完成 | — |
| 耶穌降生 | 互動故事 | ✅ 完成 | — |
| 耶穌復活 | 五日互動故事 | ✅ 完成 | 音頻待生成 |
| 浪子回頭 | 互動故事 | ✅ 完成 | — |
| 📚 參考資源 | references.html | ✅ 完成 | 13個免費資源 |

---

## 🎮 遊戲內容

### 📂 頁面結構

```
preschool/
├── index.html                   # 主頁（聖經故事分類）
├── references.html               # 參考資源頁（免費幼教工具）
├── creation_game.html            # 創造七日（Day 1-6）
├── noah_game.html               # 挪亞方舟（Day 1-6）
├── moses_game.html              # 摩西過紅海（Day 1-6）
├── david_goliath_game.html      # 大衛與歌利亞
├── five_loaves_game.html        # 五餅二魚（Day 1-5）
├── jesus_birth_game.html        # 耶穌降生
├── jesus_resurrection_game.html # 耶穌復活（Day 1-5）
├── prodigal_son_game.html       # 浪子回頭
└── audio/
    ├── creation/                # 創造七日音頻
    ├── noah/                    # 挪亞方舟音頻
    ├── moses/                   # 摩西遊戲音頻
    ├── david_goliath/           # 大衛與歌利亞音頻
    ├── five_loaves/             # 五餅二魚音頻
    ├── jesus_birth/             # 耶穌降生音頻
    ├── jesus_resurrection/      # 耶穌復活音頻（生成中）
    └── prodigal_son/            # 浪子回頭音頻
```

### 創造七日遊戲 ✅

| 日 | 主題 | 互動方式 |
|----|------|----------|
| Day 1 | 光 | 大聲講「要有光」出現光 |
| Day 2 | 天空 | 拖雲上天空、拖水落大海 |
| Day 3 | 陸地植物 | 點水聚水、陸地浮現、點擊發芽 |
| Day 4 | 太陽月亮星星 | 太陽→白天、星星→黑夜 |
| Day 5 | 魚和鳥 | 撈魚、搖樹搵雀 |
| Day 6 | 動物和人 | 點擊動物、對泥土吹氣創造亞當夏娃 |

### 挪亞方舟遊戲 ✅

| 日 | 主題 | 互動方式 |
|----|------|----------|
| Day 1 | 建造方舟 | 點擊 8 粒釘子建造方舟 |
| Day 2 | 動物登船 | 拖卡通動物到方舟，一對對上船（8對） |
| Day 3 | 大雨降臨 | 點擊 4 朵雲落雨 |
| Day 4 | 洪水氾濫 | 按鈕讓方舟漂浮 |
| Day 5 | 鴿子探路 | 放出鴿子🕊️ |
| Day 6 | 彩虹之約 | 點擊彩虹🌈完成 |

**Day 2 卡通動物 + 叫聲 ✅**
- 8 種卡通動物：大象/獅子/狼/羊/牛/馬/兔/鹿
- 拖一對上船 → 播放該動物叫聲（4語言）
- 叫聲目錄：`audio/noah/sounds/{lang}/{animal}.mp3`

### 摩西過紅海遊戲 ✅

| 日 | 主題 | 互動方式 | 學習活動 |
|----|------|----------|----------|
| Day 1 | 埃及十災 | 點擊 10 個瘟疫驅趕 | 數災殃（選擇數量）|
| Day 2 | 離開埃及 | 滑動 3 次帶領百姓離開 | 數以色列人（點擊計數）|
| Day 3 | 紅海在前 | 點擊摩西祈禱 | 運筆描杖（Canvas 繪畫）|
| Day 4 | 分開紅海 | 點擊杖 5 次分開海水 | 序列排列（1-4 排序）|
| Day 5 | 百姓過海 | 點擊前行 3 次走過海底 | 數上岸人數（點擊計數）|
| Day 6 | 海合歸回 | 點擊杖合回海水 | 分類遊戲（人 vs 軍隊）|

### 大衛與歌利亞 ✅
- 互動式聖經故事，圖文並茂

### 五餅二魚遊戲 ✅
- 五日互動遊戲，含點擊、拖曳、分類等互動

### 耶穌降生 ✅
- 互動式聖經故事

### 耶穌復活 ✅（音頻待生成）
- 五日互動故事：棕枝主日 → 最後晚餐 → 十架犧牲 → 空坟墓 → 耶穌復活
- 圖片已完成，音頻排程中

### 浪子回頭 ✅
- 互動式聖經故事

### 📚 參考資源頁 ✅
- 13 個免費幼兒聖經教育資源（遊戲、工具、網站）
- 無任何收費項目

---

## 🔉 Voice IDs（MiniMax TTS）

| 語言 | Voice ID |
|------|----------|
| 粵語 | `female-tianmei` |
| 國語 | `female-tianmei` |
| 英文 | `male-tianmei` |
| 日文 | `female-tianmei` |

## 🔢 音頻命名規則

- 創造：`cr_d<day>_<key>_<lang>.mp3`
- 挪亞：`n<day><Key>_<lang>.mp3`
- 摩西：`m<day>...`
- 大衛：`dg...`
- 五餅二魚：`fl...`
- 耶穌降生：`jb...`
- 耶穌復活：`r<day>...`
- 浪子回頭：`ps...`

---

## 📂 圖片資源結構

```
img/
├── creation/
├── noah/
├── moses/
├── david_goliath/
├── five_loaves/
├── jesus_birth/
├── jesus_resurrection/    ← 新增
├── prodigal_son/
└── parent/                # 家長提示用的 infographic/icons
```

---

## 🔧 技術規格

- **前端：** 純 HTML/CSS/JS，無框架依賴
- **部署：** GitHub Pages（https://ai-lish.github.io/preschool/）
- **圖片：** MiniMax Image-01 生成，4:3 或 1:1 比例
- **音頻：** MiniMax TTS speech-hd 生成
- **圖示：** Noto Sans TC / Noto Sans JP（Google Fonts）
- **響應式：** 支援 iOS Safari、Android Chrome

---

## 👥 團隊

- **發起人：** Zach Li（李老師）
- **Agent 團隊：** Boss（協調）、小心（代碼）、T仔（測試）、小詩（評估）

---

## 📱 使用方式

用瀏覽器打開：https://ai-lish.github.io/preschool/
