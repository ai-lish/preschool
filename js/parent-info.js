// 家長提示內容 — 包含發展心理學同兒童成長資訊
const parentInfo = {
  // ── 主頁：K1整體發展概覽 ────────────────────────────────
  general: {
    title: "🌱 K1（3–4歲）兒童發展概覽",
    sections: [
      {
        heading: "🧠 認知發展（皮亞傑前運算期）",
        body: "3–4歲兒童處於皮亞傑（Jean Piaget）前運算階段（Pre-operational Stage）。" +
              "佢哋開始用語言同符號代表事物，但思維仍以「自我中心」為主——難以從他人角度看問題。" +
              "透過角色扮演、積木、顏色配對等遊戲，可以有效促進象徵性思維發展。"
      },
      {
        heading: "💬 語言發展（維高斯基最近發展區）",
        body: "維高斯基（Lev Vygotsky）提出「最近發展區」（ZPD）：孩子在成人或同伴協助下，" +
              "能完成稍高於現有能力嘅任務。家長陪伴玩耍時，適當提示（唔係代佢做）係最理想嘅支援模式。" +
              "3歲兒童詞彙量約900–1,000個；4歲可達1,500個以上，並能組成完整句子。"
      },
      {
        heading: "❤️ 社會情緒發展（埃里克森主動性 vs 愧疚感）",
        body: "埃里克森（Erik Erikson）指出，3–6歲係「主動性 vs 愧疚感」階段。" +
              "讓孩子主動嘗試、探索同決策，有助建立自信心。過度批評或代替孩子完成任務，" +
              "會引發愧疚感，影響往後嘅創造力同主動性。遊戲中多用「你試試看」代替「唔係咁㗎」。"
      },
      {
        heading: "🖐️ 精細動作發展",
        body: "3歲：能用湯匙、穿大串珠、畫圓形。\n" +
              "4歲：能用剪刀、畫十字、扣鈕扣。\n" +
              "觸屏遊戲（如本應用）有助鍛鍊手眼協調，為日後執筆寫字打好基礎。"
      },
      {
        heading: "😴 睡眠與學習",
        body: "3–4歲兒童每日需要10–13小時睡眠（包含午睡）。睡眠鞏固記憶：學習後讓孩子充分休息，" +
              "記憶留存率顯著提高。建議遊戲時間不超過15–20分鐘，完成後讓孩子自由活動或休息。"
      },
      {
        heading: "📱 屏幕使用建議（世界衛生組織）",
        body: "WHO建議3–4歲兒童每日屏幕時間不超過1小時，且必須有家長陪同並互動。" +
              "本應用設計上：每關約5–10分鐘、鼓勵家長一起討論遊戲內容，符合建議使用方式。"
      }
    ],
    tips: "每次遊戲後，可以問小朋友：「今日學到咩？」或「你最鍾意邊個部分？」激發語言表達與反思能力。",
    activities: [
      "陪孩子朗讀繪本（每日15分鐘）",
      "戶外自由玩耍（沙池、滑梯）鍛鍊大肌肉",
      "角色扮演遊戲（煮飯仔、醫生護士）",
      "拼圖、積木等建構性玩具",
      "塗色、貼貼紙等藝術創作"
    ]
  },
  // ── 第1日：認識自己 ──────────────────────────────────────
  day1: {
    title: "👋 Day 1：認識自己",
    sections: [
      {
        heading: "🎯 遊戲學習目標",
        body: "透過選擇名字同年齡，幫助孩子建立初步嘅「自我概念」，係社會情緒發展嘅基礎。"
      },
      {
        heading: "🧠 發展心理學背景",
        body: "皮亞傑指出，3歲開始孩子能用語言描述自己（名字、年齡、性別）。" +
              "自我概念（Self-concept）係一切社交互動嘅出發點。透過遊戲中「話出自己名」，" +
              "孩子練習語言符號化（用字詞代表「我」）。"
      },
      {
        heading: "💡 家長陪玩貼士",
        body: "讓孩子自己作選擇，唔好替佢揀答案。答錯咗可以說：「再試試！」而非「唔係㗎！」" +
              "遊戲後問：「BoBo係幾多歲？」鞏固記憶。"
      }
    ],
    tips: "喺屋企照鏡時問：「你係邊個？你叫咩名？」建立自我認同感。",
    activities: ["玩角色扮演遊戲（我係醫生）", "畫自己嘅肖像", "睇家庭相片講故事"]
  },
  // ── 第2日：搵黃色 ───────────────────────────────────────
  day2: {
    title: "☀️ Day 2：搵黃色",
    sections: [
      {
        heading: "🎯 遊戲學習目標",
        body: "認識黃色（三原色之一），透過在生活場景中搵黃色物件，鞏固顏色概念。"
      },
      {
        heading: "🧠 發展心理學背景",
        body: "根據Bornstein（1985）研究，嬰兒4個月已能分辨基本顏色類別。" +
              "3–4歲是顏色詞彙爆發期，孩子能配對顏色但未必能可靠命名所有顏色。" +
              "重複體驗（spaced repetition）係鞏固顏色概念嘅關鍵：在多個情境（食物、衣服、自然）見到同一顏色，記憶更牢固。"
      },
      {
        heading: "💡 家長陪玩貼士",
        body: "邊玩邊說：「你見到太陽係咩顏色？係黃色！」提供即時語言標籤。" +
              "係家中搵黃色物件延伸學習，例如：香蕉、粟米、向日葵等。"
      }
    ],
    tips: "食早餐時問：「邊樣嘢係黃色？」將學習融入日常生活。",
    activities: ["顏色分類遊戲（紅黃藍分開）", "用黃色蠟筆畫太陽", "係超市搵黃色食物"]
  },
  // ── 第3日：搵藍色 ───────────────────────────────────────
  day3: {
    title: "🐟 Day 3：搵藍色",
    sections: [
      {
        heading: "🎯 遊戲學習目標",
        body: "認識藍色，透過海底世界場景擴闊顏色認知，並建立顏色與自然環境嘅聯想。"
      },
      {
        heading: "🧠 發展心理學背景",
        body: "藍色屬冷色調，係自然界常見顏色（天空、海洋）。聯想學習（associative learning）" +
              "幫助孩子將顏色詞彙與具體事物連結，比單純記顏色卡更有效。" +
              "海洋主題亦刺激孩子嘅好奇心，促進探索動機（mastery motivation）。"
      },
      {
        heading: "💡 家長陪玩貼士",
        body: "係晴天帶孩子望天說：「天空係咩顏色？」" +
              "或者用藍色水彩畫海洋，加入感官體驗鞏固記憶。"
      }
    ],
    tips: "洗澡時玩藍色水：「水係咩顏色？」結合感官與語言學習。",
    activities: ["畫海洋世界（藍色為主）", "係家中數藍色物件", "睇海洋紀錄片短片"]
  },
  // ── 第4日：數水果 ───────────────────────────────────────
  day4: {
    title: "🍎 Day 4：數水果",
    sections: [
      {
        heading: "🎯 遊戲學習目標",
        body: "初步認識數量概念（1–5），透過數水果建立「數字－數量」嘅對應關係。"
      },
      {
        heading: "🧠 發展心理學背景",
        body: "皮亞傑稱此為「數量守恆」前期：3–4歲兒童能唱數（recitation），" +
              "但未必理解「數量不變原則」（一堆物件不論排列如何，數量相同）。" +
              "Gelman & Gallistel（1978）嘅數數原則指出：孩子需掌握「一一對應」（one-to-one correspondence）、" +
              "「穩定序列」（stable order）同「數量基數」（cardinality）三個概念，才算真正理解數數。"
      },
      {
        heading: "💡 家長陪玩貼士",
        body: "陪孩子數時，用手指逐個指住物件，培養「一一對應」習慣。" +
              "數完後問：「一共有幾多個？」練習數量基數概念。"
      }
    ],
    tips: "食生果時一齊數：「我哋有幾多粒提子？1、2、3……」，建立數字實感。",
    activities: ["數餐桌上嘅餐具", "用積木砌數字", "整理玩具時數數"]
  },
  // ── 第5日：綜合挑戰 ─────────────────────────────────────
  day5: {
    title: "🎪 Day 5：綜合挑戰",
    sections: [
      {
        heading: "🎯 遊戲學習目標",
        body: "綜合運用顏色、形狀同數數知識，訓練認知靈活性（cognitive flexibility）同工作記憶。"
      },
      {
        heading: "🧠 發展心理學背景",
        body: "執行功能（Executive Function）係前額葉主導嘅高階認知能力，包括：" +
              "抑制控制（忍住唔去做衝動反應）、工作記憶（記住規則）、認知靈活性（轉換思維）。" +
              "研究顯示，4歲兒童嘅執行功能發展較3歲有顯著提升，是鍛鍊嘅黃金期。" +
              "綜合遊戲通過要求孩子同時記住多個規則，有效刺激執行功能發展。"
      },
      {
        heading: "💡 家長陪玩貼士",
        body: "遇到困難時先問：「你覺得應該點做？」給孩子時間思考，再給提示。" +
              "完成後真誠讚賞努力過程：「你堅持試了好多次，好棒！」（而非只讚「你好叻」）。"
      }
    ],
    tips: "成長型思維（Growth Mindset）：讚賞努力而非天資，幫助孩子建立面對挑戰嘅韌性。",
    activities: ["拼圖遊戲（6–12塊）", "配對記憶卡", "簡單分類遊戲（顏色、形狀、大小）"]
  }
};

