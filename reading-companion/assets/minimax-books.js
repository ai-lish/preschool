/* Public-safe book catalog. Source PDFs and Drive identifiers stay in the private authoring source. */
window.MINIMAX_BOOKS = Object.freeze({
  goldilocks: Object.freeze({
    id: "goldilocks",
    title: "Goldilocks and the Three Bears",
    pageCount: 12,
    assetBase: "assets/minimax/goldilocks",
    intro: "留意三個一樣、但又不完全一樣的線索，讓孩子從畫面說出自己的觀察。",
    pagePrompt: "第 {page} 頁互動：請找找看，這一頁有沒有三個相似、但又不完全一樣的東西？指出其中一個，說說你的理由。",
    pageTitle: "小熊故事的觀察任務",
    speech: "請找找看，這一頁有沒有三個相似、但又不完全一樣的東西？指出其中一個，說說你的理由。",
    backgroundMusic: { enabled: true, volume: 0.14 }
  }),
  pigs: Object.freeze({
    id: "pigs",
    title: "The Three Little Pigs",
    pageCount: 10,
    assetBase: "assets/minimax/pigs",
    intro: "留意房子的材料、聲音和角色動作，鼓勵孩子先猜再翻頁。",
    pagePrompt: "第 {page} 頁互動：請找找看這一頁的房子或材料線索。你猜接下來會發生什麼？",
    pageTitle: "小豬故事的預測任務",
    speech: "請找找看這一頁的房子或材料線索。你猜接下來會發生什麼？",
    backgroundMusic: { enabled: true, volume: 0.14 }
  })
});
