/* ==========================================
   K1 Learning Platform - Activity Engine v2
   Week 1: 認識自己 + 顏色
   ========================================== */

const Activities = {
    currentActivity: null,
    currentIndex: 0,
    activities: [],
    attempts: 0,
    maxAttempts: 3,
    stepIndex: 0,
    discoveries: 0,
    score: 0,
    
    // Drag state
    draggedItem: null,
    dragClone: null,
    touchOffsetX: 0,
    touchOffsetY: 0,
    
    /* ========== TTS ========== */
    speak(text, cb) {
        if (!text) { if (cb) cb(); return; }
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-HK';
            u.rate = 0.85;
            try {
                const settings = ProgressManager.getSettings();
                u.volume = settings.volume || 1;
            } catch(e) { u.volume = 1; }
            if (cb) u.onend = cb;
            speechSynthesis.speak(u);
        } else if (cb) { setTimeout(cb, 1000); }
    },

    speakPrompt(text) { this.speak(text); },
    speakNumber(n) { this.speak(String(n)); },

    /* ========== Utility ========== */
    _container() { return document.getElementById('activity-container'); },

    _childName() {
        try { return ProgressManager.getChildInfo().name || 'BB'; } catch(e) { return 'BB'; }
    },

    _delay(ms) { return new Promise(r => setTimeout(r, ms)); },

    _animateIn(el, delay) {
        el.style.opacity = '0';
        el.style.transform = 'scale(0.5)';
        el.style.transition = 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'scale(1)'; }, delay || 50);
    },

    _bounce(el) {
        el.style.transition = 'transform 0.3s';
        el.style.transform = 'scale(1.3)';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 300);
    },

    _shake(el) {
        el.classList.add('shake-anim');
        setTimeout(() => el.classList.remove('shake-anim'), 500);
    },

    _confetti(container) {
        const colors = ['#FF6B6B','#FFE66D','#4ECDC4','#A78BFA','#FFB347','#7BC67E'];
        for (let i = 0; i < 30; i++) {
            const c = document.createElement('div');
            c.className = 'confetti-piece';
            c.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.5}s;`;
            container.appendChild(c);
        }
    },

    /* ========== Week 1 Activity Definitions ========== */
    week1Data: {
        day1: [
            // ===== D1: 我叫咩名？ (STORY) =====
            {
                id: 'd1-self-intro',
                type: 'story',
                title: '我叫咩名？',
                theme: '認識自己 — 名字與身份',
                audio: {
                    intro: '歡迎嚟到森林派對！我係波波！',
                    instruction: '搵下你嘅名喺邊度？㩒佢啦！',
                    correct: '啱喇！你好叻呀！',
                    wrong: '唔係喎，再試下？',
                    completion: '嘩！你識介紹自己喇！森林嘅朋友都好鍾意你呀！'
                },
                steps: [
                    { text: '波波出場', desc: '「你好呀！我叫波波！歡迎嚟到森林派對！」', character: '🐼', action: 'intro' },
                    { text: '搵名牌', desc: '搵到你嘅名牌！', action: 'findName' },
                    { text: '幾多歲', desc: '你幾多歲呀？㩒啱嘅數字！', action: 'selectAge' },
                    { text: '動物打招呼', desc: '森林朋友出嚟同你打招呼喇！', action: 'animalGreet' },
                    { text: '大合照', desc: '所有朋友企埋一齊影大合照！', action: 'groupPhoto' }
                ],
                parentInfo: {
                    summary: '透過森林派對故事，讓小朋友認識自己嘅名字同學識自我介紹。',
                    learningGoals: ['名字辨認（視覺識字前備）','口語表達：「我叫___，我3歲」','社交技巧：打招呼同自我介紹','自我認同感建立'],
                    designRationale: '用派對同動物朋友營造社交情境，令自我介紹變得有意義而非機械重複。名牌裝飾環節加入創意同擁有感。',
                    homeApplication: ['同小朋友玩「自我介紹」遊戲','用紙同貼紙整一個真正嘅名牌','影相整「關於我」小冊子','見到親戚時鼓勵小朋友自己介紹']
                }
            },
            // ===== D1: 紅色大冒險 (EXPLORATION) =====
            {
                id: 'd1-red',
                type: 'exploration',
                title: '紅色大冒險',
                theme: '顏色認知 — 紅色',
                audio: {
                    intro: '花園啲紅色唔見咗！你可以幫我搵返嗎？',
                    instruction: '㩒下紅色嘅嘢啦！',
                    correct: '搵到喇！呢個係紅色㗎！好叻！',
                    wrong: '呢個唔係紅色喎，再睇下？',
                    completion: '嘩！你搵到所有紅色嘅嘢喇！花園好返晒！你真係紅色大偵探！'
                },
                steps: [
                    { text: '花園褪色', desc: '波波嘅花園啲紅色唔見咗！', action: 'gardenIntro' },
                    { text: '搵紅色水果', desc: '邊啲水果係紅色？㩒佢哋！', action: 'findRedFruits', items: [{e:'🍎',red:true,n:'蘋果'},{e:'🍌',red:false,n:'香蕉'},{e:'🍓',red:true,n:'士多啤梨'},{e:'🍊',red:false,n:'橙'}] },
                    { text: '搵紅色衣服', desc: '邊啲衫係紅色？㩒佢哋！', action: 'findRedClothes', items: [{e:'👗',red:true,n:'紅色裙',c:'#FF6B6B'},{e:'👖',red:false,n:'藍色褲',c:'#4ECDC4'},{e:'🧢',red:true,n:'紅色帽',c:'#FF6B6B'},{e:'👟',red:false,n:'黃色鞋',c:'#FFE66D'}] },
                    { text: '搵紅色自然', desc: '自然入面邊啲係紅色？', action: 'findRedNature', items: [{e:'🌹',red:true,n:'紅色花'},{e:'🍃',red:false,n:'綠色葉'},{e:'🐞',red:true,n:'紅色瓢蟲'},{e:'🦋',red:false,n:'藍色蝴蝶'}] },
                    { text: '瓢蟲返嚟', desc: '阿紅飛返嚟，花園回復紅色！', action: 'redComplete' }
                ],
                parentInfo: {
                    summary: '透過「搵返紅色」嘅冒險故事，讓小朋友喺唔同情境辨認紅色。',
                    learningGoals: ['紅色嘅視覺辨認','顏色分類能力','紅色詞彙學習','日常生活中紅色物品嘅聯想'],
                    designRationale: '用「顏色消失」嘅故事製造使命感，三個場景（水果、衣服、自然）幫助小朋友喺唔同context認識紅色。',
                    homeApplication: ['喺屋企玩「紅色尋寶」','行街指出紅色嘅嘢','食飯時問「邊樣嘢係紅色？」','用紅色顏料畫畫']
                }
            }
        ],
        day2: [
            // ===== D2: 太陽公公嘅黃色禮物 (STORY) =====
            {
                id: 'd2-yellow',
                type: 'story',
                title: '太陽公公嘅黃色禮物',
                theme: '顏色認知 — 黃色',
                audio: {
                    intro: '早晨呀！太陽公公帶咗黃色禮物嚟㗎！',
                    instruction: '黃色嘅嘢拖去金色禮物袋度！',
                    correct: '啱喇！呢個係黃色㗎！太陽公公好開心！',
                    wrong: '呢個唔係黃色喎，試下第二個？',
                    completion: '好叻！你識分黃色喇！太陽公公送一粒黃色星星俾你！⭐'
                },
                steps: [
                    { text: '太陽出場', desc: '太陽公公笑住升起！', character: '☀️', action: 'sunIntro' },
                    { text: '分禮物1', desc: '搵出黃色嘅嘢！', action: 'sortYellow1', items: [{e:'🍌',y:true,n:'香蕉'},{e:'🍎',y:false,n:'蘋果'},{e:'⭐',y:true,n:'星星'},{e:'🔵',y:false,n:'藍波'}] },
                    { text: '分禮物2', desc: '再搵多啲黃色！', action: 'sortYellow2', items: [{e:'🐥',y:true,n:'小鴨'},{e:'🐸',y:false,n:'青蛙'},{e:'🌻',y:true,n:'向日葵'},{e:'🚗',y:false,n:'紅車'}] },
                    { text: '黃色配對', desc: '邊啲嘢同太陽公公一樣係黃色？', action: 'yellowMatch', items: [{e:'☀️',n:'太陽'},{e:'🌙',n:'月亮'},{e:'🍋',n:'檸檬'},{e:'🌽',n:'粟米'}] },
                    { text: '送禮物', desc: '送黃色禮物俾朋友！', action: 'giveGifts' }
                ],
                parentInfo: {
                    summary: '透過太陽公公送禮物嘅故事，喺分類遊戲中認識黃色。',
                    learningGoals: ['黃色嘅視覺辨認','顏色分類（sorting by colour）','黃色詞彙同日常聯想','分享嘅社交概念'],
                    designRationale: '分類係重要嘅前數學技能。用「幫太陽公公分禮物」創造有意義嘅分類情境，兩輪難度漸進。',
                    homeApplication: ['用積木玩顏色分類','去超市搵黃色水果蔬菜','用黃色物料整collage','朝早望太陽講「太陽係黃色」']
                }
            },
            // ===== D2: 波波跳舞操 (GAME) =====
            {
                id: 'd2-body',
                type: 'game',
                title: '波波跳舞操',
                theme: '認識身體部位',
                audio: {
                    intro: '森林開舞會喇！但首先要認識自己嘅身體先！',
                    instruction: '波波指住邊度，你就㩒邊度！',
                    correct: '啱喇！好叻！',
                    wrong: '唔係喎，再搵下？',
                    completion: '嘩！你識得好多身體部位喇！你真係跳舞高手！💃'
                },
                steps: [
                    { text: '身體認識', desc: '波波介紹身體部位！', action: 'bodyIntro' },
                    { text: '逐個認識', desc: '認識眼、鼻、嘴、耳、手、腳', action: 'bodyLearn', parts: [{n:'頭',e:'🗣️'},{n:'眼睛',e:'👀'},{n:'鼻',e:'👃'},{n:'嘴巴',e:'👄'},{n:'手',e:'✋'},{n:'腳',e:'🦶'}] },
                    { text: '快手㩒', desc: '波波叫邊度就㩒邊度！', action: 'bodyQuiz' },
                    { text: '跳舞時間', desc: '跟住波波一齊跳舞！', action: 'danceTime' },
                    { text: '大合照', desc: '影返張跳舞照！', action: 'bodyComplete' }
                ],
                parentInfo: {
                    summary: '透過跳舞遊戲認識身體部位，結合真實動作同螢幕互動。',
                    learningGoals: ['6個身體部位嘅粵語名稱','身體意識（body awareness）','聽覺理解同反應速度','大肌肉運動技能'],
                    designRationale: '結合螢幕同真實動作（㩒畫面+摸自己身體+跳舞），避免純被動睇屏幕。韻律同音樂幫助記憶。',
                    homeApplication: ['沖涼時問「呢個係咩？」','唱「頭肩膝腳趾」粵語版','照鏡時認識面部五官','玩「Simon says㩒___」遊戲']
                }
            }
        ],
        day3: [
            // ===== D3: 海底嘅藍色世界 (STORY) =====
            {
                id: 'd3-blue',
                type: 'story',
                title: '海底嘅藍色世界',
                theme: '顏色認知 — 藍色',
                audio: {
                    intro: '我哋去海底探險喇！藍藍嘅藍色世界好靚㗎！',
                    instruction: '㩒藍色嘅海洋朋友！',
                    correct: '搵到喇！好靚呀！',
                    wrong: '呢個唔係藍色喎！',
                    completion: '好叻！你認識藍色喇！而且仲記得紅色同黃色！你係顏色小達人！🌈'
                },
                steps: [
                    { text: '潛入海底', desc: '波波著潛水衣跳入水！', character: '🐼🤿', action: 'diveIntro' },
                    { text: '海底探索', desc: '搵藍色嘅海洋生物！', action: 'findBlue', items: [{e:'🐟',b:true,n:'藍色魚'},{e:'🐠',b:false,n:'橙色小丑魚'},{e:'⭐',b:true,n:'藍色海星'},{e:'🪸',b:false,n:'紅色珊瑚'},{e:'🪼',b:true,n:'藍色水母'},{e:'🐴',b:false,n:'黃色海馬'}] },
                    { text: '三色辨認', desc: '紅色、黃色、定藍色？', action: 'threeColorReview', items: [{e:'🦀',c:'紅色',n:'蟹'},{e:'🐋',c:'藍色',n:'鯨魚'},{e:'⭐',c:'黃色',n:'海星'}] },
                    { text: '裝飾花園', desc: '用藍色裝飾品裝飾海底花園！', action: 'decorateGarden', items: [{e:'🐚',n:'藍色貝殼'},{e:'🪸',n:'藍色珊瑚'},{e:'🌿',n:'藍色海草'}] },
                    { text: '三色彩虹', desc: '紅色、黃色、藍色！我哋學識三隻顏色喇！', action: 'rainbowEnd' }
                ],
                parentInfo: {
                    summary: '透過海底探險認識藍色，同時複習紅色同黃色，完成三原色學習。',
                    learningGoals: ['藍色嘅視覺辨認','三原色綜合辨認','海洋知識啟蒙','空間佈置嘅美感概念'],
                    designRationale: 'Day 3係顏色學習嘅關鍵日，引入第三隻原色同時複習前兩隻。海底世界創造唔同場景避免重複。',
                    homeApplication: ['望天空講「天係藍色」','用紅黃藍三色顏料混色實驗','去水族館認識海洋生物','用三色積木玩分類']
                }
            },
            // ===== D3: 形狀動物嘅溫馨小木屋 (GAME) =====
            {
                id: 'd3-shapes',
                type: 'game',
                title: '形狀動物嘅溫馨小木屋',
                theme: '形狀探索',
                audio: {
                    intro: '嘩！有一度神秘嘅門！我哋要搵鑰匙開門！',
                    instruction: '將啱嘅形狀鑰匙拖去鎖度！',
                    correct: '開到喇！',
                    wrong: '唔啱喎，呢把鑰匙嘅形狀唔同喎，再試下？',
                    completion: '好叻！你認識晒三個形狀喇！圓圓、方方、三三都好鍾意你！🎉'
                },
                steps: [
                    { text: '神秘嘅門', desc: '門上有三個形狀鎖！', action: 'doorIntro' },
                    { text: '配對開鎖', desc: '將形狀鑰匙拖去啱嘅鎖！', action: 'unlockDoor', shapes: [{s:'⭕',n:'圓形',id:'circle'},{s:'⬜',n:'正方形',id:'square'},{s:'🔺',n:'三角形',id:'triangle'}] },
                    { text: '認識圓圓', desc: '烏龜圓圓碌出嚟！冇角，可以碌！', action: 'meetCircle' },
                    { text: '認識方方三三', desc: '小象方方同小狐狸三三出場！', action: 'meetSquareTriangle' },
                    { text: '形狀餅乾', desc: '將形狀餅乾放去啱嘅碟！', action: 'shapeCookies', items: [{s:'⭕',n:'圓形餅',t:'circle'},{s:'⬜',n:'方形餅',t:'square'},{s:'🔺',n:'三角形餅',t:'triangle'}] }
                ],
                parentInfo: {
                    summary: '透過「開鎖」冒險故事認識圓形、正方形、三角形，用擬人化角色令形狀有生命力。',
                    learningGoals: ['三個基本形狀嘅辨認同命名','形狀配對（shape matching）','形狀特徵嘅初步理解','手指描摹促進形狀記憶'],
                    designRationale: '擬人化形狀動物令抽象概念變具體。每隻動物嘅動作反映形狀特性，開鎖遊戲提供明確反饋。',
                    homeApplication: ['喺屋企搵圓形方形三角形物件','用紙皮剪出形狀配對','食三文治前切成唔同形狀','散步時指出環境中嘅形狀']
                }
            }
        ],
        day4: [
            // ===== D4: 波波嘅果園摘水果 (GAME) =====
            {
                id: 'd4-counting',
                type: 'game',
                title: '波波嘅果園摘水果',
                theme: '數數1-3',
                audio: {
                    intro: '波波嘅果園大豐收喇！一齊去摘水果！',
                    instruction: '㩒啱數量嘅水果落嚟！',
                    correct: '啱喇！好叻！',
                    wrong: '數多咗喎！再嚟過！',
                    completion: '好叻！你識得數1、2、3喇！波波嘅朋友都好開心！🍎🍊🍌'
                },
                steps: [
                    { text: '果園登場', desc: '波波帶住竹籃嚟到果園！', action: 'orchardIntro' },
                    { text: '摘1個', desc: '跳跳要1個蘋果！', action: 'pick', fruit: '🍎', count: 1, recipient: '跳跳🐰', total: 5 },
                    { text: '摘2個', desc: '啾啾要2個橙！', action: 'pick', fruit: '🍊', count: 2, recipient: '啾啾🐦', total: 5 },
                    { text: '摘3個', desc: '波波要3個香蕉！', action: 'pick', fruit: '🍌', count: 3, recipient: '波波🐼', total: 5 },
                    { text: '數一數', desc: '我哋一共摘咗幾多個水果？', action: 'countAll' }
                ],
                parentInfo: {
                    summary: '透過果園摘水果遊戲，學習數數1-3同按量取物。',
                    learningGoals: ['唱數1-3','一一對應點數','按數取物（cardinality）','數量比較嘅初步概念'],
                    designRationale: '摘水果係有目的嘅數數，唔係為數而數。由1到3漸進，每個數量都有明確操作同即時反饋。',
                    homeApplication: ['食飯時「俾我2粒提子」','上樓梯數1、2、3','去超市攞指定數量水果','用手指玩「伸出___隻手指」']
                }
            },
            // ===== D4: 圓形圓形到處碌 (EXPLORATION) =====
            {
                id: 'd4-circle',
                type: 'exploration',
                title: '圓形圓形到處碌',
                theme: '圓形深度探索',
                audio: {
                    intro: '歡迎嚟到圓形公園！呢度有好多圓形嘅嘢！',
                    instruction: '搵下邊個係圓形！',
                    correct: '啱喇！係圓形㗎！圓碌碌！',
                    wrong: '呢個唔係圓形喎，佢有角㗎！',
                    completion: '你真係圓形小專家！識搵、識分、識畫、仲識用圓形創作！⭕'
                },
                steps: [
                    { text: '圓形公園', desc: '搵出公園入面嘅圓形！', action: 'parkIntro', items: [{e:'☀️',n:'太陽',round:true},{e:'🕐',n:'鐘',round:true},{e:'🏀',n:'波',round:true},{e:'🍪',n:'餅',round:true},{e:'🎡',n:'輪',round:true}] },
                    { text: '圓形分類', desc: '邊啲係圓形？分出嚟！', action: 'sortCircles', items: [{e:'🏀',round:true,n:'波'},{e:'📕',round:false,n:'書'},{e:'🍕',round:false,n:'Pizza'},{e:'🍽️',round:true,n:'碟'},{e:'✉️',round:false,n:'信封'},{e:'🪙',round:true,n:'硬幣'}] },
                    { text: '畫圓形', desc: '跟住虛線畫一個圓形！', action: 'drawCircle' },
                    { text: '碌碌比賽', desc: '圓形可以碌，方形碌唔到！', action: 'rollRace' },
                    { text: '圓形藝術', desc: '用圓形砌嘢！', action: 'circleArt' }
                ],
                parentInfo: {
                    summary: '深度探索圓形 — 從辨認到分類到描摹到創作，全方位認識圓形。',
                    learningGoals: ['圓形嘅視覺辨認同命名','圓形嘅物理特性（可碌、冇角）','圓形vs非圓形分類','用形狀創作嘅空間想像力'],
                    designRationale: '將一個形狀深入探索，活動由淺入深：辨認→分類→描摹→理解特性→創作。',
                    homeApplication: ['搵屋企入面嘅圓形','將圓形物件放斜面碌','用圓形貼紙創作圖畫','搓圓形泥膠']
                }
            }
        ],
        day5: [
            // ===== D5: 森林嘉年華大挑戰 (GAME) =====
            {
                id: 'd5-review',
                type: 'game',
                title: '森林嘉年華大挑戰',
                theme: '顏色 + 形狀綜合複習',
                audio: {
                    intro: '森林嘉年華開始喇！準備好未？',
                    instruction: '揀一個攤位開始玩！',
                    correct: '答啱喇！好叻！',
                    wrong: '差啲啫！再試下！',
                    completion: '恭喜你！你係森林嘉年華冠軍！呢個星期你學咗好多嘢！🏆🎆'
                },
                steps: [
                    { text: '嘉年華開幕', desc: '所有角色歡迎你！', action: 'carnivalIntro' },
                    { text: '顏色射擊', desc: '㩒啱顏色嘅氣球！', action: 'colorShoot' },
                    { text: '形狀套圈', desc: '將形狀放去啱嘅柱！', action: 'shapeRing' },
                    { text: '數數釣魚', desc: '釣啱數量嘅魚！', action: 'countFish' },
                    { text: '頒獎', desc: '你係森林嘉年華冠軍！', action: 'carnivalAward' }
                ],
                parentInfo: {
                    summary: '嘉年華形式綜合複習成個星期嘅學習內容。',
                    learningGoals: ['三原色嘅鞏固複習','三個基本形狀嘅鞏固複習','數數1-3嘅應用','雙重屬性分類'],
                    designRationale: '嘉年華係自然嘅「考試」情境但冇壓力。星星收集系統提供外在動機但唔用分數。',
                    homeApplication: ['喺屋企辦小嘉年華','玩「我講你指」遊戲','整學習回顧小冊子','問小朋友「你呢個星期學咗咩？」']
                }
            },
            // ===== D5: 波波嘅回顧相簿 (STORY) =====
            {
                id: 'd5-reflection',
                type: 'story',
                title: '波波嘅回顧相簿',
                theme: '回顧反思 + 自我表達',
                audio: {
                    intro: '一個星期過去喇！我哋一齊睇返呢個星期做咗咩！',
                    instruction: '翻開相簿睇下！',
                    correct: '你記得好清楚呀！',
                    wrong: '',
                    completion: '你完成咗第一個星期喇！你好叻呀！下個星期會學更多好玩嘅嘢！🎊🏅'
                },
                steps: [
                    { text: '相簿封面', desc: '打開你嘅第一個星期相簿！', action: 'albumCover' },
                    { text: '認識自己', desc: '你記唔記得森林派對？', action: 'albumSelf' },
                    { text: '三隻顏色', desc: '你最鍾意邊隻色？', action: 'albumColors' },
                    { text: '形狀同數數', desc: '你最鍾意邊隻形狀動物？', action: 'albumShapes' },
                    { text: '我最叻', desc: '你完成咗第一個星期！', action: 'albumComplete' }
                ],
                parentInfo: {
                    summary: '用相簿形式回顧一整個星期嘅學習，讓小朋友表達偏好同建立成就感。',
                    learningGoals: ['學習內容嘅回顧同鞏固','表達偏好同自我意識','成就感同學習動機維持','為下星期建立期待感'],
                    designRationale: '反思係深度學習嘅關鍵。相簿形式將學習回憶變得可見。讓小朋友揀「最鍾意」培養自我表達。',
                    homeApplication: ['問「你呢個星期學咗咩最好玩？」','影低小朋友展示學到嘅嘢','整一本真正嘅學習相簿','同家人分享學到嘅嘢']
                }
            }
        ]
    },

    /* ========== Load Activities ========== */
    loadDay(dayId) {
        this.activities = this.week1Data[dayId] || [];
        this.currentIndex = 0;
        this.currentActivity = null;
        this.attempts = 0;
        this.stepIndex = 0;
        this.discoveries = 0;
        this.score = 0;
    },

    getCurrent() { return this.activities[this.currentIndex]; },
    next() { if (this.currentIndex < this.activities.length - 1) { this.currentIndex++; return true; } return false; },
    prev() { if (this.currentIndex > 0) { this.currentIndex--; return true; } return false; },
    isLast() { return this.currentIndex >= this.activities.length - 1; },
    isFirst() { return this.currentIndex === 0; },

    /* ========== Main Render ========== */
    render(container) {
        const activity = this.getCurrent();
        if (!activity) return;
        this.currentActivity = activity;
        this.attempts = 0;
        this.stepIndex = 0;
        this.discoveries = 0;
        this.score = 0;

        switch (activity.type) {
            case 'story': this.renderStory(container, activity); break;
            case 'exploration': this.renderExploration(container, activity); break;
            case 'game': this.renderGame(container, activity); break;
            default: container.innerHTML = '<p>活動加載中...</p>';
        }
    },

    /* ==========================================================
       STORY TYPE — Multi-step narrative with dialogue
       ========================================================== */
    renderStory(container, activity) {
        this.stepIndex = 0;
        this._renderStoryStep(container, activity);
    },

    _renderStoryStep(container, activity) {
        const step = activity.steps[this.stepIndex];
        if (!step) { this._finishActivity(container, activity); return; }
        const isFirst = this.stepIndex === 0;
        const isLast = this.stepIndex === activity.steps.length - 1;
        const progress = ((this.stepIndex + 1) / activity.steps.length * 100);

        container.innerHTML = `
            <div class="story-activity">
                <div class="story-progress-bar"><div class="story-progress-fill" style="width:${progress}%"></div></div>
                <div class="story-scene" id="story-scene">
                    <div class="story-character-area" id="char-area"></div>
                    <div class="story-dialogue" id="dialogue-box">
                        <div class="dialogue-speaker">📖 ${step.text}</div>
                        <div class="dialogue-text">${step.desc}</div>
                    </div>
                    <div class="story-interaction" id="story-interact"></div>
                </div>
                <div class="story-nav">
                    ${!isFirst ? '<button class="story-btn story-prev" onclick="Activities._storyPrev()">← 返去</button>' : '<div></div>'}
                    <button class="story-btn story-next" id="story-next-btn" onclick="Activities._storyNext()">
                        ${isLast ? '完成 🎉' : '繼續 →'}
                    </button>
                </div>
            </div>`;

        // Render step-specific interaction
        this._renderStoryInteraction(activity, step);

        // Audio
        if (isFirst) this.speak(activity.audio.intro);
        else if (isLast) this.speak(activity.audio.completion);
        else this.speak(step.desc);
    },

    _renderStoryInteraction(activity, step) {
        const area = document.getElementById('story-interact');
        const charArea = document.getElementById('char-area');
        if (!area) return;

        switch(activity.id) {
            case 'd1-self-intro': this._storyD1SelfIntro(area, charArea, step); break;
            case 'd2-yellow': this._storyD2Yellow(area, charArea, step); break;
            case 'd3-blue': this._storyD3Blue(area, charArea, step); break;
            case 'd5-reflection': this._storyD5Reflection(area, charArea, step); break;
            default:
                if (step.character) {
                    charArea.innerHTML = `<div class="story-character bounce-in">${step.character}</div>`;
                }
        }
    },

    // --- D1 Self Intro Story Steps ---
    _storyD1SelfIntro(area, charArea, step) {
        const name = this._childName();
        switch(step.action) {
            case 'intro':
                charArea.innerHTML = '<div class="story-character bounce-in" style="font-size:80px">🐼</div>';
                area.innerHTML = `<div class="dialogue-bubble">「你好呀！我叫波波！歡迎嚟到森林派對！」</div>`;
                break;
            case 'findName':
                charArea.innerHTML = '<div class="story-character" style="font-size:60px">🐼</div>';
                const names = [name, '小明', '小花'].sort(() => Math.random() - 0.5);
                area.innerHTML = `<p class="story-prompt">搵到你嘅名！㩒佢！</p>
                    <div class="option-grid">${names.map(n =>
                        `<button class="big-option ${n===name?'':'wrong-option'}" onclick="Activities._handleNameTap(this,'${n}','${name}')">${n}</button>`
                    ).join('')}</div>`;
                this.speak(this.currentActivity.audio.instruction);
                break;
            case 'selectAge':
                charArea.innerHTML = '<div class="story-character" style="font-size:60px">🐼</div>';
                area.innerHTML = `<p class="story-prompt">你幾多歲呀？㩒啱嘅數字！</p>
                    <div class="option-grid">${[1,2,3,4,5].map(n =>
                        `<button class="big-option num-option" onclick="Activities._handleAgeTap(this,${n})">${n}</button>`
                    ).join('')}</div>`;
                this.speak('你幾多歲呀？');
                break;
            case 'animalGreet':
                const animals = [{e:'🐰',n:'跳跳'},{e:'🐦',n:'啾啾'},{e:'🐢',n:'圓圓'}];
                charArea.innerHTML = animals.map((a,i) =>
                    `<div class="story-character bounce-in" style="font-size:60px;animation-delay:${i*0.3}s">${a.e}</div>`
                ).join('');
                area.innerHTML = `<div class="dialogue-bubble">「你好呀${name}！好高興認識你！」</div>`;
                this.speak(`你好呀${name}！好高興認識你！`);
                break;
            case 'groupPhoto':
                charArea.innerHTML = '<div class="group-photo">🐼🐰🐦🐢👦</div>';
                area.innerHTML = `<button class="big-option camera-btn" onclick="Activities._takePhoto(this)">📸 影相！</button>`;
                this.speak('影大合照喇！');
                break;
        }
    },

    _handleNameTap(el, picked, correct) {
        if (el.classList.contains('disabled')) return;
        if (picked === correct) {
            el.classList.add('correct');
            this.speak(this.currentActivity.audio.correct);
            document.querySelectorAll('.big-option').forEach(b => b.classList.add('disabled'));
            setTimeout(() => { document.getElementById('story-next-btn')?.classList.add('pulse-btn'); }, 800);
        } else {
            el.classList.add('incorrect');
            this._shake(el);
            this.speak(this.currentActivity.audio.wrong);
            setTimeout(() => el.classList.remove('incorrect'), 600);
        }
    },

    _handleAgeTap(el, num) {
        if (el.classList.contains('disabled')) return;
        const correct = 3;
        if (num === correct) {
            el.classList.add('correct');
            this.speak('啱喇！你3歲喇！');
            document.querySelectorAll('.num-option').forEach(b => b.classList.add('disabled'));
            // Show 3 cakes
            const area = document.getElementById('story-interact');
            area.innerHTML += '<div class="celebration-row">🎂🎂🎂</div>';
        } else {
            el.classList.add('incorrect');
            this._shake(el);
            this.speak('唔係喎，你3歲㗎！');
            setTimeout(() => el.classList.remove('incorrect'), 600);
        }
    },

    _takePhoto(el) {
        el.textContent = '📸 咔嚓！';
        el.classList.add('disabled');
        const charArea = document.getElementById('char-area');
        if (charArea) charArea.style.border = '4px solid gold';
        this.speak('咔嚓！好靚呀！');
    },

    // --- D2 Yellow Story Steps ---
    _storyD2Yellow(area, charArea, step) {
        switch(step.action) {
            case 'sunIntro':
                charArea.innerHTML = '<div class="story-character bounce-in" style="font-size:80px">☀️</div>';
                area.innerHTML = '<div class="dialogue-bubble">「早晨呀！我帶咗好多黃色禮物嚟㗎！」</div>';
                break;
            case 'sortYellow1':
            case 'sortYellow2':
                charArea.innerHTML = '<div class="story-character" style="font-size:50px">☀️</div>';
                this._renderColorSort(area, step.items, 'y', '黃色', '#FFE66D');
                this.speak('搵出黃色嘅嘢！㩒佢！');
                break;
            case 'yellowMatch':
                charArea.innerHTML = '<div class="story-character" style="font-size:50px">☀️</div>';
                area.innerHTML = `<p class="story-prompt">呢啲全部都係黃色㗎！㩒佢哋！</p>
                    <div class="option-grid">${step.items.map(it =>
                        `<button class="big-option item-btn" onclick="Activities._handleItemLight(this)">${it.e}<br><small>${it.n}</small></button>`
                    ).join('')}</div>`;
                this.speak('邊啲嘢同太陽公公一樣係黃色？㩒佢哋！');
                break;
            case 'giveGifts':
                charArea.innerHTML = '<div class="group-photo">🐼🐰☀️</div>';
                area.innerHTML = '<div class="dialogue-bubble">「多謝你！黃色好靚呀！」</div><div class="celebration-row">⭐🌟⭐</div>';
                break;
        }
    },

    _renderColorSort(area, items, key, colorName, colorHex) {
        let found = 0;
        const total = items.filter(i => i[key]).length;
        area.innerHTML = `<p class="story-prompt">搵出${colorName}嘅嘢！(${found}/${total})</p>
            <div class="option-grid" id="color-sort-grid">${items.map((it,i) =>
                `<button class="big-option item-btn" data-is="${it[key]}" data-idx="${i}" onclick="Activities._handleColorTap(this,'${key}','${colorName}','${colorHex}')">${it.e}<br><small>${it.n || ''}</small></button>`
            ).join('')}</div>`;
    },

    _handleColorTap(el, key, colorName, colorHex) {
        if (el.classList.contains('disabled')) return;
        const isTarget = el.dataset.is === 'true';
        if (isTarget) {
            el.classList.add('correct');
            el.classList.add('disabled');
            el.style.background = colorHex;
            this._bounce(el);
            this.speak(this.currentActivity.audio.correct);
            this.discoveries++;
        } else {
            el.classList.add('incorrect');
            this._shake(el);
            this.speak(this.currentActivity.audio.wrong);
            setTimeout(() => el.classList.remove('incorrect'), 600);
        }
    },

    _handleItemLight(el) {
        if (el.classList.contains('lit')) return;
        el.classList.add('lit');
        el.style.background = '#FFE66D';
        this._bounce(el);
        this.speak('啱喇！係黃色㗎！');
    },

    // --- D3 Blue Story Steps ---
    _storyD3Blue(area, charArea, step) {
        switch(step.action) {
            case 'diveIntro':
                charArea.innerHTML = '<div class="story-character bounce-in" style="font-size:70px">🐼🤿</div>';
                area.innerHTML = '<div class="dialogue-bubble ocean-bg">「歡迎嚟到我嘅藍色世界！」— 藍藍🐟</div>';
                break;
            case 'findBlue':
                charArea.innerHTML = '<div class="story-character" style="font-size:40px">🐟</div>';
                this._renderColorSort(area, step.items, 'b', '藍色', '#4ECDC4');
                this.speak('㩒藍色嘅海洋朋友！');
                break;
            case 'threeColorReview':
                charArea.innerHTML = '';
                area.innerHTML = `<p class="story-prompt">呢啲係咩色？㩒佢然後講出顏色！</p>
                    <div class="option-grid">${step.items.map(it =>
                        `<button class="big-option item-btn" onclick="Activities._handleColorReveal(this,'${it.c}')">${it.e}<br><small>${it.n}</small></button>`
                    ).join('')}</div>`;
                this.speak('你仲記唔記得紅色同黃色？');
                break;
            case 'decorateGarden':
                area.innerHTML = `<p class="story-prompt">㩒藍色裝飾品裝飾花園！</p>
                    <div class="garden-slots" id="garden-area">
                        <div class="garden-slot">🌊</div><div class="garden-slot">🌊</div><div class="garden-slot">🌊</div>
                    </div>
                    <div class="option-grid">${step.items.map((it,i) =>
                        `<button class="big-option item-btn" onclick="Activities._handleGardenPlace(this,${i})">${it.e}<br><small>${it.n}</small></button>`
                    ).join('')}</div>`;
                this.speak('揀藍色嘅嘢裝飾花園！');
                break;
            case 'rainbowEnd':
                charArea.innerHTML = '<div class="rainbow-display">🔴🟡🔵</div>';
                area.innerHTML = '<div class="dialogue-bubble">「紅色、黃色、藍色！我哋學識三隻顏色喇！」</div><div class="celebration-row">🌈✨🌈</div>';
                break;
        }
    },

    _handleColorReveal(el, color) {
        if (el.classList.contains('revealed')) return;
        el.classList.add('revealed');
        el.innerHTML += `<br><span class="color-label">${color}</span>`;
        const colors = {'紅色':'#FF6B6B','黃色':'#FFE66D','藍色':'#4ECDC4'};
        el.style.borderColor = colors[color] || '#ccc';
        el.style.borderWidth = '3px';
        this.speak(`呢個係${color}！`);
    },

    _handleGardenPlace(el, idx) {
        if (el.classList.contains('disabled')) return;
        el.classList.add('disabled');
        el.classList.add('correct');
        const slots = document.querySelectorAll('.garden-slot');
        if (slots[idx]) {
            slots[idx].textContent = el.textContent.split('\n')[0];
            slots[idx].classList.add('filled');
        }
        this._bounce(el);
        this.speak('好靚呀！');
    },

    // --- D5 Reflection Story Steps ---
    _storyD5Reflection(area, charArea, step) {
        const name = this._childName();
        switch(step.action) {
            case 'albumCover':
                charArea.innerHTML = '<div class="story-character bounce-in" style="font-size:60px">📖</div>';
                area.innerHTML = `<div class="album-cover"><h2>📸 ${name}嘅第一個星期</h2><p>㩒繼續翻頁！</p></div>`;
                break;
            case 'albumSelf':
                charArea.innerHTML = '<div class="group-photo">🐼🐰🐦</div>';
                area.innerHTML = `<div class="dialogue-bubble">「你記唔記得？你介紹咗自己！你叫${name}，3歲！」</div>`;
                break;
            case 'albumColors':
                area.innerHTML = `<p class="story-prompt">你最鍾意邊隻色？㩒佢！</p>
                    <div class="option-grid">
                        <button class="big-option" style="background:#FF6B6B;color:white" onclick="Activities._pickFav(this,'紅色')">紅色🔴</button>
                        <button class="big-option" style="background:#FFE66D" onclick="Activities._pickFav(this,'黃色')">黃色🟡</button>
                        <button class="big-option" style="background:#4ECDC4;color:white" onclick="Activities._pickFav(this,'藍色')">藍色🔵</button>
                    </div>`;
                this.speak('你最鍾意邊隻色？');
                break;
            case 'albumShapes':
                area.innerHTML = `<p class="story-prompt">你最鍾意邊隻形狀動物？</p>
                    <div class="option-grid">
                        <button class="big-option" onclick="Activities._pickFav(this,'圓圓')">🐢 圓圓</button>
                        <button class="big-option" onclick="Activities._pickFav(this,'方方')">🐘 方方</button>
                        <button class="big-option" onclick="Activities._pickFav(this,'三三')">🦊 三三</button>
                    </div>
                    <div style="margin-top:15px">
                        <p>數一數：</p>
                        <div class="option-grid">
                            <span class="count-display-item">🍎×1</span>
                            <span class="count-display-item">🍊×2</span>
                            <span class="count-display-item">🍌×3</span>
                        </div>
                    </div>`;
                break;
            case 'albumComplete':
                charArea.innerHTML = '<div class="group-photo bounce-in">🐼🐰🐦🐢🐘🦊🐟</div>';
                area.innerHTML = `<div class="completion-banner">
                    <h2>🏅 Week 1 完成！</h2>
                    <p>你學咗：自我介紹、紅黃藍、圓形方形三角形、數1-2-3！</p>
                    <div class="celebration-row">🎊🏆🎊</div>
                    <p>下個星期見！</p>
                </div>`;
                break;
        }
    },

    _pickFav(el, choice) {
        document.querySelectorAll('.big-option').forEach(b => b.classList.remove('selected-fav'));
        el.classList.add('selected-fav');
        this._bounce(el);
        this.speak(`你鍾意${choice}！好嘅！`);
    },

    _storyPrev() {
        if (this.stepIndex > 0) {
            this.stepIndex--;
            this._renderStoryStep(this._container(), this.currentActivity);
        }
    },

    _storyNext() {
        const activity = this.currentActivity;
        if (this.stepIndex < activity.steps.length - 1) {
            this.stepIndex++;
            this._renderStoryStep(this._container(), activity);
        } else {
            this._finishActivity(this._container(), activity);
        }
    },

    /* ==========================================================
       EXPLORATION TYPE — Discovery-based learning
       ========================================================== */
    renderExploration(container, activity) {
        this.stepIndex = 0;
        this.discoveries = 0;
        this._renderExplorationStep(container, activity);
    },

    _renderExplorationStep(container, activity) {
        const step = activity.steps[this.stepIndex];
        if (!step) { this._finishActivity(container, activity); return; }
        const isFirst = this.stepIndex === 0;
        const isLast = this.stepIndex === activity.steps.length - 1;
        const progress = ((this.stepIndex + 1) / activity.steps.length * 100);

        container.innerHTML = `
            <div class="exploration-activity">
                <div class="story-progress-bar"><div class="story-progress-fill" style="width:${progress}%"></div></div>
                <div class="exploration-header">
                    <span class="explore-title">🔍 ${step.text}</span>
                    <span class="explore-score" id="explore-score">⭐ ${this.discoveries}</span>
                </div>
                <p class="story-prompt">${step.desc}</p>
                <div class="exploration-area" id="explore-area"></div>
                <div class="story-nav">
                    ${!isFirst ? '<button class="story-btn story-prev" onclick="Activities._explorePrev()">← 返去</button>' : '<div></div>'}
                    <button class="story-btn story-next" id="explore-next-btn" onclick="Activities._exploreNext()">
                        ${isLast ? '完成 🎉' : '繼續 →'}
                    </button>
                </div>
            </div>`;

        // Render step content
        this._renderExploreContent(activity, step);

        if (isFirst) this.speak(activity.audio.intro);
        else if (isLast) this.speak(activity.audio.completion);
        else this.speak(activity.audio.instruction);
    },

    _renderExploreContent(activity, step) {
        const area = document.getElementById('explore-area');
        if (!area) return;

        switch(activity.id) {
            case 'd1-red': this._exploreD1Red(area, step); break;
            case 'd4-circle': this._exploreD4Circle(area, step); break;
            default:
                if (step.items) {
                    area.innerHTML = `<div class="option-grid">${step.items.map(it =>
                        `<button class="big-option item-btn">${it.e}</button>`
                    ).join('')}</div>`;
                }
        }
    },

    // --- D1 Red Exploration ---
    _exploreD1Red(area, step) {
        switch(step.action) {
            case 'gardenIntro':
                area.innerHTML = `<div class="scene-display garden-gray">
                    <div class="story-character bounce-in" style="font-size:60px">🐼</div>
                    <div class="dialogue-bubble">「我嘅花園啲紅色唔見咗！」</div>
                    <div class="story-character" style="font-size:40px;opacity:0.5">🐞</div>
                    <div class="dialogue-bubble small">「搵到我就可以恢復紅色！」</div>
                </div>`;
                break;
            case 'findRedFruits':
            case 'findRedClothes':
            case 'findRedNature':
                this._renderFindItems(area, step.items, 'red');
                break;
            case 'redComplete':
                area.innerHTML = `<div class="scene-display garden-restored">
                    <div class="story-character bounce-in" style="font-size:80px">🐞</div>
                    <div class="dialogue-bubble">「阿紅返嚟喇！花園好返晒！」</div>
                    <div class="celebration-row">🌹🌺🌹🌺🌹</div>
                </div>`;
                break;
        }
    },

    _renderFindItems(area, items, colorKey) {
        if (!items) return;
        const total = items.filter(i => i[colorKey]).length;
        let found = 0;
        area.innerHTML = `<div class="find-counter" id="find-counter">搵到 ${found}/${total}</div>
            <div class="option-grid">${items.map((it, i) =>
                `<button class="big-option item-btn explore-item" data-is="${!!it[colorKey]}" data-idx="${i}"
                    onclick="Activities._handleFindTap(this,${!!it[colorKey]},'${colorKey}')"
                    ${it.c ? `style="color:${it.c}"` : ''}>
                    ${it.e}<br><small>${it.n}</small>
                </button>`
            ).join('')}</div>`;
    },

    _handleFindTap(el, isTarget, colorKey) {
        if (el.classList.contains('disabled')) return;
        if (isTarget) {
            el.classList.add('correct', 'disabled');
            this._bounce(el);
            this.discoveries++;
            document.getElementById('explore-score').textContent = `⭐ ${this.discoveries}`;
            this.speak(this.currentActivity.audio.correct);
            // Update counter
            const counter = document.getElementById('find-counter');
            if (counter) {
                const items = document.querySelectorAll('.explore-item');
                const total = Array.from(items).filter(i => i.dataset.is === 'true').length;
                const found = Array.from(items).filter(i => i.dataset.is === 'true' && i.classList.contains('correct')).length;
                counter.textContent = `搵到 ${found}/${total}`;
                if (found >= total) {
                    counter.textContent += ' ✅';
                    this.speak('全部搵到喇！');
                }
            }
        } else {
            el.classList.add('incorrect');
            this._shake(el);
            this.speak(this.currentActivity.audio.wrong);
            setTimeout(() => el.classList.remove('incorrect'), 600);
        }
    },

    // --- D4 Circle Exploration ---
    _exploreD4Circle(area, step) {
        switch(step.action) {
            case 'parkIntro':
                area.innerHTML = `<p>㩒公園入面嘅圓形！</p>
                    <div class="option-grid">${step.items.map(it =>
                        `<button class="big-option item-btn explore-item" data-is="true"
                            onclick="Activities._handleCircleFind(this,'${it.n}')">
                            ${it.e}<br><small>${it.n}</small>
                        </button>`
                    ).join('')}</div>
                    <div class="find-counter" id="find-counter">搵到 0/${step.items.length}</div>`;
                break;
            case 'sortCircles':
                this._renderFindItems(area, step.items, 'round');
                break;
            case 'drawCircle':
                area.innerHTML = `<div class="draw-area">
                    <p>用手指喺下面畫一個圓形！</p>
                    <canvas id="draw-canvas" width="250" height="250" style="border:2px dashed #4ECDC4;border-radius:50%;background:white;touch-action:none"></canvas>
                    <br><button class="big-option" onclick="Activities._checkCircleDraw()">完成！</button>
                </div>`;
                this._setupCanvas();
                this.speak('跟住畫一個圓形！');
                break;
            case 'rollRace':
                area.innerHTML = `<div class="roll-demo">
                    <p>㩒「碌！」睇下邊個碌到！</p>
                    <div class="race-track">
                        <div class="race-item" id="race-circle">⚽ 圓形</div>
                        <div class="race-item" id="race-square">📦 方形</div>
                    </div>
                    <button class="big-option" onclick="Activities._startRoll()">碌！🏁</button>
                </div>`;
                this.speak('圓形可以碌㗎！方形就碌唔到！');
                break;
            case 'circleArt':
                area.innerHTML = `<div class="circle-art-area">
                    <p>㩒圓形砌嘢！</p>
                    <div class="art-canvas" id="art-canvas" style="min-height:150px;background:white;border:2px solid #eee;border-radius:12px;position:relative;overflow:hidden"></div>
                    <div class="circle-palette">
                        <button class="circle-piece big-circle" onclick="Activities._addCircle('big')">⭕大</button>
                        <button class="circle-piece med-circle" onclick="Activities._addCircle('med')">⭕中</button>
                        <button class="circle-piece sm-circle" onclick="Activities._addCircle('small')">⭕小</button>
                    </div>
                    <p class="hint-text">可以砌雪人、毛蟲、花！</p>
                </div>`;
                this.speak('用圓形創作啦！');
                break;
        }
    },

    _handleCircleFind(el, name) {
        if (el.classList.contains('disabled')) return;
        el.classList.add('correct', 'disabled');
        this._bounce(el);
        this.discoveries++;
        document.getElementById('explore-score').textContent = `⭐ ${this.discoveries}`;
        this.speak(`${name}係圓形㗎！`);
        const counter = document.getElementById('find-counter');
        if (counter) {
            const total = document.querySelectorAll('.explore-item').length;
            const found = document.querySelectorAll('.explore-item.correct').length;
            counter.textContent = `搵到 ${found}/${total}`;
        }
    },

    _setupCanvas() {
        setTimeout(() => {
            const canvas = document.getElementById('draw-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let drawing = false;
            // Draw dotted circle guide
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(125, 125, 100, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            // Drawing
            ctx.strokeStyle = '#FF6B6B';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            const getPos = (e) => {
                const rect = canvas.getBoundingClientRect();
                const t = e.touches ? e.touches[0] : e;
                return { x: t.clientX - rect.left, y: t.clientY - rect.top };
            };
            const start = (e) => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
            const move = (e) => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
            const end = () => { drawing = false; };
            canvas.addEventListener('mousedown', start);
            canvas.addEventListener('mousemove', move);
            canvas.addEventListener('mouseup', end);
            canvas.addEventListener('touchstart', start, {passive:false});
            canvas.addEventListener('touchmove', move, {passive:false});
            canvas.addEventListener('touchend', end);
        }, 100);
    },

    _checkCircleDraw() {
        this.speak('嘩！好靚嘅圓形！你好叻呀！');
        this.discoveries++;
        document.getElementById('explore-score').textContent = `⭐ ${this.discoveries}`;
    },

    _startRoll() {
        const circle = document.getElementById('race-circle');
        const square = document.getElementById('race-square');
        if (circle) { circle.style.transition = 'transform 1.5s ease-out'; circle.style.transform = 'translateX(150px)'; }
        if (square) { square.style.transition = 'transform 0.3s'; square.style.transform = 'translateX(20px) rotate(10deg)'; }
        this.speak('圓形碌到去終點！方形卡住咗！');
    },

    _addCircle(size) {
        const canvas = document.getElementById('art-canvas');
        if (!canvas) return;
        const sizes = {big: 60, med: 40, small: 25};
        const colors = ['#FF6B6B','#4ECDC4','#FFE66D','#A78BFA','#FFB347'];
        const s = sizes[size];
        const c = document.createElement('div');
        c.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;background:${colors[Math.floor(Math.random()*colors.length)]};position:absolute;left:${Math.random()*(canvas.offsetWidth-s)}px;top:${Math.random()*(canvas.offsetHeight-s)}px;border:2px solid white;cursor:pointer;`;
        canvas.appendChild(c);
        this.speak('圓形！');
    },

    _explorePrev() {
        if (this.stepIndex > 0) { this.stepIndex--; this._renderExplorationStep(this._container(), this.currentActivity); }
    },
    _exploreNext() {
        const a = this.currentActivity;
        if (this.stepIndex < a.steps.length - 1) { this.stepIndex++; this._renderExplorationStep(this._container(), a); }
        else { this._finishActivity(this._container(), a); }
    },

    /* ==========================================================
       GAME TYPE — Interactive challenges
       ========================================================== */
    renderGame(container, activity) {
        this.stepIndex = 0;
        this.score = 0;
        this._renderGameStep(container, activity);
    },

    _renderGameStep(container, activity) {
        const step = activity.steps[this.stepIndex];
        if (!step) { this._finishActivity(container, activity); return; }
        const isFirst = this.stepIndex === 0;
        const isLast = this.stepIndex === activity.steps.length - 1;
        const progress = ((this.stepIndex + 1) / activity.steps.length * 100);

        container.innerHTML = `
            <div class="game-activity">
                <div class="story-progress-bar"><div class="story-progress-fill" style="width:${progress}%"></div></div>
                <div class="game-header">
                    <span class="game-title">🎮 ${step.text}</span>
                    <span class="game-score" id="game-score">⭐ ${this.score}</span>
                </div>
                <p class="story-prompt">${step.desc}</p>
                <div class="game-area" id="game-area"></div>
                <div class="story-nav">
                    ${!isFirst ? '<button class="story-btn story-prev" onclick="Activities._gamePrev()">← 返去</button>' : '<div></div>'}
                    <button class="story-btn story-next" id="game-next-btn" onclick="Activities._gameNext()">
                        ${isLast ? '完成 🎉' : '繼續 →'}
                    </button>
                </div>
            </div>`;

        this._renderGameContent(activity, step);
        if (isFirst) this.speak(activity.audio.intro);
        else if (isLast && activity.id !== 'd5-review') this.speak(activity.audio.completion);
    },

    _renderGameContent(activity, step) {
        const area = document.getElementById('game-area');
        if (!area) return;

        switch(activity.id) {
            case 'd2-body': this._gameD2Body(area, step); break;
            case 'd3-shapes': this._gameD3Shapes(area, step); break;
            case 'd4-counting': this._gameD4Counting(area, step); break;
            case 'd5-review': this._gameD5Review(area, step); break;
            default: area.innerHTML = '<p>遊戲加載中...</p>';
        }
    },

    // --- D2 Body Game ---
    _gameD2Body(area, step) {
        const parts = [{n:'頭',e:'🗣️'},{n:'眼睛',e:'👀'},{n:'鼻',e:'👃'},{n:'嘴巴',e:'👄'},{n:'手',e:'✋'},{n:'腳',e:'🦶'}];
        switch(step.action) {
            case 'bodyIntro':
                area.innerHTML = `<div class="body-display">
                    <div class="story-character bounce-in" style="font-size:80px">🐼</div>
                    <div class="dialogue-bubble">「嚟認識我哋嘅身體部位！」</div>
                </div>`;
                break;
            case 'bodyLearn':
                area.innerHTML = `<div class="body-parts-grid">
                    ${parts.map((p,i) => `
                        <button class="big-option body-part-btn" onclick="Activities._learnBodyPart(this,'${p.n}','${p.e}')" style="animation-delay:${i*0.2}s">
                            <span style="font-size:40px">${p.e}</span><br>${p.n}
                        </button>
                    `).join('')}
                </div>`;
                this.speak('㩒每個身體部位認識佢！');
                break;
            case 'bodyQuiz':
                this._bodyQuizRound = 0;
                this._bodyQuizParts = [...parts].sort(() => Math.random() - 0.5).slice(0, 4);
                this._renderBodyQuiz(area);
                break;
            case 'danceTime':
                const moves = ['擺手 ✋','踏腳 🦶','點頭 🗣️','轉圈 🔄'];
                area.innerHTML = `<div class="dance-area">
                    <div class="story-character" style="font-size:60px" id="dance-char">🐼</div>
                    <div class="dance-moves">${moves.map((m,i) =>
                        `<button class="big-option dance-btn" onclick="Activities._doDance(this,'${m}')" style="animation-delay:${i*0.15}s">${m}</button>`
                    ).join('')}</div>
                    <p>㩒動作跟住做！</p>
                </div>`;
                this.speak('跳舞時間！跟住波波做動作！');
                break;
            case 'bodyComplete':
                area.innerHTML = `<div class="completion-display">
                    <div class="group-photo">🐼🐰</div>
                    <div class="dialogue-bubble">「你識得好多身體部位喇！」</div>
                    <div class="body-summary">${parts.map(p => `<span class="body-tag">${p.e}${p.n}</span>`).join('')}</div>
                </div>`;
                break;
        }
    },

    _learnBodyPart(el, name, emoji) {
        this._bounce(el);
        el.classList.add('learned');
        this.speak(`呢個係${name}！摸下你嘅${name}！`);
        this.score++;
        document.getElementById('game-score').textContent = `⭐ ${this.score}`;
    },

    _renderBodyQuiz(area) {
        if (this._bodyQuizRound >= this._bodyQuizParts.length) {
            area.innerHTML = '<div class="celebration-row">🎉 全部答啱喇！🎉</div>';
            this.speak('好叻！全部答啱！');
            return;
        }
        const target = this._bodyQuizParts[this._bodyQuizRound];
        const allParts = [{n:'頭',e:'🗣️'},{n:'眼睛',e:'👀'},{n:'鼻',e:'👃'},{n:'嘴巴',e:'👄'},{n:'手',e:'✋'},{n:'腳',e:'🦶'}];
        const options = [target, ...allParts.filter(p => p.n !== target.n).sort(() => Math.random()-0.5).slice(0,2)].sort(() => Math.random()-0.5);
        area.innerHTML = `<div class="quiz-display">
            <div class="quiz-prompt">「${target.n}！」㩒${target.n}！</div>
            <div class="option-grid">${options.map(o =>
                `<button class="big-option quiz-btn" onclick="Activities._handleBodyQuiz(this,'${o.n}','${target.n}')">
                    <span style="font-size:40px">${o.e}</span><br>${o.n}
                </button>`
            ).join('')}</div>
        </div>`;
        this.speak(`${target.n}！㩒${target.n}！`);
    },

    _handleBodyQuiz(el, picked, target) {
        if (el.classList.contains('disabled')) return;
        if (picked === target) {
            el.classList.add('correct');
            this.speak(this.currentActivity.audio.correct);
            this.score++;
            document.getElementById('game-score').textContent = `⭐ ${this.score}`;
            document.querySelectorAll('.quiz-btn').forEach(b => b.classList.add('disabled'));
            this._bodyQuizRound++;
            setTimeout(() => this._renderBodyQuiz(document.getElementById('game-area')), 1000);
        } else {
            el.classList.add('incorrect');
            this._shake(el);
            this.speak(this.currentActivity.audio.wrong);
            setTimeout(() => el.classList.remove('incorrect'), 600);
        }
    },

    _doDance(el, move) {
        this._bounce(el);
        const ch = document.getElementById('dance-char');
        if (ch) { ch.style.transform = 'rotate(20deg)'; setTimeout(() => ch.style.transform = '', 300); }
        this.speak(move.replace(/[✋🦶🗣️🔄]/g,'').trim() + '！');
    },

    // --- D3 Shapes Game ---
    _gameD3Shapes(area, step) {
        switch(step.action) {
            case 'doorIntro':
                area.innerHTML = `<div class="door-display">
                    <div class="door-visual">🚪</div>
                    <div class="locks-row">
                        <span class="lock-shape">⭕</span>
                        <span class="lock-shape">⬜</span>
                        <span class="lock-shape">🔺</span>
                    </div>
                    <div class="dialogue-bubble">「門上有三個形狀鎖！我哋要搵啱嘅鑰匙！」</div>
                </div>`;
                break;
            case 'unlockDoor':
                this._unlockCount = 0;
                area.innerHTML = `<div class="unlock-game">
                    <div class="locks-row" id="locks-row">
                        ${step.shapes.map(s => `<div class="lock-slot" data-shape="${s.id}" id="lock-${s.id}">
                            <span class="lock-icon">${s.s}</span><br><small>${s.n}</small>
                        </div>`).join('')}
                    </div>
                    <div class="keys-row" id="keys-row">
                        ${step.shapes.sort(() => Math.random()-0.5).map(s => `<button class="big-option key-btn" data-shape="${s.id}"
                            onclick="Activities._handleKeyTap(this,'${s.id}','${s.n}')">
                            🔑${s.s}<br><small>${s.n}</small>
                        </button>`).join('')}
                    </div>
                </div>`;
                this.speak('將啱嘅鑰匙㩒去開鎖！');
                break;
            case 'meetCircle':
                area.innerHTML = `<div class="character-intro">
                    <div class="story-character bounce-in" style="font-size:80px">🐢</div>
                    <div class="dialogue-bubble">「我係圓圓！我嘅龜殼係圓形！冇角，可以碌嚟碌去！」</div>
                    <div class="shape-info">⭕ 圓形 — 冇角，圓碌碌</div>
                </div>`;
                this.speak('我係圓圓！圓形冇角，可以碌嚟碌去！');
                break;
            case 'meetSquareTriangle':
                area.innerHTML = `<div class="character-intro">
                    <div class="two-chars">
                        <div>
                            <div class="story-character bounce-in" style="font-size:60px">🐘</div>
                            <div class="dialogue-bubble small">「我係方方！正方形有四條邊、四個角！」</div>
                        </div>
                        <div>
                            <div class="story-character bounce-in" style="font-size:60px;animation-delay:0.3s">🦊</div>
                            <div class="dialogue-bubble small">「我係三三！三角形有三條邊、三個角！」</div>
                        </div>
                    </div>
                </div>`;
                this.speak('方方有四條邊四個角！三三有三條邊三個角！');
                break;
            case 'shapeCookies':
                this._cookiesDone = 0;
                const shapes = step.items.sort(() => Math.random()-0.5);
                area.innerHTML = `<div class="cookie-game">
                    <div class="plates-row">
                        <div class="plate" data-shape="circle">⭕碟</div>
                        <div class="plate" data-shape="square">⬜碟</div>
                        <div class="plate" data-shape="triangle">🔺碟</div>
                    </div>
                    <div class="option-grid">${shapes.map(s =>
                        `<button class="big-option cookie-btn" data-target="${s.t}"
                            onclick="Activities._handleCookieTap(this,'${s.t}','${s.n}')">
                            🍪${s.s}<br><small>${s.n}</small>
                        </button>`
                    ).join('')}</div>
                </div>`;
                this.speak('將形狀餅乾放去啱嘅碟！');
                break;
        }
    },

    _handleKeyTap(el, shapeId, shapeName) {
        if (el.classList.contains('disabled')) return;
        // Find next unlocked lock
        const locks = document.querySelectorAll('.lock-slot:not(.unlocked)');
        if (locks.length === 0) return;
        // Find matching lock by shape (not just first)
        const matchingLock = Array.from(locks).find(l => l.dataset.shape === shapeId);
        if (matchingLock) {
            el.classList.add('correct', 'disabled');
            matchingLock.classList.add('unlocked');
            this._bounce(matchingLock);
            this.score++;
            document.getElementById('game-score').textContent = `⭐ ${this.score}`;
            this.speak(`開到喇！${shapeName}！`);
        } else {
            el.classList.add('incorrect');
            this._shake(el);
            this.speak(this.currentActivity.audio.wrong);
            setTimeout(() => el.classList.remove('incorrect'), 600);
        }
    },

    _handleCookieTap(el, target, name) {
        if (el.classList.contains('disabled')) return;
        const plate = document.querySelector(`.plate[data-shape="${target}"]`);
        if (plate) {
            el.classList.add('correct', 'disabled');
            plate.classList.add('filled');
            plate.textContent += ' 🍪';
            this._bounce(plate);
            this.score++;
            document.getElementById('game-score').textContent = `⭐ ${this.score}`;
            this.speak(`${name}放喺${target === 'circle' ? '圓形' : target === 'square' ? '方形' : '三角形'}碟！`);
            this._cookiesDone++;
            if (this._cookiesDone >= 3) {
                setTimeout(() => this.speak('全部放好喇！動物們一齊食餅！'), 500);
            }
        }
    },

    // --- D4 Counting Game ---
    _gameD4Counting(area, step) {
        switch(step.action) {
            case 'orchardIntro':
                area.innerHTML = `<div class="orchard-intro">
                    <div class="story-character bounce-in" style="font-size:60px">🐼🧺</div>
                    <div class="trees-row">🌳🍎 🌳🍊 🌳🍌</div>
                    <div class="dialogue-bubble">「今日要摘水果送俾朋友！」</div>
                </div>`;
                break;
            case 'pick':
                this._picked = 0;
                const fruits = [];
                for (let i = 0; i < step.total; i++) fruits.push(step.fruit);
                area.innerHTML = `<div class="pick-game">
                    <div class="pick-target">
                        <span style="font-size:30px">${step.recipient}</span>
                        <span> 要 <strong>${step.count}</strong> 個${step.fruit}！</span>
                    </div>
                    <div class="pick-counter" id="pick-counter">已摘: 0</div>
                    <div class="fruit-tree" id="fruit-tree">
                        ${fruits.map((f, i) => `<button class="fruit-btn" data-idx="${i}"
                            onclick="Activities._handlePick(this,'${step.fruit}',${step.count})">${f}</button>`).join('')}
                    </div>
                    <div class="basket" id="basket">🧺</div>
                </div>`;
                this.speak(`${step.recipient.replace(/[🐰🐦🐼]/g,'')}要${step.count}個！㩒${step.count}個！`);
                break;
            case 'countAll':
                const allFruits = ['🍎','🍊🍊','🍌🍌🍌'];
                area.innerHTML = `<div class="count-all">
                    <p>我哋一共摘咗幾多個水果？</p>
                    <div class="all-fruits-row">${allFruits.join(' ')}</div>
                    <div class="count-display-big" id="total-count">數一數...</div>
                    <button class="big-option" onclick="Activities._countAllFruits()">數！</button>
                </div>`;
                this.speak('我哋一共摘咗幾多個？數一數！');
                break;
        }
    },

    _handlePick(el, fruit, targetCount) {
        if (el.classList.contains('picked')) return;
        if (this._picked >= targetCount) {
            this.speak(`太多喇！只要${targetCount}個㗎！`);
            return;
        }
        el.classList.add('picked');
        el.style.opacity = '0.3';
        this._picked++;
        document.getElementById('pick-counter').textContent = `已摘: ${this._picked}`;
        const basket = document.getElementById('basket');
        basket.textContent += fruit;
        this.speak(String(this._picked));

        if (this._picked === targetCount) {
            this.score++;
            document.getElementById('game-score').textContent = `⭐ ${this.score}`;
            setTimeout(() => this.speak(this.currentActivity.audio.correct), 500);
            document.querySelectorAll('.fruit-btn:not(.picked)').forEach(b => b.classList.add('disabled'));
        }
    },

    _countAllFruits() {
        const el = document.getElementById('total-count');
        if (!el) return;
        let count = 0;
        const nums = [1, 2, 3, 4, 5, 6];
        const interval = setInterval(() => {
            if (count >= 6) {
                clearInterval(interval);
                el.textContent = '一共 6 個水果！🎉';
                this.speak('1、2、3、4、5、6！一共6個水果！好叻！');
                return;
            }
            count++;
            el.textContent = count;
        }, 500);
    },

    // --- D5 Review Game ---
    _gameD5Review(area, step) {
        switch(step.action) {
            case 'carnivalIntro':
                area.innerHTML = `<div class="carnival-intro">
                    <div class="group-photo bounce-in">🐼🐰🐦🐢🐘🦊🐟</div>
                    <div class="dialogue-bubble">「歡迎嚟到森林嘉年華！」</div>
                    <div class="carnival-booths">
                        <span class="booth-tag">🎯顏色</span>
                        <span class="booth-tag">🔷形狀</span>
                        <span class="booth-tag">🐟數數</span>
                    </div>
                </div>`;
                break;
            case 'colorShoot':
                this._shootRound = 0;
                this._shootColors = ['紅色','黃色','藍色','紅色','藍色'];
                this._renderShootRound(area);
                break;
            case 'shapeRing':
                const shapes = [{s:'⭕',n:'圓形',id:'circle'},{s:'⬜',n:'正方形',id:'square'},{s:'🔺',n:'三角形',id:'triangle'}];
                this._ringDone = 0;
                area.innerHTML = `<div class="ring-game">
                    <div class="pillars-row">
                        ${shapes.map(s => `<div class="pillar" data-shape="${s.id}">${s.s}<br><small>${s.n}</small></div>`).join('')}
                    </div>
                    <div class="option-grid">${shapes.sort(()=>Math.random()-0.5).map(s =>
                        `<button class="big-option ring-btn" data-shape="${s.id}"
                            onclick="Activities._handleRing(this,'${s.id}','${s.n}')">
                            ${s.s} ${s.n}
                        </button>`
                    ).join('')}</div>
                </div>`;
                this.speak('將形狀放去啱嘅柱！');
                break;
            case 'countFish':
                this._fishRounds = [{count:2,done:false},{count:3,done:false},{count:1,done:false}];
                this._fishRound = 0;
                this._fishPicked = 0;
                this._renderFishRound(area);
                break;
            case 'carnivalAward':
                area.innerHTML = `<div class="award-display">
                    <div class="stars-row">⭐⭐⭐⭐</div>
                    <div class="group-photo">🐼🐰🐦🐢🐘🦊🐟</div>
                    <h2>🏆 森林嘉年華冠軍！</h2>
                    <div class="celebration-row">🎆🎊🎆</div>
                </div>`;
                this.speak(this.currentActivity.audio.completion);
                break;
        }
    },

    _renderShootRound(area) {
        if (this._shootRound >= this._shootColors.length) {
            area.innerHTML = '<div class="celebration-row">全部射中！⭐</div>';
            this.speak('好叻！全部答啱！');
            this.score++;
            document.getElementById('game-score').textContent = `⭐ ${this.score}`;
            return;
        }
        const target = this._shootColors[this._shootRound];
        const colorMap = {'紅色':{c:'#FF6B6B',e:'🔴'},'黃色':{c:'#FFE66D',e:'🟡'},'藍色':{c:'#4ECDC4',e:'🔵'}};
        const allColors = Object.keys(colorMap);
        area.innerHTML = `<div class="shoot-game">
            <div class="shoot-prompt">㩒 <strong>${target}</strong> 嘅氣球！ (${this._shootRound+1}/5)</div>
            <div class="balloon-row">${allColors.sort(()=>Math.random()-0.5).map(c =>
                `<button class="balloon-btn" style="background:${colorMap[c].c}" data-color="${c}"
                    onclick="Activities._handleShoot(this,'${c}','${target}')">${colorMap[c].e}</button>`
            ).join('')}</div>
        </div>`;
        this.speak(`㩒${target}！`);
    },

    _handleShoot(el, picked, target) {
        if (el.classList.contains('disabled')) return;
        if (picked === target) {
            el.classList.add('correct');
            this._bounce(el);
            this.speak('啱喇！');
            document.querySelectorAll('.balloon-btn').forEach(b => b.classList.add('disabled'));
            this._shootRound++;
            setTimeout(() => this._renderShootRound(document.getElementById('game-area')), 800);
        } else {
            el.classList.add('incorrect');
            this._shake(el);
            this.speak('唔係喎！再試！');
            setTimeout(() => el.classList.remove('incorrect'), 400);
        }
    },

    _handleRing(el, shape, name) {
        if (el.classList.contains('disabled')) return;
        const pillar = document.querySelector(`.pillar[data-shape="${shape}"]`);
        if (pillar) {
            el.classList.add('correct', 'disabled');
            pillar.classList.add('matched');
            this._bounce(pillar);
            this.score++;
            document.getElementById('game-score').textContent = `⭐ ${this.score}`;
            this.speak(`${name}！啱喇！`);
            this._ringDone++;
            if (this._ringDone >= 3) {
                setTimeout(() => this.speak('三個形狀全部配啱！'), 500);
            }
        }
    },

    _renderFishRound(area) {
        if (this._fishRound >= this._fishRounds.length) {
            area.innerHTML = '<div class="celebration-row">釣到晒喇！⭐🐟</div>';
            this.speak('好叻！全部釣到！');
            this.score++;
            document.getElementById('game-score').textContent = `⭐ ${this.score}`;
            return;
        }
        const round = this._fishRounds[this._fishRound];
        this._fishPicked = 0;
        const fishCount = 5;
        area.innerHTML = `<div class="fish-game">
            <div class="fish-prompt">釣 <strong>${round.count}</strong> 條魚！</div>
            <div class="fish-counter" id="fish-counter">已釣: 0</div>
            <div class="fish-pond">${Array(fishCount).fill('').map((_,i) =>
                `<button class="fish-btn" onclick="Activities._handleFish(this,${round.count})">🐟</button>`
            ).join('')}</div>
        </div>`;
        this.speak(`釣${round.count}條魚！`);
    },

    _handleFish(el, target) {
        if (el.classList.contains('caught')) return;
        if (this._fishPicked >= target) {
            this.speak(`太多喇！只要${target}條！`);
            return;
        }
        el.classList.add('caught');
        el.textContent = '✅';
        this._fishPicked++;
        document.getElementById('fish-counter').textContent = `已釣: ${this._fishPicked}`;
        this.speak(String(this._fishPicked));
        if (this._fishPicked === target) {
            document.querySelectorAll('.fish-btn:not(.caught)').forEach(b => b.classList.add('disabled'));
            this._fishRound++;
            setTimeout(() => this._renderFishRound(document.getElementById('game-area')), 1000);
        }
    },

    _gamePrev() {
        if (this.stepIndex > 0) { this.stepIndex--; this._renderGameStep(this._container(), this.currentActivity); }
    },
    _gameNext() {
        const a = this.currentActivity;
        if (this.stepIndex < a.steps.length - 1) { this.stepIndex++; this._renderGameStep(this._container(), a); }
        else { this._finishActivity(this._container(), a); }
    },

    /* ========== Finish Activity ========== */
    _finishActivity(container, activity) {
        this.speak(activity.audio.completion);
        this.showSuccess();
    },

    /* ========== Feedback ========== */
    showSuccess() {
        const overlay = document.getElementById('success-overlay');
        if (overlay) {
            overlay.classList.add('active');
            this.speak('叻叻！做得好！');
            setTimeout(() => {
                overlay.classList.remove('active');
                App.afterActivity();
            }, 1500);
        } else {
            App.afterActivity();
        }
    },

    showRetry() {
        const overlay = document.getElementById('retry-overlay');
        if (overlay) {
            overlay.classList.add('active');
            this.speak('再試一次！');
            setTimeout(() => overlay.classList.remove('active'), 1000);
        }
    }
};
