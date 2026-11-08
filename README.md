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
| 耶穌復活 | 五日互動故事 | ✅ 完成 | 音頻排程中 |
| 浪子回頭 | 互動故事 | ✅ 完成 | — |
| 📚 參考資源 | references.html | ✅ 完成 | 13個免費資源 |
| **🔤 字母公園** | alphabet/ | ✅ 完成 | A-Z 聖經字母學習 + 歌曲房 |
| **🔣 字字符號** | characters.html | ✅ 完成 | 日月水火中文字 |
| **🔢 數字認知** | numbers.html | ✅ 完成 | 1-20 數字 |
| **⬛ 圖形形狀** | shapes.html | ✅ 完成 | 圓方三角橢圓 |
| **✏️ 寫字練習** | writing.html | ✅ 完成 | 筆劃訓練 |
| **🏠 K2 家校 10 分鐘** | k2-guide.html | ✅ 完成 | A-Z、1-10、中文基礎字、生活習慣 |

---

## 🎡 Alphabet Park 英語字母公園

K1-K3（3-6歲）英語字母學習遊戲，聖經主題。

**線上試玩：** https://ai-lish.github.io/preschool/alphabet/

### 📂 頁面結構

```
alphabet/
├── index.html                   # 主頁（A-Z 字母學習）
├── characters/                  # 角色圖片
│   └── a-adam.png              # Adam 角色圖
└── songs/                       # A-Z 26 首字母歌曲（a-song.mp3 … z-song.mp3）
```

### 🎮 四個學習模組

| 模組 | 名稱 | 互動方式 |
|------|------|----------|
| 🍎 Phonics | 字母魔法卡 | 點擊卡片聽發音「A for Apple」，睇聖經主題圖 |
| ✏️ Tracing | 魔法彩虹描紅 | 跟住紅點拖動描寫 A-Z 字母 |
| 🎈 Play | 氣球大挑戰 | 聽語音指令，搵同點爆指定字母氣球 |
| 🎵 Songs | 歌曲房 + Letter Lab | 播放 A-Z 歌曲、大小寫配對、首字母辨認、字母順序 |

### 🌟 功能特色

- **聖經主題配對**：A=Adam, B=Bible, C=Creation, D=David... Z=Zion
- **26首字母歌曲**：A-Z 每個字母都有專屬歌曲，可逐首播放、重播、前後切換
- **Letter Lab**：每輪 5 題，循環練習大小寫配對、首字母辨認和字母前後順序；每個字母會記錄最佳分數
- **音效系統**：pop/success/chime/boing（Web Audio API 合成）
- **Canvas 描紅**：340×340 像素精確筆劃追蹤
- **響應式設計**：支援 iOS Safari、Android Chrome

## 🏠 K2 家校 10 分鐘

**線上使用：** https://ai-lish.github.io/preschool/k2-guide.html

參考 2026–2027 年度 K2 班務小冊子的學習目標和家校合作方向，新增一個給家長和孩子使用的短任務入口：

- 英文：A–Z 認讀、書寫和聽音辨字
- 數學：先以 1–10 做認讀、計數和數序練習（`numbers.html?focus=k2`）
- 中文：認字卡、圖字配對和基礎筆劃
- 每日任務：英文 3 分鐘、數字 3 分鐘、中文 2 分鐘、生活句子 2 分鐘
- 家校習慣：準時回校、完成功課、執拾書包、完整句子、親子伴讀等

清單進度只保存在孩子使用的瀏覽器 `localStorage`，不會上傳個人資料。

---

## 🎮 遊戲內容

### 📂 頁面結構

```
preschool/
├── index.html                   # 主頁（學習分類）
├── k2-guide.html                # K2 家校 10 分鐘任務頁
├── alphabet/                    # Alphabet Park 英語字母公園
│   ├── index.html               # A-Z 字母學習主頁
│   ├── characters/              # 角色圖片
│   ├── songs/                   # A-Z 26 首字母歌曲
│   ├── alphabet-extensions.js   # 歌曲房 + 字母加強練習
│   └── alphabet-extensions.css  # 歌曲房響應式樣式
├── css/k2-guide.css             # K2 家校頁樣式
├── js/k2-guide.js               # K2 清單和本機進度
├── characters.html              # 中文字字符號（日月水火）
├── numbers.html                 # 數字認知（1-20；K2 專注模式為 1-10）
├── shapes.html                  # 圖形形狀（圓方三角）
├── writing.html                 # 寫字練習
├── references.html              # 參考資源頁
├── creation_game.html           # 創造七日（Day 1-6）
├── noah_game.html               # 挪亞方舟（Day 1-6）
├── moses_game.html              # 摩西過紅海（Day 1-6）
├── david_goliath_game.html      # 大衛與歌利亞
├── five_loaves_game.html        # 五餅二魚（Day 1-5）
├── jesus_birth_game.html        # 耶穌降生
├── jesus_resurrection_game.html # 耶穌復活（Day 1-5）
├── prodigal_son_game.html       # 浪子回頭
├── audio/
│   ├── creation/                # 創造七日音頻
│   ├── noah/                    # 挪亞方舟音頻
│   ├── moses/                   # 摩西遊戲音頻
│   ├── david_goliath/          # 大衛與歌利亞音頻
│   ├── five_loaves/            # 五餅二魚音頻
│   ├── jesus/                  # 耶穌降生/復活音頻
│   └── prodigal_son/           # 浪子回頭音頻
└── img/                         # 遊戲圖片資源
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
│   └── animals/              # 卡通動物圖片
├── moses/
├── david_goliath/
├── five_loaves/
├── jesus/
│   └── samples/              # 耶穌降生樣本圖
├── jesus_resurrection/
├── prodigal_son/
├── parent-tips/              # 家長提示 infographics
└── day6/                     # 創造第六天動物圖
```

