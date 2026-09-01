# 閱光 preschool：MiniMax 預製伴讀流程

這個資料夾是 preschool repo 內的閱讀工具。成人在 private source 用 `preschool.html` 登記及建立內容；線上小朋友只使用 `site/index.html`。鏡架上的鏡子負責把實體書頁反射到前鏡頭，孩子端會將鏡面影像水平校正，並把書頁放大到畫面上半部中央。

## 目前交接狀態

**2026-08-31 · Codex：**

- 已在 `/Users/zachli/Documents/preschool/reading-companion/` 建立 preschool 內容中心：可登記書本、輸入 PDF 來源、頁數、每頁故事文字及玩法提示。
- 普通頁只播放 PDF 對照文字；互動頁拆成「前段／後段」，前段確認頁面後自動播放，玩法提示及女聲反應按需要播放，完成動作後才讀後段。
- 內容中心可設定故事聲線、MiniMax 導讀／女聲、速度、音量、音調、故事語氣、提示語氣及背景音樂描述，並把書本設定下載成 `minimax-pages.json`。
- 閱讀器加入 `mode=child`：隱藏 Drive、頁碼、校正、辨識分數及成人工具，只留下開始、書本確認、重播故事、玩法提示和背景音樂開關。
- 孩子端加入手動閱讀備援：選書後可按「不用相機，手動閱讀」，以「上一頁／下一頁」繼續；互動頁可按「手動完成互動，讀後半段」或在按鈕上滑動，觸發內置聲效、女聲反應及後段語音。手動模式會暫停頁面辨識，避免相機誤跳頁。
- 已加入私有 Drive 的兒童聖經示範書（《耶穌的出生》7 頁＋《耶穌與我一起吃晚餐》5 頁，共 12 頁）；孩子可在入口選擇廣東話或普通話，兩套每頁語音、互動前／後語音、女聲提示及反應均已預製。
- 兒童聖經在第 3、5、7、10、12 頁設有「先讀前段 → 找畫面線索／思考 → 按完成 → 播放後段及反應」流程；原始掃描頁只用於私有來源及本機建立辨識指紋，不進入公開投影。
- 預製腳本支援 `--manifest`、`--output-dir`、`--output-manifest`、`--force-audio`、`--force-music`；背景音樂保持獨立音軌，閱讀時會在語音播放期間自動降低音量。
- 兩本英文示範書已建立 22 個逐頁玩法提示 MP3、16 頁前段／後段故事 MP3 及女聲反應 MP3；兒童聖經另建立廣東話／普通話雙語音軌。同一組重複畫面以流程 ID 串起，翻到後續狀態時不會再重讀前段。
- 已嘗試為兩本示範書呼叫 MiniMax Music Generation；目前帳戶回覆未開放該服務，因此本機資產索引的背景音樂欄位暫為 `null`，閱讀器會保留故事、女聲及內置互動聲效，並停用音樂按鈕。
- GPT-5.6-sol 審查建議把成人設定和孩子閱讀分流、API key 留在本機、先逐頁校正再交給孩子使用；這次已按此方向加入入口及播放管理。
- 兩本示範書已由私有 PDF 預先產生 22 頁的裝置無關辨識包；孩子端換裝置時不需要重新校正，仍會先彈出書本確認。
- 已拆出 `minimax-child-reader.js`，公開孩子端不包含成人來源預覽、登記、校正或 MiniMax 設定程式。
- `publish.allowlist.json`、`scripts/build-public-site.mjs` 及 `scripts/guard-public-site.mjs` 形成安全投影流程；`site/` 只放孩子端 runtime、辨識包、預製音訊／圖像及 `.nojekyll`。

Claude Code 先前已完成兩本英文掃描繪本的逐頁資料及故事／提示語音：Goldilocks 12 頁、The Three Little Pigs 10 頁，共 22 頁。原本的 ARpedia 原型備份仍在 `/Users/zachli/Documents/小工具/ARpedia-互動伴讀/`，本 repo 後續只以這個新路徑為準。

## 使用流程

### 1. 成人登記書本

開啟：

    http://localhost:8787/reading-companion/preschool.html

在「登記一本新繪本」填寫：

- 書本 ID、書名、Google Drive PDF 連結、頁數及適合年齡。
- MiniMax TTS 設定。故事文字和玩法提示可以為每頁選擇不同語氣。
- 背景音樂描述及低音量設定。背景音樂會獨立輸出，孩子可以關閉。
- 每一頁完整的 PDF 原文；互動頁再填前段、後段、女聲反應、玩法提示、流程 ID／位置及聲效。封面或普通頁不需要硬加玩法句子。

登記資料只放在目前裝置的 `localStorage`。按「下載 `minimax-pages.json`」可輸出給預製腳本使用。

### 2. 本機預製 MiniMax 資產

需要 Node.js 18 或以上，以及本機環境變數 `MINIMAX_API_KEY`。不要把 API key 寫進 HTML、JSON 或提交到公開 repo。

    cd "/Users/zachli/Documents/preschool/reading-companion"
    export MINIMAX_API_KEY="你的 MiniMax API key"
    node minimax-prebuild.mjs --force-audio --force-music

一般只重建語音（包含每頁故事和玩法提示）：

    node minimax-prebuild.mjs --force-audio

只重建背景音樂：

    node minimax-prebuild.mjs --force-music

腳本會重用已存在的圖片及音訊；`--force-audio` 才會重新呼叫每一段 TTS。音樂服務如未對目前帳戶開放，腳本會保留其他資產並顯示警告，閱讀器仍可播放故事及玩法提示。

預製輸出包括：

