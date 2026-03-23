
// ===== 週折疊切換 =====
function toggleWeek(num) {
    const content = document.getElementById('week-content-' + num);
    const toggle = document.getElementById('week-toggle-' + num);
    if (content.classList.contains('active')) {
        content.classList.remove('active');
        toggle.classList.add('collapsed');
    } else {
        content.classList.add('active');
        toggle.classList.remove('collapsed');
    }
}

// ===== Mini Tab 切換 =====
function showMiniTab(week, tab) {
    // Update tab buttons
    const tabBtns = document.querySelectorAll('.mini-tab');
    tabBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i + 1 === tab);
    });
    
    // Update content
    const contents = document.querySelectorAll('.mini-content');
    contents.forEach((c, i) => {
        c.classList.toggle('active', c.id === 'mini-' + week + '-' + tab);
    });
    
    // Init canvases if switching to draw tabs
    if (tab === 2) setTimeout(initCanvases, 100);
    if (tab === 3) setTimeout(initWriteCanvases, 100);
}

// ===== 書寫畫布 =====
function initWriteCanvases() {
    document.querySelectorAll('.write-canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        let isDrawing = false;
        let lastX = 0, lastY = 0;
        
        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            if (e.touches) {
                return {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                };
            }
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x; lastY = pos.y;
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastX = pos.x; lastY = pos.y;
        });
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseleave', () => isDrawing = false);
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x; lastY = pos.y;
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastX = pos.x; lastY = pos.y;
        }, { passive: false });
        canvas.addEventListener('touchend', () => isDrawing = false);
    });
}

function resetWriteCanvases() {
    document.querySelectorAll('.write-canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
}

function saveGame3() {
    let hasContent = false;
    document.querySelectorAll('.write-canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (imageData.data[i + 3] > 0) { hasContent = true; break; }
        }
    });
    if (hasContent) {
        localStorage.setItem('game3_done', 'true');
        showToast();
    } else {
        alert('請先寫字！');
    }
}