// ── 注入覆蓋層樣式（只執行一次）─────────────────────────────
// 使用 class 代替逐行 inline style，提高可維護性
// 必須在 JS 中注入，因為各遊戲頁面不共用 style.css
(function injectParentModalStyles() {
  if (document.getElementById('parent-modal-style')) return;
  const style = document.createElement('style');
  style.id = 'parent-modal-style';
  style.textContent = `
    .parent-modal-overlay {
      display: flex;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 3000;
      align-items: flex-end;
      justify-content: center;
      background: rgba(0,0,0,0.55);
      padding: 0;
    }
    .parent-modal-overlay.hidden { display: none !important; }
    .parent-modal-sheet {
      position: relative;
      background: #fff;
      border-radius: 20px 20px 0 0;
      padding: 24px 20px 20px;
      max-height: 82vh;
      overflow-y: auto;
      width: 100%;
      max-width: 480px;
    }
    .parent-modal-close {
      position: absolute; top: 14px; right: 16px;
      background: none; border: none; font-size: 26px;
      cursor: pointer; color: #999; line-height: 1;
    }
    .parent-modal-title {
      color: #667eea; margin-bottom: 16px;
      font-size: 1.1rem; padding-right: 32px;
    }
    .parent-modal-list { margin: 0; padding-left: 18px; }
    .parent-modal-list li { margin: 4px 0; }
    .parent-modal-overlay .info-section {
      margin-bottom: 14px;
      padding: 14px;
      background: #f8f9fa;
      border-radius: 10px;
    }
    .parent-modal-overlay .info-section h4 {
      color: #444;
      margin-bottom: 8px;
      font-size: 0.95rem;
    }
  `;
  document.head.appendChild(style);
})();

