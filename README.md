# 🌱 K1 成長學習平台

為 K1（3-4歲）幼兒設計的互動學習平台，以**廣東話**進行，透過遊戲學習語文、數學和社交技能。

**線上試玩：** https://ai-lish.github.io/preschool/

---

## 📋 專案狀態

| 階段 | 內容 | 狀態 |
|------|------|------|
| Phase 0 | 確認框架 | ✅ 完成 |
| Phase 1 | 技術架構 | ✅ 完成 |
| Phase 2 | Week 1 開發 | ✅ 完成 |
| Phase 3 | Week 1 測試 | ✅ 完成 |
| Phase 4 | Week 2-4 擴展 | 🔄 進行中 |
| Phase 5 | 家長 Dashboard | 🔜 待做 |

---

## 🎮 遊戲內容（Week 1）

### 📂 頁面結構

```
preschool/
├── index.html           # 主頁（科目 → 週數 → 遊戲）
├── day1_game.html       # Day 1：BoBo 的世界（性別配對、顏色、書寫）
├── day2_game.html       # Day 2：太陽公公搵黃色
├── day3_game.html       # Day 3：海底世界搵藍色
├── day4_game.html       # Day 4：果園數數
├── day5_game.html       # Day 5：綜合大挑戰
└── demo_day1.html       # Day 1 演示版
```

### 📖 各日內容

| 日 | 主題 | 遊戲類型 |
|----|------|----------|
| Day 1 | BoBo 的世界 | 男/女配對、蝴蝶顏色配對、粵語字書寫 |
| Day 2 | 太陽公公搵黃色 | 黃色識別（2選1）|
| Day 3 | 海底世界搵藍色 | 藍色識別 + 拖放互動 |
| Day 4 | 果園數數 | 1-5 數數水果遊戲 |
| Day 5 | 綜合大挑戰 | 角色 + 背景 + 慶祝畫面 |

### ✅ 測試狀態（T仔，2026-03-31）

- Day 1：⚠️ 音頻檔案 404（4個粵語音頻缺失）
- Day 2-5：✅ 全部通過

---

## 🛠️ 技術架構

- **格式：** 獨立 HTML 檔案（無需後端）
- **存儲：** localStorage（進度保存在瀏覽器）
- **圖片：** AI 生成（MiniMax Image-01），存於 GitHub repo
- **語音：** 計劃使用 MiniMax TTS（廣東話）
- **目標瀏覽器：** Safari（iOS/macOS）

---

## 📚 設計文檔

| 文檔 | 用途 |
|------|------|
| K1_FRAMEWORK.md | 詳細設計框架（家長資訊系統、發展心理學基礎）|
| PRODUCTION_WORKFLOW.md | 製作流程 |
| IMAGE_GENERATION_PLAN.md | 圖像生成優先計劃 |
| ASSET_PLAN.md | 素材管理計劃 |
| OPUS_ANALYSIS.md | 系統評估分析 |

---

## 🧪 測試報告

| 文檔 | 內容 |
|------|------|
| TEST_ALL_DAYS.md | Day 1-5 遊戲頁面測試 |
| TEST_PHASE2.md | Phase 2 測試 |
| TEST_QUALITY_REPORT.md | 質量報告 |
| TEST_PARENT_REPORT.md | 家長報告測試 |
| EVALUATION_XIAOSHI.md | 小詩評估 |
| EVAL_CHILD_PERSPECTIVE.md | 兒童視角評估 |

---

## 🔧 已知問題

- ⚠️ Day 1 粵語音頻檔案（`audio/d1_cantonese_*.mp3`）404，需要補回
- ⚠️ `basket.png`（Day 4 水果籃）需跳過歡迎頁才能觸發
- ⚠️ `gift_box.png` / `confetti.png`（Day 5）需遊戲完成後顯示

---

## 👥 團隊

- **發起人：** Zach Li（李老師）
- **Agent 團隊：** Boss（協調）、師弟（代碼）、T仔（測試）、小詩（評估）、書記（文檔）

---

## 📱 使用方式

用 Safari 打開：https://ai-lish.github.io/preschool/
