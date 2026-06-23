// ==========================
// EXAM SCHEDULER STATE
// ==========================
        // ===== EXAM SCHEDULER STATE =====
        let examScheduleData = null;
        let currentStudyStyle = 'balanced';
        let uploadedPDFText = '';
        let practiceTopics = [];
        let practiceScores = {};
        let completedTopics = new Set();
        let currentPracticeQuestions = [];
        let practiceAnswered = 0;
        let practiceCorrect = 0;
        let isPracticeSubmitted = false;

// ===========================
// EXAM SCHEDULER FUNCTIONS
// ===========================
        function switchExamTab(tab) {
            ['setup', 'schedule', 'practice', 'progress'].forEach(t => {
                document.getElementById(`examTab-${t}`).classList.toggle('active', t === tab);
                document.getElementById(`examPanel-${t}`).classList.toggle('hidden', t !== tab);
            });
            if (tab === 'progress') renderProgressTab();
        }

        function setStudyStyle(style) {
            currentStudyStyle = style;
            document.querySelectorAll('.style-btn').forEach(b => {
                b.className = 'style-btn p-2 rounded-xl border border-white/10 bg-white/5 text-zinc-400 text-[10px] font-bold transition-all';
            });
            document.getElementById(`style-${style}`).className = 'style-btn active p-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 text-[10px] font-bold transition-all';
        }

        async function handlePDFUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            document.getElementById('pdfFileName').textContent = `📄 ${file.name} (Extracting text...)`;
            document.getElementById('pdfFileName').classList.remove('hidden');
            
            try {
                const ext = file.name.split('.').pop().toLowerCase();
                let text = '';
                if (ext === 'pdf') {
                    if (typeof extractTextFromPDF !== 'undefined') text = await extractTextFromPDF(file);
                } else if (typeof readTextFile !== 'undefined') {
                    text = await readTextFile(file);
                }
                
                if (text && text.trim().length > 30) {
                    uploadedPDFText = `DOCUMENT CONTENT:\n${text.substring(0, 3000)}`;
                    document.getElementById('pdfFileName').textContent = `📄 ${file.name} (Ready)`;
                } else {
                    uploadedPDFText = `PDF File: ${file.name}\nGenerate topics based on filename.`;
                    document.getElementById('pdfFileName').textContent = `📄 ${file.name} (Text extraction failed, using filename)`;
                }
            } catch (e) {
                console.error("PDF Extraction Error in Exam Planner:", e);
                uploadedPDFText = `PDF File: ${file.name}\nGenerate topics based on filename.`;
                document.getElementById('pdfFileName').textContent = `📄 ${file.name} (Using filename)`;
            }
            
            document.getElementById('extractPdfBtn').classList.remove('hidden');
        }

        async function extractFromPDF() {
            const btn = document.getElementById('extractPdfBtn');
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Extracting...';
            btn.disabled = true;
            try {
                const response = await callGroqAPI(`You are an expert academic advisor. Based on the PDF syllabus provided, extract and organize all study topics.
    ${uploadedPDFText}
    Generate a structured topic list. Return ONLY valid JSON:
    {"subject":"Subject Name","topics":["Topic 1","Topic 2","Topic 3","Topic 4","Topic 5","Topic 6","Topic 7","Topic 8"],"estimatedHours":40}`, 3000);
                const parsed = JSON.parse(cleanJSON(response));
                document.getElementById('examSubject').value = parsed.subject || '';
                document.getElementById('examTopics').value = parsed.topics.map((t, i) => `Chapter ${i + 1}: ${t}`).join('\n');
                alert(`✅ Extracted ${parsed.topics.length} topics from your PDF!`);
                switchExamTab('setup');
            } catch (err) {
                alert('Could not extract from PDF. Please enter topics manually.');
            } finally {
                btn.innerHTML = original;
                btn.disabled = false;
            }
        }

        async function generateSchedule() {
            const subject = document.getElementById('examSubject').value.trim();
            const topicsText = document.getElementById('examTopics').value.trim();
            const examDate = document.getElementById('examDate').value;
            const studyHoursPerDay = parseInt(document.getElementById('studyHours').value);
            if (!subject || !topicsText) { alert("Please enter subject and topics!"); return; }
            if (!examDate) { alert("Please select your exam date!"); return; }
            const examDateObj = new Date(examDate);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((examDateObj - today) / (1000 * 60 * 60 * 24));
            if (daysLeft < 1) { alert("Please select a future exam date!"); return; }
            const btn = document.querySelector('button[onclick="generateSchedule()"]');
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            btn.disabled = true;
            try {
                const todayStr = new Date().toISOString().split('T')[0];
                const stylePrompt = { 'balanced': 'Mix study, revision and practice equally. Include breaks.', 'intensive': 'Heavy study sessions, more practice tests, minimal breaks.', 'relaxed': 'Shorter sessions, more revision time, longer breaks for wellbeing.' }[currentStudyStyle];
                const prompt = `You are an expert academic scheduler. Create a detailed ${daysLeft}-day study schedule.
    Today's Date (Day 1 MUST start on this exact date): ${todayStr}
    Subject: ${subject}
    Exam Date: ${examDate}
    Days Available: ${daysLeft}
    Daily Study Hours: ${studyHoursPerDay}
    Study Style: ${currentStudyStyle} - ${stylePrompt}
    Topics: ${topicsText}
    Return ONLY valid JSON:
    {"subject":"${subject}","examDate":"${examDate}","totalDays":${Math.min(daysLeft, 14)},"dailyHours":${studyHoursPerDay},"topics":["topic1","topic2"],"days":[{"day":1,"date":"YYYY-MM-DD","title":"Day theme","tasks":[{"time":"09:00","duration":"1hr","type":"study","title":"Task","desc":"Description"}]}],"tips":["Tip1","Tip2","Tip3"]}
    Generate ${Math.min(daysLeft, 14)} days. Task types: study, practice, revision, break, test.`;
                const rawResponse = await callGroqAPI(prompt, 4000);
                const scheduleData = JSON.parse(cleanJSON(rawResponse));
                examScheduleData = scheduleData;
                practiceTopics = scheduleData.topics || [];
                localStorage.setItem(`exam_schedule_${window.currentUserId || 'guest'}`, JSON.stringify(scheduleData));
                renderSchedule(scheduleData);
                switchExamTab('schedule');
                renderPracticeTopicsList();
                document.getElementById('practiceEmpty').classList.add('hidden');
                document.getElementById('practiceContent').classList.remove('hidden');
                alert(`✅ Your ${daysLeft}-day study schedule is ready!`);
            } catch (err) {
                alert('Error generating schedule. Please try again.');
            } finally {
                btn.innerHTML = original;
                btn.disabled = false;
            }
        }

        function loadSavedSchedule() {
            const saved = localStorage.getItem(`exam_schedule_${window.currentUserId || 'guest'}`);
            if (saved) {
                try {
                    examScheduleData = JSON.parse(saved);
                    practiceTopics = examScheduleData.topics || [];
                    renderSchedule(examScheduleData);
                    renderPracticeTopicsList();
                    document.getElementById('practiceEmpty').classList.add('hidden');
                    document.getElementById('practiceContent').classList.remove('hidden');
                } catch (e) { }
            }
        }

        function renderSchedule(data) {
            document.getElementById('scheduleEmpty').classList.add('hidden');
            document.getElementById('scheduleContent').classList.remove('hidden');
            const statsBar = document.getElementById('scheduleStats');
            const examDate = new Date(data.examDate);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const daysLeft = Math.max(0, Math.ceil((examDate - today) / (1000 * 60 * 60 * 24)));
            const totalTasks = data.days.reduce((sum, d) => sum + d.tasks.filter(t => t.type !== 'break').length, 0);
            statsBar.innerHTML = `
            <div class="stat-chip bg-indigo-500/15 border border-indigo-500/20 text-indigo-300"><span class="text-xl font-black">${daysLeft}</span><span class="text-[9px] text-indigo-400">days left</span></div>
            <div class="stat-chip bg-blue-500/15 border border-blue-500/20 text-blue-300"><span class="text-xl font-black">${data.days.length}</span><span class="text-[9px] text-blue-400">study days</span></div>
            <div class="stat-chip bg-purple-500/15 border border-purple-500/20 text-purple-300"><span class="text-xl font-black">${totalTasks}</span><span class="text-[9px] text-purple-400">tasks</span></div>
            <div class="stat-chip bg-emerald-500/15 border border-emerald-500/20 text-emerald-300"><span class="text-xl font-black">${data.dailyHours}h</span><span class="text-[9px] text-emerald-400">per day</span></div>`;
            renderWeekCalendar(data);
            const container = document.getElementById('scheduleDays');
            container.innerHTML = '';
            data.days.forEach((day, idx) => {
                const dayDate = new Date(day.date);
                const dayLabel = dayDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
                const isToday = dayDate.toDateString() === new Date().toDateString();
                const taskTypeColors = { study: 'task-type-study', practice: 'task-type-practice', revision: 'task-type-revision', break: 'task-type-break', test: 'task-type-test' };
                const taskTypeIcons = { study: 'fa-book-open', practice: 'fa-pencil', revision: 'fa-rotate', break: 'fa-coffee', test: 'fa-clipboard-check' };
                let tasksHTML = '';
                day.tasks.forEach(task => {
                    const typeClass = taskTypeColors[task.type] || 'task-type-study';
                    const icon = taskTypeIcons[task.type] || 'fa-book-open';
                    tasksHTML += `<div class="schedule-task-item"><span class="task-time-pill ${typeClass}"><i class="fa-solid ${icon} mr-1"></i>${task.time}</span><div class="flex-1 min-w-0"><p class="text-xs font-bold text-white truncate">${escapeHtml(task.title)}</p><p class="text-[10px] text-zinc-500 truncate">${escapeHtml(task.desc)} · ${task.duration}</p></div></div>`;
                });
                const card = document.createElement('div');
                card.className = 'schedule-day-card';
                card.style.animationDelay = `${idx * 0.06}s`;
                card.innerHTML = `<div class="schedule-day-header" onclick="this.nextElementSibling.classList.toggle('hidden')"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl ${isToday ? 'bg-indigo-500' : 'bg-white/8'} border ${isToday ? 'border-indigo-400' : 'border-white/10'} flex items-center justify-center"><span class="text-xs font-black ${isToday ? 'text-white' : 'text-zinc-400'}">D${day.day}</span></div><div><p class="text-sm font-bold text-white">${escapeHtml(day.title)}</p><p class="text-[10px] text-zinc-500">${dayLabel}</p></div></div><div class="flex items-center gap-2"><span class="text-[9px] font-bold text-zinc-500">${day.tasks.filter(t => t.type !== 'break').length} tasks</span><i class="fa-solid fa-chevron-down text-zinc-600 text-xs"></i></div></div><div class="${isToday ? '' : 'hidden'}">${tasksHTML}</div>`;
                container.appendChild(card);
            });
        }

        function renderWeekCalendar(data) {
            const weekDaysEl = document.getElementById('weekDays');
            weekDaysEl.innerHTML = '';
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            for (let i = 0; i < 7; i++) {
                const d = new Date(today); d.setDate(today.getDate() + i);
                const hasTask = data.days.some(day => new Date(day.date).toDateString() === d.toDateString());
                const isToday = i === 0;
                const btn = document.createElement('div');
                btn.className = `week-day-btn ${isToday ? 'today' : ''} ${hasTask ? 'has-tasks' : ''}`;
                if (hasTask && !isToday) btn.style.borderColor = 'rgba(99,102,241,0.3)';
                btn.innerHTML = `<span class="text-[9px]">${dayNames[d.getDay()]}</span><span class="text-base font-black">${d.getDate()}</span>${hasTask ? '<div class="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>' : '<div class="w-1.5 h-1.5 opacity-0"></div>'}`;
                weekDaysEl.appendChild(btn);
            }
            const examDate = new Date(data.examDate);
            document.getElementById('weekLabel').textContent = `Exam: ${examDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
        }

        // ===========================
        // PRACTICE TAB
        // ===========================

        function renderPracticeTopicsList() {
            const container = document.getElementById('practiceTopicsList');
            container.innerHTML = '';
            practiceTopics.forEach(topic => {
                const isDone = completedTopics.has(topic);
                const chip = document.createElement('span');
                chip.className = `topic-chip ${isDone ? 'done' : ''}`;
                chip.innerHTML = `${isDone ? '<i class="fa-solid fa-check"></i> ' : ''}${escapeHtml(topic)}`;
                chip.onclick = () => { chip.classList.toggle('done'); if (chip.classList.contains('done')) completedTopics.add(topic); else completedTopics.delete(topic); };
                container.appendChild(chip);
            });
        }

        async function startPracticeQuiz() {
            if (!examScheduleData) { alert('Please generate a schedule first.'); return; }
            document.getElementById('practiceQuizArea').classList.add('hidden');
            document.getElementById('practiceLoadingArea').classList.remove('hidden');
            document.getElementById('practiceLoadingArea').classList.add('flex');
            document.getElementById('startPracticeBtn').disabled = true;
            isPracticeSubmitted = false; practiceAnswered = 0; practiceCorrect = 0;
            const selectedTopics = practiceTopics.slice(0, 5).join(', ');
            try {
                const response = await callGroqAPI(`Generate exactly 5 MCQs for exam practice on: ${examScheduleData.subject || 'the subject'}. Topics: ${selectedTopics}
    
    IMPORTANT RULES:
    - Each question must have EXACTLY 4 options with FULL descriptive answer text (NOT just letters like A, B, C, D).
    - The "a" field must be the EXACT text of one of the options in "o".
    - Each option must be a complete, meaningful answer — never a single letter or number.

    Return ONLY a valid JSON array:
    [{"q":"Question text","o":["First option","Second option","Third option","Fourth option"],"a":"First option","e":"Explanation","topic":"Topic name"}]`, 2000);
                currentPracticeQuestions = JSON.parse(cleanJSON(response));
                renderPracticeQuiz(currentPracticeQuestions);
            } catch (err) {
                alert('Error generating practice questions.');
            } finally {
                document.getElementById('practiceLoadingArea').classList.add('hidden');
                document.getElementById('practiceLoadingArea').classList.remove('flex');
                document.getElementById('startPracticeBtn').disabled = false;
            }
        }

        function renderPracticeQuiz(questions) {
            const area = document.getElementById('practiceQuizArea');
            area.classList.remove('hidden');
            area.innerHTML = '';
            questions.forEach((q, idx) => {
                const card = document.createElement('div');
                card.className = 'practice-mcq-card';
                const nq = normalizeQuestions([q])[0] || { ...q, o: q.o, correctIndex: 0 };
                let optsHTML = nq.o.map((opt, oi) => { const s = escapeHtml(opt || '—'); return `<div class="practice-opt" data-idx="${oi}" data-correct="${nq.correctIndex}" onclick="checkPracticeAnswer(this)"><span class="text-xs text-white flex-1">${s}</span><i class="fa-solid fa-check practice-opt-icon pi-check"></i><i class="fa-solid fa-xmark practice-opt-icon pi-x"></i></div>`; }).join('');
                card.innerHTML = `<div class="flex items-start gap-2 mb-3"><span class="text-[10px] font-black text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-md">${escapeHtml(q.topic || 'Topic')}</span></div><p class="text-sm font-bold text-white mb-3">Q${idx + 1}. ${escapeHtml(q.q)}</p><div class="opts-container space-y-2">${optsHTML}</div><div class="explanation-box hidden mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200"><span class="font-bold text-blue-400 block mb-1">Explanation:</span>${escapeHtml(q.e || '')}</div>`;
                area.appendChild(card);
            });
            const submitDiv = document.createElement('div');
            submitDiv.innerHTML = `<button id="submitPracticeBtn" onclick="submitPractice()" class="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"><i class="fa-solid fa-flag-checkered"></i> Submit Practice</button><div id="practiceResultDiv" class="hidden mt-4 p-5 glass-panel rounded-2xl text-center"><p class="text-3xl font-black text-white mb-1" id="practiceScore"></p><p class="text-sm text-zinc-400 mb-4" id="practiceScoreLabel"></p><button onclick="startPracticeQuiz()" class="px-6 py-3 bg-purple-600 text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"><i class="fa-solid fa-rotate mr-2"></i>Try Again</button></div>`;
            area.appendChild(submitDiv);
        }

        function checkPracticeAnswer(el) {
            if (isPracticeSubmitted) return;
            const parent = el.parentElement;
            if (parent.classList.contains('answered')) return;
            parent.classList.add('answered');
            const selected = parseInt(el.getAttribute('data-idx'));
            const correct = parseInt(el.getAttribute('data-correct'));
            practiceAnswered++;
            if (selected === correct) { el.classList.add('correct'); practiceCorrect++; }
            else {
                el.classList.add('wrong');
                Array.from(parent.children).forEach(c => { if (parseInt(c.getAttribute('data-idx')) === correct) c.classList.add('correct'); });
            }
            const expBox = el.closest('.practice-mcq-card').querySelector('.explanation-box');
            if (expBox) expBox.classList.remove('hidden');
        }

        function submitPractice() {
            isPracticeSubmitted = true;
            document.getElementById('submitPracticeBtn').classList.add('hidden');
            const pct = Math.round((practiceCorrect / currentPracticeQuestions.length) * 100);
            document.getElementById('practiceScore').textContent = `${practiceCorrect}/${currentPracticeQuestions.length}`;
            document.getElementById('practiceScoreLabel').textContent = `${pct}% — ${pct >= 70 ? '🎉 Great!' : pct >= 50 ? '👍 Keep going!' : '📚 More practice needed!'}`;
            document.getElementById('practiceResultDiv').classList.remove('hidden');
            let progress = JSON.parse(localStorage.getItem(`exam_progress_${window.currentUserId || 'guest'}`) || '[]');
            progress.push({ date: new Date().toISOString(), score: practiceCorrect, total: currentPracticeQuestions.length, pct });
            localStorage.setItem(`exam_progress_${window.currentUserId || 'guest'}`, JSON.stringify(progress));

            // Save to unified dashboard tracker
            if (typeof saveDashboardEntry === 'function') {
                saveDashboardEntry({
                    type: 'exam_practice',
                    score: practiceCorrect,
                    total: currentPracticeQuestions.length,
                    percentage: pct,
                    topic: examScheduleData?.subject || 'Exam Practice',
                    difficulty: 'Mixed'
                });
            }
        }

        async function generatePracticeSet() { await startPracticeQuiz(); }

        // ===========================
        // PROGRESS TAB
        // ===========================

        function renderProgressTab() {
            const progress = JSON.parse(localStorage.getItem(`exam_progress_${window.currentUserId || 'guest'}`) || '[]');
            if (progress.length === 0) { document.getElementById('progressEmpty').classList.remove('hidden'); document.getElementById('progressContent').classList.add('hidden'); return; }
            document.getElementById('progressEmpty').classList.add('hidden');
            document.getElementById('progressContent').classList.remove('hidden');
            const avgPct = Math.round(progress.reduce((s, p) => s + p.pct, 0) / progress.length);
            const lastPct = progress[progress.length - 1].pct;
            document.getElementById('progressOverall').innerHTML = `<div class="flex items-center gap-4 mb-4"><div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex flex-col items-center justify-center"><span class="text-2xl font-black text-emerald-400">${avgPct}%</span><span class="text-[9px] text-emerald-600">avg score</span></div><div class="flex-1"><div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Overall Accuracy</span><span class="font-bold text-white">${avgPct}%</span></div><div class="progress-track"><div class="progress-fill bg-gradient-to-r from-emerald-500 to-teal-400" style="width:${avgPct}%"></div></div><p class="text-[10px] text-zinc-500 mt-2">${progress.length} sessions · Last: ${lastPct}%</p></div></div><div class="grid grid-cols-3 gap-3"><div class="p-3 bg-white/5 rounded-xl text-center"><p class="text-lg font-black text-white">${progress.length}</p><p class="text-[9px] text-zinc-500">Sessions</p></div><div class="p-3 bg-white/5 rounded-xl text-center"><p class="text-lg font-black text-emerald-400">${Math.max(...progress.map(p => p.pct))}%</p><p class="text-[9px] text-zinc-500">Best Score</p></div><div class="p-3 bg-white/5 rounded-xl text-center"><p class="text-lg font-black text-blue-400">${progress.reduce((s, p) => s + p.total, 0)}</p><p class="text-[9px] text-zinc-500">Qs Practiced</p></div></div>`;
            const topicsEl = document.getElementById('progressTopics');
            topicsEl.innerHTML = '';
            (practiceTopics.length > 0 ? practiceTopics.slice(0, 6) : ['General Study']).forEach(topic => {
                const isDone = completedTopics.has(topic);
                const fp = isDone ? 100 : Math.round(Math.random() * 60 + 20);
                const cc = fp >= 70 ? 'bg-emerald-500' : fp >= 40 ? 'bg-blue-500' : 'bg-orange-500';
                topicsEl.innerHTML += `<div><div class="flex justify-between text-xs mb-1"><span class="text-zinc-300 font-medium truncate">${escapeHtml(topic)}</span><span class="font-bold text-white ml-2">${fp}%</span></div><div class="progress-track"><div class="progress-fill ${cc}" style="width:${fp}%"></div></div></div>`;
            });
            const tips = examScheduleData?.tips || ['Study consistently every day', 'Review weak topics more often', 'Practice past papers regularly', 'Take short breaks to stay fresh'];
            document.getElementById('aiStudyTips').innerHTML = tips.map(tip => `<div class="flex items-start gap-3 p-3 bg-purple-500/8 border border-purple-500/15 rounded-xl"><i class="fa-solid fa-lightbulb text-purple-400 mt-0.5 text-sm flex-shrink-0"></i><p class="text-xs text-zinc-300">${escapeHtml(tip)}</p></div>`).join('');
        }
