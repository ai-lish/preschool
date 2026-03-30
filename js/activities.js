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
    
    // Drag state
    draggedItem: null,
    dragClone: null,
    touchOffsetX: 0,
    touchOffsetY: 0,
    
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
                        keyConcept: '幼兒開始理解數字可以代表數量'
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
                    learningGoals: ['認識紅色', '區分紅色同藍色']
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
                ]
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
                ]
            },
            {
                id: 'd3-shape-match',
                type: 'drag',
                skill: 'shape-match',
                skillName: '形狀配對',
                prompt: '將相同形狀拖過去！',
                correctAudio: '冇錯！形狀一樣！',
                wrongAudio: '形狀要一樣，再試！',
                items: [
                    { id: 'circle', icon: '⚪', target: 'circle', label: '圓形' },
                    { id: 'square', icon: '🟧', target: 'square', label: '方形' },
                    { id: 'triangle', icon: '🔺', target: 'triangle', label: '三角形' }
                ],
                dropZones: [
                    { id: 'circle', label: '圓形', color: '#ccc' },
                    { id: 'square', label: '方形', color: '#ccc' },
                    { id: 'triangle', label: '三角形', color: '#ccc' }
                ],
                parentInfo: {
                    summary: '形狀配對訓練視覺分類能力。',
                    homeApplication: ['玩具分類形狀', '搵生活中嘅形狀']
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
                wrongAudio: '慢慢數，一，二...',
                count: 2,
                items: ['🍎', '🍎'],
                parentInfo: {
                    summary: '點數係數學認知嘅基礎。',
                    homeApplication: ['數手指', '數樓梯', '數玩具']
                }
            },
            {
                id: 'd4-shape-circle',
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
                ]
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
                    homeApplication: ['每晚問「今日學咗咩？」']
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
            case 'drag':
                this.renderDragActivity(container, activity);
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
                                onclick="Activities.handleTap(this, ${opt.correct})">
                            <span class="tap-option-icon">${opt.icon}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.speakPrompt(activity.prompt);
    },
    
    handleTap(element, correct) {
        if (element.classList.contains('disabled')) return;
        
        const activity = this.getCurrent();
        
        if (correct) {
            element.classList.add('correct');
            this.speak(activity.correctAudio);
            setTimeout(() => {
                this.showSuccess();
            }, 800);
        } else {
            element.classList.add('incorrect');
            this.speak(activity.wrongAudio);
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
                                onclick="Activities.handleCountTap(this)">
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
    
    handleCountTap(element) {
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
    
    /* ========== Drag Activity (Native Touch) ========== */
    renderDragActivity(container, activity) {
        container.innerHTML = `
            <div class="activity-content">
                <div class="tap-question">
                    <div class="tap-question-icon">🔊</div>
                    <p>${activity.prompt}</p>
                </div>
                
                <div class="drag-container">
                    <div class="drag-source">
                        ${activity.items.map((item, idx) => `
                            <div class="drag-item stagger-item" 
                                 id="drag-${item.id}"
                                 data-target="${item.target}"
                                 data-id="${item.id}">
                                <span class="drag-icon">${item.icon}</span>
                                <span class="drag-label">${item.label}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="drop-zones">
                        ${activity.dropZones.map(zone => `
                            <div class="drop-zone stagger-item"
                                 id="drop-${zone.id}"
                                 data-zone="${zone.id}">
                                <span class="drop-zone-label">${zone.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.setupDragEvents();
        this.speakPrompt(activity.prompt);
    },
    
    setupDragEvents() {
        const dragItems = document.querySelectorAll('.drag-item');
        const dropZones = document.querySelectorAll('.drop-zone');
        
        dragItems.forEach(item => {
            // Desktop drag events (standard HTML5)
            item.setAttribute('draggable', 'true');
            
            item.addEventListener('dragstart', (e) => {
                this.draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.setData('text/plain', item.dataset.target);
                e.dataTransfer.effectAllowed = 'move';
            });
            
            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
                this.draggedItem = null;
            });
            
            // Touch events for mobile - native implementation
            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = item.getBoundingClientRect();
                
                this.draggedItem = item;
                this.touchOffsetX = touch.clientX - rect.left;
                this.touchOffsetY = touch.clientY - rect.top;
                
                // Create clone for dragging visual
                this.dragClone = item.cloneNode(true);
                this.dragClone.style.position = 'fixed';
                this.dragClone.style.zIndex = '1000';
                this.dragClone.style.pointerEvents = 'none';
                this.dragClone.style.opacity = '0.9';
                this.dragClone.style.transform = 'scale(1.1)';
                this.dragClone.classList.add('dragging');
                
                this.updateClonePosition(touch.clientX, touch.clientY);
                document.body.appendChild(this.dragClone);
                
                item.classList.add('dragging');
            }, { passive: false });
            
            item.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!this.dragClone) return;
                
                const touch = e.touches[0];
                this.updateClonePosition(touch.clientX, touch.clientY);
                
                // Check if over a drop zone
                dropZones.forEach(zone => {
                    const rect = zone.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        zone.classList.add('drag-over');
                    } else {
                        zone.classList.remove('drag-over');
                    }
                });
            }, { passive: false });
            
            item.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (!this.draggedItem || !this.dragClone) return;
                
                const touch = e.changedTouches[0];
                
                // Find which drop zone we're over
                let matchedZone = null;
                dropZones.forEach(zone => {
                    zone.classList.remove('drag-over');
                    const rect = zone.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        matchedZone = zone;
                    }
                });
                
                if (matchedZone) {
                    this.handleDropMatch(matchedZone);
                }
                
                // Cleanup
                this.dragClone.remove();
                this.dragClone = null;
                this.draggedItem.classList.remove('dragging');
                this.draggedItem = null;
            }, { passive: false });
        });
        
        // Desktop drop zone events
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.classList.add('drag-over');
            });
            
            zone.addEventListener('dragleave', (e) => {
                zone.classList.remove('drag-over');
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const draggedTarget = e.dataTransfer.getData('text/plain');
                const zoneId = zone.dataset.zone;
                
                if (draggedTarget === zoneId) {
                    this.handleDropMatch(zone);
                } else {
                    this.handleDropFail(zone);
                }
            });
        });
    },
    
    updateClonePosition(x, y) {
        if (!this.dragClone) return;
        this.dragClone.style.left = (x - this.touchOffsetX) + 'px';
        this.dragClone.style.top = (y - this.touchOffsetY) + 'px';
    },
    
    handleDropMatch(zone) {
        const item = this.draggedItem;
        if (!item || item.classList.contains('used')) return;
        
        const activity = this.getCurrent();
        const targetId = item.dataset.target;
        const zoneId = zone.dataset.zone;
        
        if (targetId === zoneId) {
            // Success!
            item.classList.add('used');
            item.style.opacity = '0.3';
            item.style.pointerEvents = 'none';
            
            zone.classList.add('filled');
            
            this.speak(activity.correctAudio);
            
            // Check if all matched
            const usedItems = document.querySelectorAll('.drag-item.used').length;
            if (usedItems >= activity.items.length) {
                setTimeout(() => {
                    this.showSuccess();
                }, 500);
            }
        } else {
            this.handleDropFail(zone);
        }
    },
    
    handleDropFail(zone) {
        const activity = this.getCurrent();
        
        zone.classList.add('wrong');
        this.speak(activity.wrongAudio);
        this.attempts++;
        
        setTimeout(() => {
            zone.classList.remove('wrong');
        }, 500);
        
        if (this.attempts >= this.maxAttempts) {
            // Show all correct answers
            const activity = this.getCurrent();
            activity.items.forEach(item => {
                const el = document.getElementById('drag-' + item.id);
                if (el) {
                    el.classList.add('used');
                    el.style.opacity = '0.3';
                    el.style.pointerEvents = 'none';
                }
            });
            activity.dropZones.forEach(zone => {
                const z = document.getElementById('drop-' + zone.id);
                if (z) z.classList.add('filled');
            });
            setTimeout(() => {
                App.afterActivity();
            }, 2000);
        } else {
            this.showRetry();
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
            document.querySelectorAll('.tap-option.incorrect').forEach(el => {
                el.classList.remove('incorrect');
            });
        }, 1000);
    }
};