// ===== 修改現有函數 =====
// ===== 導航 =====
        function showSubject(subject) {
            document.querySelector('.menu').style.display = 'none';
            document.getElementById(subject + '-weeks').classList.add('active');
        }
        
        function showWeek(subject, week) {
            document.querySelectorAll('.weeks-container').forEach(el => el.classList.remove('active'));
            const pageId = subject + '-week' + week;
            document.getElementById(pageId).classList.add('active');
        }
        
        function goBack() {
            document.querySelectorAll('.weeks-container').forEach(el => el.classList.remove('active'));
            document.querySelector('.menu').style.display = 'block';
        }
        
        function goBackToWeeks(subject) {
            setTimeout(() => {
                if (currentTab === 2) initCanvases();
                if (currentTab === 3) initWriteCanvases();
            }, 200);
            document.querySelectorAll('.game-page').forEach(el => el.classList.remove('active'));
            document.getElementById(subject + '-weeks').classList.add('active');
            resetAll();
        }
        
        // ===== Tab 切換 =====
        let currentTab = 1;
        
        function showTab(num) {
            document.querySelectorAll('.tab-btn').forEach((btn, i) => {
                btn.classList.toggle('active', i + 1 === num);
            });
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById('game' + num + '-content').classList.add('active');
            currentTab = num;
            if (num === 2) {
                setTimeout(initCanvases, 100);
            }
        }
        
        // ===== 通用 =====
        function resetAll() {
            resetGame1();
            resetGame2Match();
            resetTrace();
            resetGame3();
            showTab(1);
        }
        
        function showCelebration(sub) {
            document.getElementById('celebration-sub').textContent = sub || '完成！';
            document.getElementById('celebration').classList.add('show');
        }
        
        function hideCelebration() {
            document.getElementById('celebration').classList.remove('show');
        }
        
        function showToast() {
            const toast = document.getElementById('save-toast');
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 2000);
        }
        
        // ===== 遊戲 1: 男女配對 =====
        let junAnswer = null, qiAnswer = null;
        let draggedChar = '';
        
        function handleDragStart(e, char) {
            draggedChar = char;
            e.dataTransfer.setData('text', char);
            e.dataTransfer.effectAllowed = 'move';
        }
        
        function handleDragEnd(e) { draggedChar = ''; }
        
        function handleDragOver(e) {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
        }
        
        function handleDragLeave(e) {
            e.currentTarget.classList.remove('drag-over');
        }
        
        function handleDrop(e, target) {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            
            const char = e.dataTransfer.getData('text');
            const correct = (target === 'jun' && char === '男') || 
                           (target === 'qi' && char === '女');
            
            if (correct) {
                e.currentTarget.textContent = char;
                e.currentTarget.classList.add('filled');
                if (char === '男') document.getElementById('drag-male').classList.add('used');
                else document.getElementById('drag-female').classList.add('used');
                if (target === 'jun') junAnswer = true;
                if (target === 'qi') qiAnswer = true;
                if (junAnswer && qiAnswer) setTimeout(() => showCelebration('句式學會晒！'), 500);
            } else {
                e.currentTarget.classList.add('wrong');
                setTimeout(() => e.currentTarget.classList.remove('wrong'), 500);
            }
        }
        
        function resetGame1() {
            junAnswer = null; qiAnswer = null;
            ['jun', 'qi'].forEach(t => {
                const el = document.getElementById('drop-' + t);
                el.textContent = ''; el.classList.remove('filled', 'wrong');
            });
            document.getElementById('drag-male').classList.remove('used');
            document.getElementById('drag-female').classList.remove('used');
        }
        
        function saveGame1() {
            if (junAnswer && qiAnswer) { localStorage.setItem('game1_done', 'true'); showToast(); }
            else alert('請先完成遊戲！');
        }
        
        // ===== 遊戲 2: 顏色配對 =====
        let matchedColors = {};
        let tracesDone = 0;
        let currentDragColor = '';
        
        function handleButterflyDragStart(e, color) {
            currentDragColor = color;
            e.dataTransfer.setData('text', color);
            e.dataTransfer.effectAllowed = 'move';
        }
        
        function handleButterflyDragEnd(e) { currentDragColor = ''; }
        
        function handleColorDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
        function handleColorDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
        
        function handleColorDrop(e, targetColor) {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            const droppedColor = e.dataTransfer.getData('text');
            if (droppedColor === targetColor && !matchedColors[targetColor]) {
                matchedColors[targetColor] = true;
                e.currentTarget.classList.add('matched', 'matched-' + targetColor);
                e.currentTarget.innerHTML = '🦋';
                document.getElementById('bf-' + targetColor).classList.add('used');
                if (Object.keys(matchedColors).length === 4) {
                    setTimeout(() => {
                        document.getElementById('match-section').style.display = 'none';
                        document.getElementById('trace-section').classList.add('active');
                    }, 500);
                }
            } else if (!matchedColors[targetColor]) {
                e.currentTarget.style.animation = 'shake 0.5s';
                setTimeout(() => e.currentTarget.style.animation = '', 500);
            }
        }
        
        function goToTrace() {
            if (Object.keys(matchedColors).length === 4) {
                document.getElementById('match-section').style.display = 'none';
                document.getElementById('trace-section').classList.add('active');
            } else alert('請先完成所有顏色配對！');
        }
        
        function doTrace(num) {
            const trace = document.getElementById('trace-' + num);
            if (!trace.classList.contains('done')) {
                trace.classList.add('done');
                tracesDone++;
                if (tracesDone === 4) setTimeout(() => showCelebration('顏色同線都完成！'), 500);
            }
        }
        
        function resetTrace() {
            tracesCompleted = {};
            document.querySelectorAll('.trace-canvas').forEach(canvas => {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.classList.remove('completed');
            });
        }
        
        function resetGame2Match() {
            matchedColors = {};
            ['red', 'yellow', 'blue', 'green'].forEach(c => {
                const t = document.getElementById('target-' + c);
                t.className = 'color-target'; t.innerHTML = '';
            });
            ['red', 'yellow', 'blue', 'green'].forEach(c => {
                document.getElementById('bf-' + c).classList.remove('used');
            });
            resetTrace();
            document.getElementById('match-section').style.display = 'block';
            document.getElementById('trace-section').classList.remove('active');
        }
        
        function saveGame2() {
            if (Object.keys(matchedColors).length === 4 && tracesDone === 4) {
                localStorage.setItem('game2_done', 'true'); showToast();
            } else alert('請先完成遊戲！');
        }
        
        // ===== 遊戲 3: 女字書寫 =====
        let currentStroke = 0;
        
        function doStroke(step) {
            const stepEl = document.getElementById('step-' + step);
            if (stepEl.classList.contains('done')) return;
            stepEl.classList.add('done');
            currentStroke++;
            if (currentStroke === 3) setTimeout(() => showCelebration('女字學會晒！'), 500);
        }
        
        function resetGame3() {
            currentStroke = 0;
            for (let i = 1; i <= 3; i++) {
                document.getElementById('step-' + i).classList.remove('done', 'current');
            }
        }
        
        function saveGame3() {
            if (currentStroke === 3) { localStorage.setItem('game3_done', 'true'); showToast(); }
            else alert('請先完成所有筆順！');
        }

// ===== 畫布繪畫功能 =====
let currentCanvas = null;
let isDrawing = false;
let lastX = 0;
let tracesCompleted = {};

function initCanvases() {
    document.querySelectorAll('.trace-canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Mouse events
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        
        // Touch events
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchcancel', stopDrawing);
    });
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    lastX = touch.clientX - rect.left;
    isDrawing = true;
    currentCanvas = canvas;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    drawLine(canvas, x);
}

function startDrawing(e) {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    isDrawing = true;
    currentCanvas = canvas;
}

function draw(e) {
    if (!isDrawing) return;
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    drawLine(canvas, x);
}

function drawLine(canvas, x) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastX, 20);
    ctx.lineTo(x, 20);
    ctx.stroke();
    lastX = x;
    
    // Check if line is mostly drawn (crossed 80% of canvas)
    if (lastX > canvas.width * 0.8) {
        canvas.classList.add('completed');
        const traceNum = canvas.dataset.trace;
        if (!tracesCompleted[traceNum]) {
            tracesCompleted[traceNum] = true;
            checkAllTracesComplete();
        }
    }
}

function stopDrawing() {
    isDrawing = false;
    currentCanvas = null;
}

function checkAllTracesComplete() {
    const total = Object.keys(tracesCompleted).length;
    if (total === 4) {
        setTimeout(() => showCelebration('顏色同線都完成！'), 500);
    }
}

function resetTrace() {
    tracesCompleted = {};
    document.querySelectorAll('.trace-canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.classList.remove('completed');
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initCanvases);
