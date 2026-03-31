# 幼教圖像生成研究總結

_為 Preschool 項目準備，2026-03-31_

---

## 1. 目前可行的方案

### MiniMax Image-01（已開通 Plus）

**優勢**:
- ✅ 已解鎖（Plus plan）
- ✅ 每日 50 張配額
- ✅ 支援 Character Reference（角色一致性）
- ✅ $0.0035/張，CP 值高
- ✅ 質量好（見官方示例）

**限制**:
- ❌ OpenClaw 尚未設定 MiniMax Image provider
- ❌ 卡通風格需要精確 prompt

**結論**: 係目前最合適嘅選擇

---

## 2. 角色一致性策略

### 方法 A: MiniMax Character Reference（推薦）

MiniMax 支援 `subject_reference` 參數，可以：
1. 先生成一張滿意的角色圖
2. 之後所有場景都用同一張圖作為 `subject_reference`
3. 保持同一人物不同場景

```python
{
    "model": "image-01",
    "prompt": "Same cartoon panda BoBo, wearing a red dress, in a flower garden",
    "subject_reference": [{"type": "character", "image_file": "bo_bo_original.jpg"}]
}
```

**限制**: 目前只支援 `character` type，動物角色可能效果不穩定

### 方法 B: Stable Diffusion + LoRA / IP-Adapter

- 需要自己電腦有 GPU 或用 Google Colab
- 可以訓練 LoRA 達到完美角色一致性
- 但設定複雜，技術門檻高

**結論**: 初期用 MiniMax Character Reference，後期如果需要完美一致性再考慮 SD

---

## 3. 卡通風格 Prompt 技巧

### 必備關鍵詞

```
cute cartoon style
soft pastel colors
children's educational app
K1 preschool style
clean vector art
friendly expression
bright cheerful atmosphere
```

### 避免關鍵詞

```
realistic, photorealistic
3d render, CGI
dark, scary, violent
complex background
blurry, low quality
```

### Prompt 模板

```
Cute cartoon [ANIMAL] character named [NAME], [DISTINGUISHING FEATURE], [POSE], full body, [SETTING], K1 preschool style, clean vector art, soft pastel colors, children's educational app illustration
```

---

## 4. 所需圖像清單（Week 1）

### 角色（7個卡通動物 + 2個配角）

| 角色 | 名稱 | 特徵 | 需要姿勢 |
|------|------|------|---------|
| 小熊貓 | 波波 | 紅色領結 | 站立、歡迎、笑 |
| 兔仔 | 跳跳 | 長耳朵、紅蘿蔔 | 跳躍 |
| 小鳥 | 啾啾 | 黃色羽毛 | 飛翔、唱歌 |
| 小魚 | 藍藍 | 藍色 | 游泳 |
| 烏龜 | 圓圓 | 圓形龜殼 | 慢行 |
| 小象 | 方方 | 大耳朵 | 站立 |
| 狐狸 | 三三 | 毛茸茸尾巴 | 跳躍 |
| 太陽公公 | — | 笑臉、光芒 | — |
| 紅色瓢蟲 | 阿紅 | 紅色 | 飛翔 |

### 場景背景（6個）

| 場景 | 用途 | Aspect Ratio |
|------|------|-------------|
| 森林派對 | Day 1 | 16:9 |
| 紅色花園 | Day 1 (red) | 16:9 |
| 海底世界 | Day 3 (blue) | 16:9 |
| 形狀小屋 | Day 3 (shapes) | 16:9 |
| 果園 | Day 4 (counting) | 16:9 |
| 森林嘉年華 | Day 5 (review) | 16:9 |

### 物品圖（示例）

| 類別 | 物品 |
|------|------|
| 水果 | 蘋果、橙、香蕉、士多啤梨 |
| 衣服 | 紅裙、藍褲、紅帽、黃鞋 |
| 海洋生物 | 魚、海星、水母、鯨魚、蟹、海馬 |
| 形狀 | 圓形物品、方形物品、三角形物品 |
| 其他 | 鎖、鑰匙、形狀餅乾、獎牌 |

---

## 5. 下一步行動

### 畫家（Designer）工作

1. **角色設計**：使用 MiniMax Image-01 生成 9 個角色嘅原圖
2. **場景生成**：使用 Character Reference 生成 6 個場景背景
3. **物品圖**：生成所需嘅物品素材

### 技術設定

需要有人（師弟/我）：
1. 設定 MiniMax Image provider 俾 OpenClaw
2. 或者用 Python script 直接 call API
3. 建立 assets 目錄結構

---

## 6. 參考資源

- [MiniMax Image Generation API](https://platform.minimax.io/docs/guides/image-generation)
- [Children's Book Prompts](https://openart.ai/blog/post/stable-diffusion-prompts-for-childrens-book)
- [Character Consistency with SD](https://stable-diffusion-art.com/consistent-character-view-angle/)
