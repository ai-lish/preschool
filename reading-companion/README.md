# 閱光｜preschool 互動伴讀

這是 preschool repo 內的 ARpedia-inspired 鏡架伴讀工具：鏡子把實體書頁反射到前鏡頭，孩子端使用預先建立的跨裝置頁面辨識包，先請孩子確認書本，再播放預先製作的 MiniMax 故事語音、玩法提示及背景音樂。

## 入口

- 成人內容中心（只在 private source）：`preschool.html`，登記書本、逐頁輸入故事／玩法、設定 TTS 與背景音樂、下載 `minimax-pages.json`。
- 成人校正／預製（只在 private source）：`minimax-mirror-reader.html` 及 `scripts/build-recognition-pack.mjs`。
- 小朋友閱讀公開投影：[`site/index.html`](site/index.html)，孩子只會看到開始、書本確認、故事重播、玩法提示及背景音樂開關。

## ARpedia 設計概念

工具參考 ARpedia 公開介紹中的「故事場景立體化、主動閱讀、多感官互動及導讀支援」概念，但使用自製名稱、文字、插畫及 CSS，不直接複製其品牌或素材。這個版本把成人內容建立和小朋友自助閱讀分開，讓孩子不需要理解 Drive、API 或校正設定；公開投影由 `publish.allowlist.json` 控制。

## 兩本英文示範書

- Goldilocks and the Three Bears：12 頁。
- The Three Little Pigs：10 頁。

兩本書的故事文字和推／拉／滑玩法提示均為獨立錄音。故事在確認頁面後自動播放；玩法提示按需要才播放。請先閱讀 [README-MINIMAX.md](README-MINIMAX.md) 了解預製、逐頁校正、背景音樂及 Google Drive 資料安全流程。
