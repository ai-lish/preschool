---
name: Audio Quality - Cantonese TTS Issue
description: MiniMax Cantonese TTS has pronunciation issues with certain words
type: feedback
date: 2026-04-06
---
# 粵語 TTS 質量問題記錄

## 問題觀察

| 原文 | TTS 輸出 | 問題 |
|------|----------|------|
| 上帝說 | 喪地說 | 發音走音嚴重 |
| 就有咗光 | 就有你咗光 | 多了"你"字 |
| 係幾咁 | 是多麼 | 口音偏國語 |

## 根本原因

MiniMax 官方「粵語音色」並非真正的 Cantonese TTS，而是 Mandarin TTS + 港式口音。

## Zach 指示

- ✅ 繼續使用（問題在可接受範圍內）
- ✅ 之後考慮用英文配音作為替代
- ⚠️ 需要記錄：每個音頻的問題程度

## 行動

1. 所有腳本改用「神」代替「上帝」（"上帝" 發音問題嚴重）
2. 記錄問題音頻，留待日後一次過處理
3. 考慮英文配音作為長期解決方案
