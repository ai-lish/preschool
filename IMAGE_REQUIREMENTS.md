# 創造七日 圖片需求文檔

## 📋 圖片統計

| 類別 | 數量 |
|------|------|
| 背景圖 | 10 |
| 角色/道具 | 22 |
| UI元素 | 4 |
| **總計** | **36張** |

---

## 🖼️ 詳細圖片列表

### 1. 背景圖（10張）

| 編號 | 名稱 | 比例 | 描述 |
|------|------|------|------|
| BG01 | 黑暗背景 | 4:3 | 起初混沌，什麼都沒有，只有黑暗 |
| BG02 | 光明背景 | 4:3 | 充滿光芒，明亮的畫面 |
| BG03 | 天空背景 | 4:3 | 藍天白雲，上方區域 |
| BG04 | 海洋背景 | 4:3 | 藍色海水，下方/周圍 |
| BG05 | 陸地背景 | 4:3 | 棕色泥土，露出來的陸地 |
| BG06 | 草地背景 | 4:3 | 充滿植物的陸地，有草有花 |
| BG07 | 果樹背景 | 4:3 | 有大樹和水果的場景 |
| BG08 | 白天場景 | 4:3 | 太陽當空，白雲藍天 |
| BG09 | 晚上場景 | 4:3 | 深藍天空，月亮和星星 |
| BG10 | 森林背景 | 4:3 | 有大樹的場景，鳥栖息 |

---

### 2. 角色與道具（20張）

| 編號 | 名稱 | 比例 | 描述 |
|------|------|------|------|
| CH01 | 雲朵-1 | 1:1 | 白色蓬鬆雲朵，大朵 |
| CH02 | 雲朵-2 | 1:1 | 白色蓬鬆雲朵，中朵 |
| CH03 | 雲朵-3 | 1:1 | 白色蓬鬆雲朵，小朵 |
| CH04 | 魚-橙 | 1:1 | 橙色小魚，活潑可愛 |
| CH05 | 魚-藍 | 1:1 | 藍色小魚，活潑可愛 |
| CH06 | 魚-綠 | 1:1 | 綠色小魚，活潑可愛 |
| CH07 | 鳥-紅 | 1:1 | 紅色小鳥 |
| CH08 | 鳥-黃 | 1:1 | 黃色小鳥 |
| CH09 | 鳥-藍 | 1:1 | 藍色小鳥 |
| CH10 | 小狗 | 1:1 | 可愛小狗，棕色/黃色 |
| CH11 | 小貓 | 1:1 | 可愛小貓，灰色/白色 |
| CH12 | 兔仔 | 1:1 | 白色小兔，長耳朵 |
| CH13 | 牛牛 | 1:1 | 乳牛，黑白花紋 |
| CH14 | 羊羊 | 1:1 | 白色綿羊，羊毛蓬鬆 |
| CH15 | 泥土堆 | 1:1 | 棕色泥土堆，小山丘狀 |
| CH16 | 亞當人形 | 1:1 | 用泥土造的人形輪廓 |
| CH17 | 夏娃 | 1:1 | 可愛女性人形，用肋骨造 | ✅ |
| CH18 | 魚網 | 1:1 | 捕魚用的網 | ✅ |
| CH19 | 大象 | 1:1 | 可愛大象，大耳朵，快樂表情 | ⏳ 新增 |
| CH20 | 獅子 | 1:1 | 可愛獅子，蓬鬆鬃毛，快樂表情 | ⏳ 新增 |
| CH19 | 種籽 | 1:1 | 小小種籽，棕色 |
| CH20 | 花朵-生長 | 1:1 | 發芽中的植物，4個生長階段 |

---

### 3. UI元素（4張）

| 編號 | 名稱 | 比例 | 描述 |
|------|------|------|------|
| UI01 | O按鈕 | 1:1 | 綠色大圓圈，中間白色⭕ |
| UI02 | X按鈕 | 1:1 | 紅色大圓圈，中間白色❌ |
| UI03 | 麥克風 | 1:1 | 話筒圖示，語音輸入提示 |
| UI04 | 音量進度 | 1:1 | 音量進度條圖示 |

---

## 🎨 統一風格

所有圖片使用以下統一風格：

- **風格**: Cute kawaii children's book illustration
- **色彩**: 柔和粉彩色系
- **線條**: 圓潤柔和，適合幼兒
- **背景**: 白色或透明
- **表情**: 友善開心

---

## 📝 MiniMax Image-01 Prompt 模板

```
Cute kawaii [物品名稱], [簡單描述], children's book illustration style, white background, soft pastel colors, friendly expression, rounded lines, no text
```

### 示例 Prompt：

**雲朵**:
```
Cute kawaii white fluffy cloud, soft and puffy, children's book illustration style, white background, soft pastel colors, rounded lines, no text
```

**小魚**:
```
Cute kawaii orange fish, happy expression, swimming pose, children's book illustration style, white background, soft pastel colors, rounded lines, no text
```

**小狗**:
```
Cute kawaii brown puppy, happy expression, sitting pose, children's book illustration style, white background, soft pastel colors, rounded lines, no text
```

---

## 📊 生成優先順序

| 優先序 | 圖片 | 用於 |
|--------|------|------|
| P1 | BG01, BG02, UI01, UI02 | Day 1 遊戲 |
| P2 | BG03, BG04, CH01-CH03 | Day 2 遊戲 |
| P3 | BG05, BG06, BG07, CH19, CH20 | Day 3 遊戲 |
| P4 | BG08, BG09, 太陽, 月亮, 星星 | Day 4 遊戲 |
| P5 | BG04, CH04-CH09, BG10, CH18 | Day 5 遊戲 |
| P6 | CH10-CH17 | Day 6 遊戲 |

---

*最後更新：2026-04-02*
