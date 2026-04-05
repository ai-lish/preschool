# 聖經故事分類器設計

## 佈局結構

```
┌─────────────────────────────────────┐
│ 聖經故事分類                    [粵/中/英] │
├────────────────────────┬────────────┤
│                        │            │
│     舊約聖經 (3/4)       │  新約 (1/4)  │
│                        │            │
│  [創造] [挪亞] [摩西]    │   → 新約     │
│  [但以理] [大衛] ...    │   → 新約     │
│                        │   → 新約     │
│  點擊看概覽+進入按鈕      │            │
│                        │            │
└────────────────────────┴────────────┘
```

## 交互邏輯

1. **預設**: 舊約佔 75%，新約佔 25%（摺疊狀態）
2. **點擊舊約故事**: 顯示概覽 + 進入遊戲按鈕
3. **點擊新約文字**: 
   - 舊約區域摺疊動畫（向左移動）
   - 分界線向左移動
   - 新約擴展到 75%
   - 顯示新約故事 icons
4. **點擊新約故事**: 同樣顯示概覽 + 進入按鈕

## 舊約故事列表

| 故事 | Icon | 遊戲頁面 |
|------|------|----------|
| 創造七日 | ✨ | creation_game.html |
| 挪亞方舟 | 🐘 | (待建) |
| 摩西過紅海 | 🌊 | (待建) |
| 大衛與歌利亞 | 🐑 | (待建) |

## 新約故事列表

| 故事 | Icon | 遊戲頁面 |
|------|------|----------|
| 耶穌降生 | ⭐ | (待建) |
| 五餅二魚 | 🐟 | (待建) |
| 耶穌復活 | 🐰 | (待建) |
| 浪子回頭 | 🏠 | (待建) |

---

## 完整故事檔案產出框架（供每日 Cron 使用）

為了讓每日凌晨的自動製作能產出「可上線」的完整故事檔案，Cron 將依下列框架自動生成 prototype 並將結果放到本地 clone（/tmp/preschool-clone）再嘗試 commit：

1) 檔案與資料
- `xxx_game.html`（單一檔案 playable prototype）
- `img/xxx/`（icon、場景圖、互動圖）
- `audio/xxx/`（所有音頻檔 key_lang.mp3）
- `BRIEF_xxx_GAME.md`（brief + audio script）

2) 必要欄位（模板）
- Metadata: title, page, icon, languages
- Voice IDs: 必填（例：Cantonese_GentleLady / female-tianmei / English_Trustworthy_Man / Japanese_KindLady）
- Audio keys list (每日 Narr/Hint/Fail/Success + summary)

3) Audio 文本規格
- 每個 key 都要有 1) 旁白（Narr） 2) 提示（Hint） 3) 失敗提示（Fail） 4) 完成回饋（Success）
- 每段文字：傳統中文（zhHK）主稿；Cron 可透過翻譯子任務產出 zhCN/en/ja 文稿
- 優先產出：文本 → 圖片 → TTS（若 quota 足夠）

4) 圖片產出優先順序
- icon（1張）
- 場景首圖（1張）
- 角色與主要互動圖（4-8張）
- 黑白著色 / 虛線運筆版本（選項）
- 使用配額：每日最多 50 張（按優先順序消耗）

5) TTS / 配額處理
- 先查詢當日 MiniMax 配額（image / speech）
- 若 TTS 剩餘不足：只生成文本稿並標記為 "queue:tts"
- 若 TTS 足夠：按 voice ID 生成所有語言音頻（zhHK/zhCN/en/ja）

6) Parent tips
- 每個 Day 自動注入 PARENT_TIPS_DESIGN.md 中相應提示（1-2句 + 出處）
- 在遊戲頁面加入 "💡 知心一點點" 按鈕（顯示/關閉）

7) Commit 與 Delivery
- Cron 將在本地 clone 建立 prototype，並嘗試 commit（branch: cron/<story>-<date>）
- 若 commit 成功：發一條 summary 到 #首頁（announce）
- Delivery 設定需指定 channel（避免 telegram/discord 多 channel 衝突）

8) Logging & Queue
- 產出紀錄寫入 `/var/log/preschool/cron_runs.jsonl`（或 workspace 對應路徑）
- 未完成資源（圖片 / TTS）會標記並排入次日繼續處理

---

## 範例：Jesus Birth（已建立 BRIEF）
- BRIEF 檔案：`BRIEF_JESUS_BIRTH_GAME.md`
- Prototype 位置（Cron）：`/tmp/preschool-clone/jesus_birth_game.html`
- 需要產出：29 keys × 4 languages = 116 mp3（如 quota 允許）

---

## 注意事項
- Cron 產出的 prototype 只是第一版：美術與音頻需人工 review
- Delivery 失敗常見原因：多 channel config → 要求明確 channel
- 若需直接 push 到 GitHub：請確保 committer 權限與 remote token 可用
