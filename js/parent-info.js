// 家長提示內容
const parentInfo = {
  day1: {
    title: "👋 認識自己",
    theory: "自我介紹遊戲幫助孩子建立自我概念，係社會情緒發展嘅基礎。透過話自己名同年齡，孩子開始理解「我」係一個獨立個體。",
    development: "K1（3-4歲）兒童正處於自我概念形成階段，開始區分自己同其他人，並能夠表達基本需求同感受。",
    tips: "可以喺屋企多啲問佢哋問題，等佢練習自我表達。例如：你叫咩名？你幾多歲？你最鍾意咩顏色？",
    activities: ["玩角色扮演遊戲", "畫自己嘅肖像", "睇相片講故事"]
  },
  day2: {
    title: "☀️ 搵黃色",
    theory: "顏色認知係視覺發展重要部分。黃色係三原色之一，通過搵嘢遊戲可以加深顏色概念印象。",
    development: "3-4歲兒童開始學習辨認基本顏色，但需要多次重複體驗先可以完全掌握。",
    tips: "喺屋企玩顏色分類遊戲，例如：將紅色同黃色嘅衫分開。或者問：「搵邊樣嘢係黃色？」",
    activities: ["顏色分類遊戲", "畫彩虹", "搵相同顏色嘢"]
  },
  day3: {
    title: "🐟 搵藍色",
    theory: "藍色係冷色調，常見於大自然（天空、海洋）。搵藍色嘢幫助孩子擴闊顏色認知範圍。",
    development: "兒童學習藍色需要聯繫實際經驗，如藍天、白雲、海水，建立顏色與實物嘅聯想。",
    tips: "可以去沙灘或者海邊，指住海水問：「你見到咩顏色？」或者睇相片認藍色。",
    activities: ["畫海洋世界", "數藍色嘢", "海邊探索"]
  },
  day4: {
    title: "🍎 數水果",
    theory: "數數係數學概念嘅基礎。呢個階段嘅數數係「唱數」，未係真正理解數量。",
    development: "K1兒童可以數到5-10，但未必理解數量不變嘅概念（就算形狀改變，數量不變）。",
    tips: "食生果時一齊數，例如：「你想要幾多個提子？1、2、3...」建立數量同物件嘅聯繫。",
    activities: ["數餐具", "分糖果", "整理玩具時數數"]
  },
  day5: {
    title: "🎪 綜合挑戰",
    theory: "綜合遊戲結合顏色、形狀、數數，訓練孩子嘅認知灵活性同埋執行功能。",
    development: "呢個階段需要家長陪伴，引導佢哋一步步完成挑戰，建立成功感。",
    tips: "陪小朋友一齊玩，適時俾提示。完成後表揚佢哋嘅努力，唔好只睇結果。",
    activities: ["拼圖遊戲", "配對遊戲", "簡單分類"]
  }
};

function showParentInfo(day) {
  const info = parentInfo[day] || parentInfo.day1;
  const modal = document.getElementById('parent-modal');
  if (!modal) return;
  
  modal.innerHTML = `
    <div class="modal-content parent-modal">
      <h3>👨‍👩‍👧 家長提示 - ${info.title}</h3>
      <div class="info-section">
        <h4>🎯 遊戲原理</h4>
        <p>${info.theory}</p>
      </div>
      <div class="info-section">
        <h4>🌱 兒童發展階段</h4>
        <p>${info.development}</p>
      </div>
      <div class="info-section">
        <h4>💡 家長提示</h4>
        <p>${info.tips}</p>
      </div>
      <div class="info-section">
        <h4>🎨 延伸活動</h4>
        <ul>${info.activities.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
      <button class="close-btn" onclick="closeParentInfo()">關閉</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

function closeParentInfo() {
  const modal = document.getElementById('parent-modal');
  if (modal) modal.classList.add('hidden');
}