// ── 顯示家長資訊浮窗 ─────────────────────────────────────────
// day: 'general' | 'day1' | 'day2' | 'day3' | 'day4' | 'day5'
// 傳入唔識別嘅值（包括 undefined）會 fallback 至 'general' 概覽
function showParentInfo(day) {
  const info = parentInfo[day] || parentInfo.general;
  const modal = document.getElementById('parent-modal');
  if (!modal) return;

  // Build content from sections array
  const sectionsHtml = (info.sections || []).map(s => `
    <div class="info-section">
      <h4>${s.heading}</h4>
      <p style="white-space:pre-line">${s.body}</p>
    </div>`).join('');

  modal.innerHTML = `
    <div class="parent-modal-sheet">
      <button class="parent-modal-close" onclick="closeParentInfo()">×</button>
      <h3 class="parent-modal-title">${info.title}</h3>
      ${sectionsHtml}
      <div class="info-section">
        <h4>💡 家長提示</h4>
        <p>${info.tips}</p>
      </div>
      <div class="info-section">
        <h4>🎨 屋企延伸活動</h4>
        <ul class="parent-modal-list">${info.activities.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
    </div>
  `;

  // Show overlay (class defined by one-time style injection above)
  modal.className = 'parent-modal-overlay';
}

// ── 關閉家長資訊浮窗 ─────────────────────────────────────────
function closeParentInfo() {
  const modal = document.getElementById('parent-modal');
  if (!modal) return;
  modal.className = 'parent-modal-overlay hidden';
}