- `assets/minimax/<book>/book-confirm.mp3`：鏡頭辨認書本後的確認語音。
- `assets/minimax/<book>/book-confirm.jpg`：確認視窗插圖。
- `assets/minimax/<book>/page-default.mp3`、`page-default.jpg`：預設伴讀資產。
- `assets/minimax/<book>/pages/page-<n>.mp3`：沒有互動分段的第 n 頁故事文字。
- `assets/minimax/<book>/pages/page-<n>-before.mp3`：互動前先讀的前段。
- `assets/minimax/<book>/pages/page-<n>-after.mp3`：互動完成後讀的後段。
- `assets/minimax/<book>/pages/page-<n>-reaction.mp3`：互動完成後的女聲反應。
- `assets/minimax/<book>/pages/page-<n>-hint.mp3`：第 n 頁玩法提示，按需要播放。
- `assets/minimax/<book>/book-music.mp3`：可循環的獨立背景音樂。
- `assets/minimax-assets.js`：閱讀器使用的資產索引。

### 3. 產生跨裝置辨識包

兩本示範書的辨識包已經預製並放在 `assets/minimax-recognition.js`。每頁包含多個取樣比例的 32×24 灰階特徵及 16×12 色彩特徵，用來適應鏡面反射、不同裝置的畫面大小、書頁距離及現場光線；它不包含 PDF、Drive ID 或頁面文字，孩子每部裝置會直接下載同一份辨識包。

如日後加入新書，成人在私有工作區將 PDF 頁面轉成影像後執行（可按需要只提供其中一本；兒童聖經使用 `--bible-dir`）：

    node scripts/build-recognition-pack.mjs \
      --gold-dir "/private/path/gold-pages" \
      --pigs-dir "/private/path/pigs-pages" \
      --bible-dir "/private/path/bible-pages" \
      --out assets/minimax-recognition.js

這個腳本只輸出視覺指紋；不要把原始 PDF 或影像資料提交到公開投影。

### 4. 成人逐頁校正（只供新增／修訂書本）

開啟成人閱讀器：

    http://localhost:8787/reading-companion/minimax-mirror-reader.html

成人校正只在新增書本或修訂辨識包時使用；兩本示範書不需要在每部孩子裝置重新校正。原本的本機 `localStorage` 樣本仍可供成人試驗，但不會被孩子端讀取。

### 5. 建立安全公開投影

在 private source 根目錄執行：

    node scripts/build-public-site.mjs
    node scripts/guard-public-site.mjs

只有 `publish.allowlist.json` 列出的檔案會進入 `site/`。不要直接把整個 `reading-companion/` 當成公開網站根目錄；`preschool.html`、`minimax-pages.json`、成人 runtime 及原始 PDF 必須留在 private source。

### 6. 交給小朋友閱讀

線上公開投影入口：

    http://localhost:8787/reading-companion/site/index.html?book=bible&lang=cantonese

孩子只需：

1. 先選今天要讀的一本書，按「開始閱讀」並允許前鏡頭。
2. 把所選實體書的封面放到鏡架鏡子前；鏡頭只核對這一本，確認後才開始伴讀。
3. 每個互動頁先自動讀前段；需要時按女聲玩法提示，完成實體翻／拉／滑動作後，鏡頭認到下一個畫面便播放聲效、女聲反應及後段。若鏡頭未及時反應，可按「不用相機，手動閱讀」，再按「手動完成互動，讀後半段」及上一頁／下一頁繼續。

兒童聖經可在開始頁選擇「廣東話」或「普通話」；亦可用 `?book=bible&lang=mandarin` 直接開啟普通話版本。語音選擇只影響預製音訊，不會改變私有 PDF 來源。

## MiniMax 文字及語氣格式

`minimax-pages.json` 使用 `version: 5`。完整原文保留作對照；互動頁再用 `beforeText`／`afterText` 分段：

    {
      "pageNumber": 3,
      "emotion": "calm",
      "text": "The complete printed text on this page.",
      "beforeText": "The first part before the action,",
      "afterText": "the second part after the action.",
      "reactionText": "Great job!",
      "hintText": "Push, pull, or slide to explore this page.",
      "hintEmotion": "happy",
      "flow": {"id": "example-action", "stage": "before", "prompt": "Push the picture.", "soundEffect": "success"}
    }

故事文字可加入 MiniMax speech-2.8 支援的 `(chuckle)`、`(breath)`、`(gasps)`、`(sighs)`、`(sniffs)` 及 `<#0.5#>` 停頓標記。正式交給孩子前，仍應做人耳試聽，確認英文發音、語氣、提示內容及音樂音量合適。

## 資料安全及發布前檢查

- `minimax-pages.json` 目前包含兩本 Google Drive 掃描 PDF 的 file ID／連結。GitHub Pages 是公開網站，push 前要確認這些連結可以公開；不適合公開時，請改用只留在成人本機的設定檔。
- API key 只在 `minimax-prebuild.mjs` 的本機終端機使用，絕不放入前端。
- Drive PDF 只在成人校正／預覽區載入；孩子模式不顯示 Drive 連結。
- 相機只在本機取樣做頁面指紋比對，不錄影、不上傳；樣本存在目前裝置的 localStorage。
- 登記新書的 `rightsReviewed`／`publishable` 是成人自我檢查欄位，發布前仍要由負責人確認出版權限。

公開投影可以被瀏覽器下載，因此預製音訊／圖像及頁面辨識特徵不是秘密；真正需要保護的是原始 PDF、Drive 來源、成人設定及 API key。閱讀完成紀錄目前仍只保存在每部裝置，跨裝置共用的是辨識與預製資產，不是個人進度。

每次更新後都應重新建立 `site/`、通過 `guard-public-site.mjs`，再只提交公開投影及已審核的孩子端 runtime／資產；private source（成人頁面、PDF 來源、設定檔及 API key）仍不進入公開投影。
