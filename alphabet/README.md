# 幼兒英語字母學習遊戲 - MiniMax 素材生成器

呢個資料夾包含兩個 Python 腳本，用於生成幼兒英語字母學習遊戲所需嘅圖像和語音素材。

## 目前 GitHub 字母頁面

`index.html` 的歌曲房會顯示 A–Z 完整歌詞，並使用 `songs/` 內由 MiniMax Music 生成的歌曲。遊戲教學、挑戰、練習和鼓勵語音則使用 `audio/voices/` 內由 MiniMax Speech-2.8 HD 預先生成的 MP3；頁面不依賴瀏覽器 Web Speech API，也不會在瀏覽器暴露 API key。

語音素材使用英文 expressive narrator 音色，按用途加入 happy、calm 或 surprised 情緒；重新生成可參考 workspace 內的 `scripts/generate_alphabet_voice.py`。

## 📁 資料夾結構

```
alphabet-game/
├── minimax_image_generator.py   # 圖像生成器
├── minimax_tts_generator.py     # TTS 語音生成器
├── assets/
│   ├── images/                  # 生成的圖像文件 (.png)
│   └── audio/                   # 生成的音頻文件 (.mp3)
└── assets.js                    # 合併後的 base64 素材文件
```

## 🎨 圖像生成器 (minimax_image_generator.py)

### 功能
- 使用 MiniMax Image-01 API 生成 A-Z 26 個字母的卡通插圖
- 每個字母對應一個常用單詞（Apple, Ball, Cat...）
- 輸出為 base64 格式，可直接嵌入 HTML

### 使用方法

```bash
cd /Users/zachli/alphabet-game
python3 minimax_image_generator.py
```

### 生成內容

| 字母 | 圖案 | 字母 | 圖案 |
|------|------|------|------|
| A | 🍎 Apple | N | 🪹 Nest |
| B | 🎈 Ball | O | 🍊 Orange |
| C | 🐱 Cat | P | 🐧 Penguin |
| D | 🐕 Dog | Q | 👑 Queen |
| E | 🐘 Elephant | R | 🌈 Rainbow |
| F | 🐟 Fish | S | ☀️ Sun |
| G | 🍇 Grapes | T | 🎄 Tree |
| H | 🏠 House | U | ☂️ Umbrella |
| I | 🍦 Ice cream | V | 🎻 Violin |
| J | 🏺 Jug | W | 🍉 Watermelon |
| K | 🪁 Kite | X | 🎵 Xylophone |
| L | 🦁 Lion | Y | 🪀 Yo-yo |
| M | 🌙 Moon | Z | 🦓 Zebra |

---

## 🎤 TTS 語音生成器 (minimax_tts_generator.py)

### 功能
- 使用 MiniMax Speech-2.8-hd API 生成所有遊戲語音
- 輸出為 base64 MP3 格式，可直接嵌入 HTML

### 使用方法

```bash
cd /Users/zachli/alphabet-game
python3 minimax_tts_generator.py
```

### 生成內容

1. **Phonics 發音 (A-Z)** - 格式：「A for Apple」
2. **鼓勵語句** - Awesome!, Great Job!, Wonderful! 等
3. **遊戲指令** - Find the letter A!, Pop the balloon! 等

### ⚠️ 配額注意

- MiniMax Plus 計劃：每天 4000 字
- 全部生成約需：2000-2500 字
- 程式會自動檢查配額，唔夠會提示

---

## 🔧 流程建議

```
步驟 1：生成圖像
         ↓
    python3 minimax_image_generator.py
         ↓
    26 張 PNG 圖像 + assets.js (圖像部分)
         ↓
步驟 2：生成語音
         ↓
    python3 minimax_tts_generator.py
         ↓
    所有 MP3 音頻 + assets.js (音頻部分)
         ↓
步驟 3：將 assets.js 放入 Claude Project
         ↓
步驟 4：使用 Claude 生成遊戲 HTML
```

---

## 📝 給 Claude 的提示語

喺 Claude Project 放入以下指示：

```
## MiniMax 素材

所有遊戲素材已預先生成並放在 assets.js：

- ALPHABET_IMAGES: A-Z 字母圖像 (base64 PNG)
- AUDIO_ASSETS: 所有語音 (base64 MP3)

遊戲 HTML 只需要引用 assets.js，用以下方式播放音頻：

```javascript
// 播放音頻
const audio = new Audio(AUDIO_ASSETS.PHONIC_A);
audio.play();

// 播放圖像
const img = document.getElementById('letter-image');
img.src = ALPHABET_IMAGES['A'];
```

不要使用 Web Speech API，必須使用預先生成的音頻！
```

---

## 🆘 常見問題

**Q: API Key 在哪裡？**
A: 程式自動從 `~/.openclaw/secrets.json` 讀取 `minimax-api-key`

**Q: 生成失敗點算？**
A: 程式會顯示錯誤信息，大多數係 rate limit (等幾秒再試) 或配額唔夠

**Q: 可以只生成部分字母嗎？**
A: 可以修改 Python 腳本中的 LETTER_PROMPTS 或 PHONICS_SENTENCES 字典

**Q: 圖像風格想調整？**
A: 修改 LETTER_PROMPTS 中的 prompt 描述，重新運行即可

---

## 💡 提示

1. **先生成圖像**，確定風格滿意再生成語音
2. **如果配額唔夠**，可以分開幾天生成
3. **assets.js** 係合併文件，包含曩ong>base64 數據，容量較大（約 10-20MB）