---

## 🔧 技術規格

### 聖經故事遊戲
- **前端：** 純 HTML/CSS/JS，無框架依賴
- **部署：** GitHub Pages（https://ai-lish.github.io/preschool/）
- **圖片：** MiniMax Image-01 生成，4:3 或 1:1 比例
- **音頻：** MiniMax TTS speech-hd 生成
- **圖示：** Noto Sans TC / Noto Sans JP（Google Fonts）
- **響應式：** 支援 iOS Safari、Android Chrome

### Alphabet Park
- **前端：** HTML/CSS/JS + Tailwind CSS（CDN）
- **字體：** Nunito（Google Fonts）
- **音效：** Web Audio API 合成（pop/success/chime/boing）
- **描紅：** Canvas 2D（340×340 像素筆劃追蹤）
- **語音：** Web Speech API（英語朗讀）

---

## 👥 團隊

- **發起人：** Zach Li（李老師）
- **Agent 團隊：** Boss（協調）、小心（代碼）、T仔（測試）、小詩（評估）

---

## 📱 使用方式

用瀏覽器打開：https://ai-lish.github.io/preschool/

## 🛶 方舟動物上船（K2 升小一）

以挪亞方舟為原創故事背景，把聽動物名、跟筆順寫字、拖羊上船和加減題包裝成四級任務。每級 8 題；按首答正確數給星：0 題 0 星、1–5 題 1 星、6–7 題 2 星、8 題 3 星。上一級累積至少 1 星才解鎖下一級。練習語言預設粵語，也可切換普通話；進度使用 `localStorage` key `preschool-ark-k2-v1`，不記錄孩子姓名。

### 遊戲內容和檔案

- `ark-k2.html`、`css/ark-k2.css`、`js/ark-k2.js`、`js/ark-k2-math.js`：遊戲頁、響應式版面、互動及純函數算題器。
- `data/ark-k2.json`：動物、語言文字、星數規則、七字筆順路徑，以及第四級每輪生成題目的範圍設定。
- `audio/ark-k2/manifest.json`：記錄兩種語言的語音狀態、MiniMax `speech-2.8-hd` 模型和 voice ID。粵語使用 `Cantonese_GentleLady`，普通話使用 `Chinese (Mandarin)_Warm_Girl`；兩者來自官方系統聲音清單回傳欄位 `system_voice[].voice_id`。先用 `--test --confirm-monthly-quota` 在 repo 外生成兩句測試，再以 `--generate --confirm-monthly-quota` 生成 78 個檔案；API key 依序從環境變數、`~/.minimax-api-key`、`~/.openclaw/secrets.json` 讀取，檔案不入 repo。本分支已提交 78/78 個 MP3。
- 第一級從 11 種動物中抽 8 題。牛、馬、羊、鹿、狼、獅子、大象、兔子使用站內圖片和叫聲；貓、魚、雞使用 emoji。站內沒有這三種動物叫聲，答對時會重播動物名稱讀音。
- 第二級練習風、毛、人、小、火、冰、家；第 8 題重溫「風」。每筆寫對增加一塊船板。
- 第三級每輪從 1–10 抽 8 個數量；第四級每輪重新生成 8 道題，4 加 4 減、運算數 1–9、答案 1–10、算式不重複且每個答案最多兩次；選項從正確答案及兩個優先相差 1 或 2 的數字隨機排列。動物按 JSON 的 animals 清單輪替。`scripts/verify_ark_k2_math.js` 以固定種子驗證 1,000 輪。
- 語音檔名使用英文小寫及底線，例如 `animal_sheep.mp3`、`char_feng.mp3`、`number_1.mp3`、`level_1.mp3`，分放於 `audio/ark-k2/zhHK/` 和 `audio/ark-k2/zhCN/`。

### 筆順來源

根因：Hanzi Writer 的 Make Me a Hanzi 筆順資料以內地規範為主，可能與香港教育局字詞表不同。七字的筆畫數及動畫順序逐字按香港教育局[《香港小學學習字詞表》](https://www.edbchinese.hk/lexlist_ch/)詞條核對，Canvas 使用本地簡化路徑。教育局動畫以序號和筆形展示、沒有文字標註各筆名稱；本遊戲按動畫形狀分類名稱。風字9筆為撇、橫折彎鉤、橫、豎、橫折、橫、豎、提、點；動畫第3筆確認是橫。路徑不是教育局動畫原圖，也不使用 Make Me a Hanzi 預設筆順；教育局說明筆順資料供參考，並非唯一或硬性標準。
