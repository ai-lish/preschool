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
            tracesDone = 0;
            for (let i = 1; i <= 4; i++) document.getElementById('trace-' + i).classList.remove('done');
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
