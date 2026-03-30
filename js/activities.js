/* ==========================================
   K1 Learning Platform - Activity Engine
   ========================================== */

const Activities = {
    currentActivity: null,
    currentIndex: 0,
    activities: [],
    attempts: 0,
    maxAttempts: 2,
    countNumber: 0,
    
    /* ========== Week 1 Data ========== */
    week1Data: {
        day1: [
            {
                id: 'd1-age-tap',
                type: 'tap',
                skill: 'self-age',
                skillName: '年齡認知',
                prompt: '你幾歲呀？',
                correctAudio: '叻叻！你今年3歲喇！',
                wrongAudio: '試多次，3歲係最大嗰個數字。',
                options: [
                    { id: '1', icon: '1️⃣', correct: false },
                    { id: '2', icon: '2️⃣', correct: false },
                    { id: '3', icon: '3️⃣', correct: true }
                ],
                parentInfo: {
                    summary: '年齡認知係自我認識嘅基礎。',
                    learningGoals: ['認識數字 1、2、3', '理解數量代表年齡'],
                    designRationale: '3選1降低難度，配合視覺提示。',
                    developmentalPsychology: {
                        theory: 'Piaget 前運算期',
                        keyConcept: '幼兒開始理解數字可以代表數量',
                        ageAppropriateness: '3歲可以理解「幾多歲」概念'
                    },
                    homeApplication: ['數家庭成員年齡', '用手指表示年齡']
                }
            },
            {
                id: 'd1-colour-rb',
                type: 'tap',
                skill: 'colour-red-blue',
                skillName: '顏色認知',
                prompt: '邊個係紅色？',
                correctAudio: '冇錯！蘋果係紅色！',
                wrongAudio: '蘋果係紅色，試多次！',
                options: [
                    { id: 'red', icon: '🍎', correct: true },
                    { id: 'blue', icon: '🌊', correct: false }
                ],
                parentInfo: {
                    summary: '紅色係最基本嘅原色。',
                    learningGoals: ['認識紅色', '區分紅色同藍色'],
                    designRationale: '2選1建立成功感。',
                    developmentalPsychology: {
                        theory: '視覺發展',
                        keyConcept: '原色最容易被幼兒區分',
                        ageAppropriateness: '3歲開始可以區分基本顏色'
                    },
                    homeApplication: ['指住物件問顏色', '着衫時討論顏色']
                }
            }
        ],
        day2: [
            {
                id: 'd2-colour-ry',
                type: 'tap',
                skill: 'colour-red-yellow',
                skillName: '顏色認知',
                prompt: '邊個係黃色？',
                correctAudio: '做得好！香蕉係黃色！',
                wrongAudio: '黃色係香蕉，試多次！',
                options: [
                    { id: 'yellow', icon: '🍌', correct: true },
                    { id: 'red', icon: '🍎', correct: false }
                ],
                parentInfo: {
                    summary: '認識第三原色 — 黃色。',
                    learningGoals: ['認識黃色', '鞏固紅色認知'],
                    designRationale: '由2選1開始逐步建立顏色分類能力。',
                    homeApplication: ['黄色物品：香蕉、太陽']
                }
            },
            {
                id: 'd2-body-parts',
                type: 'tap',
                skill: 'self-body',
                skillName: '身體部位',
                prompt: '眼喺邊？',
                correctAudio: '冇錯！眼仔喺度！',
                wrongAudio: '眼仔喺上面，試點眼仔！',
                options: [
                    { id: 'eye', icon: '👁️', correct: true },
                    { id: 'nose', icon: '👃', correct: false },
                    { id: 'mouth', icon: '👄', correct: false }
                ],
                parentInfo: {
                    summary: '認識身體部位係自我意識發展嘅重要一步。',
                    learningGoals: ['認識眼、耳、口、鼻', '建立身體圖式'],
                    designRationale: '由最熟悉嘅身體部位出發。',
                    developmentalPsychology: {
                        theory: 'Erikson 信任 vs 懷疑階段',
                        keyConcept: '認識自己嘅身體係建立安全感嘅基礎'
                    },
                    homeApplication: ['照鏡時指出五官', '玩「身體部位歌」']
                }
            }
        ],
        day3: [
            {
                id: 'd3-colour-3',
                type: 'tap',
                skill: 'colour-3',
                skillName: '三原色',
                prompt: '邊個係藍色？',
                correctAudio: '做得好！天空係藍色！',
                wrongAudio: '藍色係天空，試多次！',
                options: [
                    { id: 'blue', icon: '🚗', correct: true },
                    { id: 'yellow', icon: '🌻', correct: false },
                    { id: 'red', icon: '🎈', correct: false }
                ],
                parentInfo: {
                    summary: '同時認紅、黃、藍三原色。',
                    learningGoals: ['同時識別三種顏色', '快速反應正確顏色'],
                    designRationale: '由2選1過渡到3選1，係難度嘅自然提升。',
                    homeApplication: ['三色積木分類', '着衫時數顏色']
                }
            },
            {
                id: 'd3-shape-circle',
                type: 'tap',
                skill: 'shape-circle',
                skillName: '形狀認知',
                prompt: '邊個係圓形？',
                correctAudio: '叻！波係圓形！',
                wrongAudio: '波係圓形，試再點！',
                options: [
                    { id: 'circle', icon: '⚽', correct: true },
                    { id: 'square', icon: '📦', correct: false },
                    { id: 'triangle', icon: '🔺', correct: false }
                ],
                parentInfo: {
                    summary: '圓形係最基本嘅形狀。',
                    learningGoals: ['識別圓形', '區分圓形同其他形狀'],
                    designRationale: '圓形唔需要銳角或直線知覺，最容易被幼兒識別。',
                    homeApplication: ['搵圓形：時鐘、碗、氣球', '用手指畫圓']
                }
            }
        ],
        day4: [
            {
                id: 'd4-count-1',
                type: 'count',
                skill: 'count-1',
                skillName: '數數1-3',
                prompt: '數一數有幾多個蘋果？',
                correctAudio: '數得好好！蘋果有兩個！',
                wrongAudio: '慢慢數，一、二...',
                count: 2,
                items: ['🍎', '🍎'],
                parentInfo: {
                    summary: '點數係數學認知嘅基礎。',
                    learningGoals: ['正確點數1-3個物件', '理解每個數字代表一個數量'],
                    designRationale: '點擊每一個物件，配合語音，建立數量同語言嘅聯繫。',
                    developmentalPsychology: {
                        theory: 'Piaget 數概念發展',
                        keyConcept: '3歲處於前期準備階段，開始理解「一對一對應」原則'
                    },
                    homeApplication: ['數手指', '數樓梯', '數玩具']
                }
            },
            {
                id: 'd4-shape-square',
                type: 'tap',
                skill: 'shape-square',
                skillName: '形狀認知',
                prompt: '邊個係正方形？',
                correctAudio: '冇錯！積木係正方形！',
                wrongAudio: '積木係正方形，試再點！',
                options: [
                    { id: 'square', icon: '📦', correct: true },
                    { id: 'circle', icon: '⭕', correct: false },
                    { id: 'triangle', icon: '🔺', correct: false }
                ],
                parentInfo: {
                    summary: '正方形有四個一樣長嘅邊。',
                    learningGoals: ['識別正方形', '認識正方形特性'],
                    homeApplication: ['搵正方形：窗、門、書']
                }
            }
        ],
        day5: [
            {
                id: 'd5-review',
                type: 'tap',
                skill: 'review-w1',
                skillName: '綜合回顧',
                prompt: '邊個係紅色？',
                correctAudio: '叻叻！你記得蘋果係紅色！',
                wrongAudio: '蘋果係紅色，再試多次！',
                options: [
                    { id: 'red', icon: '🍎', correct: true },
                    { id: 'blue', icon: '🌊', correct: false },
                    { id: 'yellow', icon: '🍌', correct: false }
                ],
                parentInfo: {
                    summary: '溫故知新！間隔回顧係記憶鞏固嘅關鍵。',
                    learningGoals: ['溫固顏色認知', '鞏固數數概念', '建立學習自信心'],
                    designRationale: '綜合練習混合不同類型，保持新鮮感同時確認學習成效。',
                    developmentalPsychology: {
                        theory: '遺忘曲線 + 間隔效應',
                        keyConcept: '新資訊需要多次回顧先會轉為長期記憶'
                    },
                    homeApplication: ['每晚問「今日學咗咩？」', '帶佢搵紅色嘅嘢', '數手指問幾多']
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
        this.countNumber = 0;
    },
    
    getCurrent() {
        return this.activities[this.currentIndex];
    },
    
    next() {
        if (this.currentIndex < this.activities.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    },
    
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return true;
        }
        return false;
    },
    
    isLast() {
        return this.currentIndex >= this.activities.length - 1;
    },
    
    isFirst() {
        return this.currentIndex === 0;
    },
    
    /* ========== Render Activities ========== */
    render(container) {
        const activity = this.getCurrent();
        if (!activity) return;
        
        this.currentActivity = activity;
        this.attempts = 0;
        this.countNumber = 0;
        
        switch (activity.type) {
            case 'tap':
                this.renderTapActivity(container, activity);
                break;
            case 'count':
                this.renderCountActivity(container, activity);
                break;
            default:
                container.innerHTML = '<p>活動加載中...</p>';
        }
    },
    
    /* ========== Tap Activity ========== */
    renderTapActivity(container, activity) {
        container.innerHTML = `
            <div class="activity-content">
                <div class="tap-question">
                    <div class="tap-question-icon">🔊</div>
                    <p>${activity.prompt}</p>
                </div>
                
                <div class="tap-options">
                    ${activity.options.map((opt, idx) => `
                        <button class="tap-option stagger-item" 
                                data-correct="${opt.correct}"
                                onclick="Activities.handleTap(this, ${opt.correct}, '${activity.correctAudio}', '${activity.wrongAudio}')">
                            <span class="tap-option-icon">${opt.icon}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.speakPrompt(activity.prompt);
    },
    
    handleTap(element, correct, correctAudio, wrongAudio) {
        if (element.classList.contains('disabled')) return;
        
        if (correct) {
            element.classList.add('correct');
            this.speak(correctAudio);
            setTimeout(() => {
                this.showSuccess();
            }, 800);
        } else {
            element.classList.add('incorrect');
            this.speak(wrongAudio);
            this.attempts++;
            
            if (this.attempts >= this.maxAttempts) {
                this.showCorrectAnswer();
            } else {
                this.showRetry();
            }
        }
    },
    
    showCorrectAnswer() {
        const activity = this.getCurrent();
        const options = document.querySelectorAll('.tap-option');
        options.forEach(opt => {
            if (opt.dataset.correct === 'true') {
                opt.classList.add('correct');
            }
            opt.classList.add('disabled');
        });
        
        this.speak(activity.correctAudio);
        setTimeout(() => {
            App.afterActivity();
        }, 2000);
    },
    
    /* ========== Count Activity ========== */
    renderCountActivity(container, activity) {
        container.innerHTML = `
            <div class="activity-content">
                <p class="count-question">${activity.prompt}</p>
                
                <div class="count-items">
                    ${activity.items.map((item, idx) => `
                        <button class="count-item tap-option stagger-item" 
                                onclick="Activities.handleCountTap(this, ${idx})">
                            <span class="tap-option-icon">${item}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="count-display">
                    <span id="count-number">0</span>
                </div>
            </div>
        `;
        
        this.countNumber = 0;
        this.speakPrompt(activity.prompt);
    },
    
    handleCountTap(element, index) {
        if (element.classList.contains('counted')) return;
        
        element.classList.add('counted');
        element.classList.add('correct');
        
        this.countNumber++;
        document.getElementById('count-number').textContent = this.countNumber;
        
        this.speakNumber(this.countNumber);
        
        const activity = this.getCurrent();
        if (this.countNumber >= activity.count) {
            this.speak(activity.correctAudio);
            setTimeout(() => {
                this.showSuccess();
            }, 800);
        }
    },
    
    /* ========== Audio ========== */
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-HK';
            utterance.rate = 0.85;
            const settings = ProgressManager.getSettings();
            utterance.volume = settings.volume;
            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);
        }
    },
    
    speakPrompt(text) {
        this.speak(text);
    },
    
    speakNumber(num) {
        this.speak(String(num));
    },
    
    speakCorrect() {
        this.speak('冇錯！做得好！');
    },
    
    speakRetry() {
        this.speak('再試一次！');
    },
    
    /* ========== Feedback ========== */
    showSuccess() {
        const overlay = document.getElementById('success-overlay');
        overlay.classList.add('active');
        
        this.speak('叻叻！做得好！');
        
        setTimeout(() => {
            overlay.classList.remove('active');
            App.afterActivity();
        }, 1200);
    },
    
    showRetry() {
        const overlay = document.getElementById('retry-overlay');
        overlay.classList.add('active');
        
        this.speakRetry();
        
        setTimeout(() => {
            overlay.classList.remove('active');
            // Remove incorrect class after delay
            document.querySelectorAll('.tap-option.incorrect').forEach(el => {
                el.classList.remove('incorrect');
            });
        }, 1000);
    }
};