'use strict';

// Three small, original SVG colouring pages. Closed data-fill regions are
// individually tappable, and all line art remains sharp on screen and paper.
window.K2_BOOK_PAGES = [
  {
    id: 'sun', character: '日', word: '太陽', label: '日 · 太陽', explainer: '太陽升起來，天亮了。',
    sentences: {
      yue: { word: '太陽', sentence: '太陽出來喇。' },
      cmn: { word: '太陽', sentence: '太陽升起來了。' },
      en: { word: 'sun', sentence: 'The sun is up.' },
    },
    svg: `<svg class="line-art" viewBox="0 0 760 560" role="img" aria-label="山丘上升起的太陽線稿">
      <rect data-fill="sky" x="8" y="8" width="744" height="544" rx="26" />
      <circle data-fill="sun" cx="380" cy="182" r="91" />
      <g class="ink" fill="none" stroke="#20252c" stroke-width="10" stroke-linecap="round">
        <path d="M380 68v34M380 274v30M266 182h-32M526 182h-32M300 102l-23-23M483 102l23-23M300 262l-23 23M483 262l23 23" />
      </g>
      <path data-fill="cloud-left" d="M66 186c-4-29 20-49 50-43 14-37 77-40 94 5 35-6 53 20 47 46H76c-6 0-10-3-10-8z" />
      <path data-fill="cloud-right" d="M537 256c-4-23 14-40 39-36 12-31 63-34 77 4 28-4 42 17 38 36H545c-5 0-8-2-8-4z" />
      <path data-fill="back-hill" d="M65 433c42-55 95-83 158-84 56 0 101 25 139 61 55-57 116-84 185-72 55 10 103 43 149 99v72H65z" />
      <path data-fill="front-hill" d="M68 447c42-30 87-43 134-37 48 6 89 31 129 62 44-41 91-60 142-55 56 5 115 34 180 74v32H68z" />
      <path data-fill="left-tree-crown" d="M92 365c-14-18-10-39 8-50-4-21 10-37 33-37 19 0 30 12 32 29 20 3 31 22 22 39-8 16-23 22-42 22h-44z" />
      <rect data-fill="left-tree-trunk" x="122" y="361" width="18" height="66" rx="7" />
      <path data-fill="right-tree-crown" d="M626 386c-13-16-10-35 8-45-4-19 9-34 29-34 17 0 27 11 29 26 18 3 28 20 20 36-7 15-21 21-39 21h-38z" />
      <rect data-fill="right-tree-trunk" x="653" y="382" width="16" height="54" rx="6" />
      <g class="ink" fill="none" stroke="#20252c" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M122 401v-45m0 18c-25-10-33-27-33-45 20 1 33 11 33 31m0-4c21-10 31-26 30-42-19 0-30 11-30 30M661 414v-39m0 17c-21-9-28-23-28-39 17 1 28 10 28 27m0-3c18-9 26-22 25-36-16 0-25 9-25 26" />
      </g>
    </svg>`,
  },
  {
    id: 'moon', character: '月', word: '月亮', label: '月 · 月亮', explainer: '晚上抬頭看，會看見月亮和星星。',
    sentences: {
      yue: { word: '月亮', sentence: '月亮出來喇。' },
      cmn: { word: '月亮', sentence: '月亮升起來了。' },
      en: { word: 'moon', sentence: 'The moon is out.' },
    },
    svg: `<svg class="line-art" viewBox="0 0 760 560" role="img" aria-label="月亮、星星和山丘線稿">
      <rect data-fill="night-sky" x="8" y="8" width="744" height="544" rx="26" />
      <path data-fill="moon" d="M528 62a88 88 0 1 0 78 132 72 72 0 0 1-78-132z" />
      <path data-fill="star-one" d="m250 76 10 22 24 2-18 16 5 24-21-13-21 13 5-24-18-16 24-2z" />
      <path data-fill="star-two" d="m389 162 8 17 19 2-14 12 4 19-17-10-17 10 4-19-14-12 19-2z" />
      <path data-fill="star-three" d="m154 222 7 15 17 2-13 11 4 17-15-9-15 9 3-17-12-11 17-2z" />
      <path data-fill="star-four" d="m650 246 9 19 21 2-16 14 5 20-19-11-18 11 4-20-15-14 20-2z" />
      <path data-fill="cloud" d="M299 274c-3-22 14-38 37-34 11-28 59-31 72 4 25-4 38 16 34 34H307c-5 0-8-2-8-4z" />
      <path data-fill="back-hill" d="M31 423 144 334l104 92 144-132 121 121 112-73 103 81v111H31z" />
      <path data-fill="front-hill" d="M31 456c63-36 123-45 181-28 50 15 86 41 133 48 56 8 102-17 157-26 70-11 147 3 226 43v41H31z" />
      <path data-fill="tree-crown-left" d="M86 407c-13-16-9-35 8-45-3-19 10-34 30-34 17 0 27 11 29 26 18 3 27 20 19 36-7 14-20 20-38 20H96z" />
      <rect data-fill="tree-trunk-left" x="112" y="402" width="17" height="83" rx="6" />
      <path data-fill="tree-crown-right" d="M610 402c-12-15-9-33 8-43-3-18 9-32 28-32 16 0 25 10 27 24 17 3 25 19 18 34-7 14-19 19-35 19h-37z" />
      <rect data-fill="tree-trunk-right" x="635" y="398" width="16" height="80" rx="6" />
      <g class="ink" fill="none" stroke="#20252c" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M112 431v-33m0 14c-19-8-26-21-26-35 16 1 26 9 26 24m0-3c16-8 24-20 23-33-14 0-23 9-23 23M643 430v-31m0 13c-18-7-24-20-24-33 15 1 24 8 24 22m0-2c15-8 22-19 21-31-13 0-21 8-21 22" />
      </g>
    </svg>`,
  },
  {
    id: 'mountain', character: '山', word: '山', label: '山 · 高山', explainer: '高高低低的山，遠看像一條線。',
    sentences: {
      yue: { word: '山', sentence: '我哋去行山。' },
      cmn: { word: '山', sentence: '我們去爬山。' },
      en: { word: 'mountain', sentence: 'We climb a mountain.' },
    },
    svg: `<svg class="line-art" viewBox="0 0 760 560" role="img" aria-label="高山、小溪和松樹線稿">
      <rect data-fill="sky" x="8" y="8" width="744" height="544" rx="26" />
      <circle data-fill="sun" cx="644" cy="112" r="54" />
      <path data-fill="left-mountain" d="M28 429 178 267 337 429z" />
      <path data-fill="right-mountain" d="m470 429 150-156 137 156z" />
      <path data-fill="main-mountain" d="M178 438 407 162 638 438z" />
      <path data-fill="snow-cap" d="m366 211 41-49 50 57-34-12-17 22-18-18z" />
      <path data-fill="left-snow" d="m146 301 32-34 39 42-25-9-15 16-14-14z" />
      <path data-fill="right-snow" d="m590 304 30-31 37 42-24-9-14 15-13-13z" />
      <path data-fill="meadow" d="M20 442c75-31 139-35 198-14 48 17 83 43 130 48 54 6 103-18 158-29 78-15 158 0 234 48v57H20z" />
      <path data-fill="stream" d="M388 413c26 14 55 35 59 59 3 21-17 43-42 66l-15 14h-99c36-35 62-62 69-87 6-21 13-37 28-52z" />
      <path data-fill="pine-left" d="m70 447 34-70 36 70h-20l32 51H57l33-51z" />
      <rect data-fill="pine-trunk-left" x="96" y="490" width="16" height="43" rx="5" />
      <path data-fill="pine-right" d="m641 449 34-72 36 72h-20l32 52h-96l32-52z" />
      <rect data-fill="pine-trunk-right" x="668" y="493" width="16" height="40" rx="5" />
    </svg>`,
  },
];
