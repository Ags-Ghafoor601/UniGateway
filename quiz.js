// ===========================
// QUIZ STATE
// ===========================
        let currentQuizScore = 0, currentQuizTotal = 0, isQuizSubmitted = false;

        // ===== QUIZ DOCUMENT STATE =====
        let quizDocText = '';
        let quizDocFileName = '';
        let currentQuizSource = 'topic'; // 'topic' or 'document'


// ===========================
// QUIZ SOURCE & DOCUMENT UPLOAD
// ===========================
        function setQuizSource(source) {
            currentQuizSource = source;
            document.getElementById('quizSourceTopic').classList.toggle('active', source === 'topic');
            document.getElementById('quizSourceDoc').classList.toggle('active', source === 'document');
            document.getElementById('topicModeSection').classList.toggle('hidden', source !== 'topic');
            document.getElementById('documentModeSection').classList.toggle('hidden', source !== 'document');
        }

        async function handleQuizDocUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            quizDocFileName = file.name;
            const ext = file.name.split('.').pop().toLowerCase();
            const supportedExts = ['pdf', 'txt', 'text', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'rtf'];

            if (!supportedExts.includes(ext)) {
                alert(`Unsupported file type (.${ext}). Please upload a PDF, Word, PowerPoint, Excel, or TXT file.`);
                return;
            }

            document.getElementById('quizDocUploadZone').classList.add('hidden');
            document.getElementById('quizDocExtracting').classList.remove('hidden');
            document.getElementById('quizDocExtractMsg').textContent = 'Reading document...';
            animateExtractBar(0, 20);

            try {
                if (ext === 'pdf') {
                    quizDocText = await extractTextFromPDF(file);
                } else if (['txt', 'text', 'csv', 'rtf'].includes(ext)) {
                    quizDocText = await readTextFile(file);
                } else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
                    // For Office formats: read as text (basic extraction — works for many docx/pptx which are XML zips)
                    quizDocText = await extractOfficeText(file);
                } else {
                    quizDocText = await readTextFile(file);
                }

                document.getElementById('quizDocExtractMsg').textContent = 'Processing content...';
                animateExtractBar(80, 100);
                await new Promise(r => setTimeout(r, 400));

                // If PDF gave no text (scanned/image PDF), try to use filename + ask AI to generate generic questions
                if (!quizDocText || quizDocText.trim().length < 30) {
                    quizDocText = `DOCUMENT: "${file.name}"\nFile size: ${Math.round(file.size / 1024)}KB\nNote: Could not extract text content (possibly a scanned PDF or image-based document). Generate questions based on the document title and likely subject matter.`;
                }

                // Show loaded state
                document.getElementById('quizDocExtracting').classList.add('hidden');
                document.getElementById('quizDocLoaded').classList.remove('hidden');
                document.getElementById('quizDocName').textContent = quizDocFileName;

                const wordCount = quizDocText.trim().split(/\s+/).filter(w => w.length > 2).length;
                const isEstimated = quizDocText.startsWith('DOCUMENT:');
                document.getElementById('quizDocWordCount').textContent = isEstimated
                    ? '⚠️ Scanned PDF — AI will generate from title'
                    : `${wordCount.toLocaleString()} words extracted`;

                const preview = quizDocText.substring(0, 200).replace(/\s+/g, ' ').trim();
                document.getElementById('quizDocPreview').textContent = preview + (quizDocText.length > 200 ? '...' : '');

            } catch (err) {
                console.error('Doc extraction error:', err);
                // Don't fully fail — use filename as context
                quizDocText = `DOCUMENT: "${file.name}"\nFile size: ${Math.round(file.size / 1024)}KB\nGenerate questions based on the document title and likely subject matter.`;
                document.getElementById('quizDocExtracting').classList.add('hidden');
                document.getElementById('quizDocLoaded').classList.remove('hidden');
                document.getElementById('quizDocName').textContent = quizDocFileName;
                document.getElementById('quizDocWordCount').textContent = '⚠️ Limited extraction — using document title';
                document.getElementById('quizDocPreview').textContent = `Topic inferred from: ${file.name}`;
            }

            event.target.value = '';
        }

        async function extractTextFromPDF(file) {
            // Ensure pdf.js worker is set
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            } else {
                throw new Error('PDF.js not loaded');
            }
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async function (e) {
                    try {
                        const typedArray = new Uint8Array(e.target.result);
                        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                        let fullText = '';
                        const MAX_TEXT_LENGTH = 4000; // Cap text to prevent API 413 errors
                        const totalPages = Math.min(pdf.numPages, 15); // Read fewer pages to keep payload small
                        for (let i = 1; i <= totalPages; i++) {
                            // Stop early if we already have enough text
                            if (fullText.length >= MAX_TEXT_LENGTH) break;
                            document.getElementById('quizDocExtractMsg').textContent = `Reading page ${i} of ${totalPages}...`;
                            animateExtractBar(20 + Math.floor((i / totalPages) * 55), 20 + Math.floor(((i + 1) / totalPages) * 55));
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            // Join items with smart spacing — preserve word boundaries
                            let pageText = '';
                            let lastY = null;
                            textContent.items.forEach(item => {
                                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                                    pageText += '\n'; // New line when Y position changes significantly
                                } else if (pageText && !pageText.endsWith(' ')) {
                                    pageText += ' ';
                                }
                                pageText += item.str;
                                lastY = item.transform[5];
                            });
                            fullText += pageText + '\n';
                        }
                        // Trim to max length to prevent oversized API requests
                        const extracted = fullText.trim().substring(0, MAX_TEXT_LENGTH);
                        resolve(extracted);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        }

        // Extract readable text from Office documents (docx/pptx are ZIP files containing XML)
        async function extractOfficeText(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        // Convert binary to string and extract readable text
                        const binary = e.target.result;
                        // Strip XML/binary noise, keep readable ASCII text
                        let text = '';
                        // Limit how much binary we process to prevent hangs on huge files
                        const maxScan = Math.min(binary.length, 500000);
                        for (let i = 0; i < maxScan; i++) {
                            const c = binary.charCodeAt(i);
                            if (c >= 32 && c < 127) text += binary[i];
                            else if (c === 10 || c === 13) text += ' ';
                        }
                        // Remove XML tags
                        text = text.replace(/<[^>]{1,200}>/g, ' ');
                        // Collapse whitespace
                        text = text.replace(/\s{3,}/g, '  ').trim();
                        // Keep only meaningful segments (length > 3)
                        const meaningful = text.split(/\s{2,}/).filter(s => s.trim().length > 3).join(' ');
                        resolve(meaningful.substring(0, 4000)); // Capped to prevent API 413
                    } catch (e) {
                        resolve('');
                    }
                };
                reader.onerror = () => resolve('');
                reader.readAsBinaryString(file);
            });
        }

        function readTextFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(file);
            });
        }

        function animateExtractBar(from, to) {
            const bar = document.getElementById('quizDocExtractBar');
            if (bar) bar.style.width = to + '%';
        }

        function resetQuizDocUpload() {
            quizDocText = '';
            quizDocFileName = '';
            document.getElementById('quizDocUploadZone').classList.remove('hidden');
            document.getElementById('quizDocExtracting').classList.add('hidden');
            document.getElementById('quizDocLoaded').classList.add('hidden');
            document.getElementById('quizDocExtractBar').style.width = '0%';
        }

        function clearQuizDoc() {
            resetQuizDocUpload();
        }

        // Drag and drop support for quiz doc
        document.addEventListener('DOMContentLoaded', () => {
            const zone = document.getElementById('quizDocUploadZone');
            if (zone) {
                zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
                zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
                zone.addEventListener('drop', e => {
                    e.preventDefault();
                    zone.classList.remove('dragover');
                    const file = e.dataTransfer.files[0];
                    if (file) {
                        document.getElementById('quizDocFileInput').files = e.dataTransfer.files;
                        handleQuizDocUpload({ target: { files: e.dataTransfer.files, value: '' } });
                    }
                });
            }
        });

// ===========================
// QUIZ GENERATION
// ===========================
        function toggleCustomTopic() { const s = document.getElementById('quizTopic'); const c = document.getElementById('customTopicInput'); s.value === 'custom' ? c.classList.remove('hidden') : c.classList.add('hidden'); }
        function toggleCustomCount() { const s = document.getElementById('quizCount'); const c = document.getElementById('customCountInput'); s.value === 'custom' ? c.classList.remove('hidden') : c.classList.add('hidden'); }

        async function generateQuiz() {
    const selectCount = document.getElementById('quizCount').value;
    const customCount = document.getElementById('customCountInput').value;
    const count = selectCount === 'custom' ? (parseInt(customCount) || 5) : parseInt(selectCount);
    const level = document.getElementById('quizLevel').value;

    if (currentQuizSource === 'document' && (!quizDocText || quizDocText.trim().length < 10)) {
        alert('Please upload a document first!');
        return;
    }

    currentQuizScore = 0; isQuizSubmitted = false;
    document.getElementById('quizConfig').classList.add('hidden');
    document.getElementById('quizLoading').classList.remove('hidden');
    document.getElementById('quizLoading').classList.add('flex');

    let allQuestions = [];
    let remainingCount = count;
    const BATCH_SIZE = 5; // Smaller batches = more reliable JSON from API

    try {
        // Loop until we have generated all requested questions!
        while (remainingCount > 0) {
            let currentBatch = Math.min(remainingCount, BATCH_SIZE);
            
            // Update the UI so the user knows it's working
            document.getElementById('quizLoadingMsg').textContent = `Generating Questions (${allQuestions.length}/${count})...`;

            let prompt = '';
            if (currentQuizSource === 'document') {
                // Limit document snippet to 2500 chars to prevent API 413 (Payload Too Large)
                const docSnippet = quizDocText.substring(0, 2500);
                const isScanned = quizDocText.startsWith('DOCUMENT:');

                if (isScanned) {
                    const topicHint = quizDocFileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
                    prompt = `Generate exactly ${currentBatch} multiple choice questions at ${level} difficulty about the topic: "${topicHint}".

IMPORTANT RULES:
- Each question must have EXACTLY 4 options with FULL descriptive answer text (NOT just letters like A, B, C, D)
- The "a" field must be the EXACT text of one of the options in "o"
- Each option must be a complete, meaningful answer — never a single letter or number

Return ONLY a valid JSON array:
[{"q":"What is the capital of France?","o":["London","Paris","Berlin","Madrid"],"a":"Paris","e":"Paris is the capital city of France"}]`;
                } else {
                    prompt = `You are an expert quiz maker. Read the document content below and generate exactly ${currentBatch} multiple choice questions at ${level} difficulty.

DOCUMENT:
"""
${docSnippet}
"""

IMPORTANT RULES:
- Each question must have EXACTLY 4 options
- The "a" field must be the EXACT text of one of the options in "o"
- Base questions on the document content above

Return ONLY a valid JSON array, no extra text:
[{"q":"Question text","o":["First option","Second option","Third option","Fourth option"],"a":"First option","e":"Short explanation"}]`;
                }
            } else {
                const topicSelect = document.getElementById('quizTopic').value;
                const customTopicInput = document.getElementById('customTopicInput').value;
                const topic = topicSelect === 'custom' ? customTopicInput : topicSelect;
                if (!topic) throw new Error("Please select a topic!");

                prompt = `Generate exactly ${currentBatch} multiple choice questions about "${topic}" at ${level} difficulty.

IMPORTANT RULES:
- Each question must have EXACTLY 4 options with FULL descriptive answer text (NOT just letters like A, B, C, D)
- The "a" field must be the EXACT text of one of the options in "o"
- Each option must be a complete, meaningful answer — never a single letter or number

Return ONLY a valid JSON array, no extra text:
[{"q":"What is the capital of France?","o":["London","Paris","Berlin","Madrid"],"a":"Paris","e":"Paris is the capital city of France"}]`;
            }

            // Retry logic with delay — up to 3 attempts per batch
            let questions = null;
            let lastError = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    // Wait before retrying (1s, 2s, 4s) to let API cool down
                    if (attempt > 1) {
                        const delay = Math.pow(2, attempt - 1) * 1000;
                        document.getElementById('quizLoadingMsg').textContent = `Retrying (attempt ${attempt}/3)... waiting ${delay/1000}s`;
                        await new Promise(r => setTimeout(r, delay));
                    }

                    const raw = await callGroqAPI(prompt, 2500);
                    const cleaned = cleanJSON(raw);
                    const parsed = JSON.parse(cleaned);
                    questions = Array.isArray(parsed) ? parsed : parsed.questions;
                    if (questions && questions.length > 0) break; // Success!
                    lastError = new Error("Empty response from API");
                } catch (err) {
                    lastError = err;
                    console.warn(`Quiz batch attempt ${attempt} failed:`, err.message);
                }
            }

            if (!questions || !questions.length) {
                // If we already have some questions, use what we have instead of failing
                if (allQuestions.length > 0) {
                    console.warn('Could not generate more questions. Using what we have.');
                    break;
                }
                throw lastError || new Error("Failed to generate questions after 3 attempts");
            }

            // Add this batch of questions to our master list
            allQuestions = allQuestions.concat(questions);
            remainingCount -= currentBatch;

            // Cooldown between batches to avoid rate limits
            if (remainingCount > 0) {
                document.getElementById('quizLoadingMsg').textContent = `Generated ${allQuestions.length}/${count}... preparing next batch`;
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        // Update badge based on source
        const badge = document.getElementById('quizSourceBadge');
        if (currentQuizSource === 'document') {
            badge.textContent = `📄 ${quizDocFileName.substring(0, 20)}${quizDocFileName.length > 20 ? '…' : ''}`;
            badge.style.color = '#c4b5fd';
        } else {
            badge.textContent = 'AI Generated';
            badge.style.color = '#a78bfa';
        }

        // Render ALL questions to the screen!
        renderQuiz(allQuestions);

    } catch (error) {
        console.error('Quiz error:', error);
        document.getElementById('quizLoadingMsg').textContent = "Failed to generate quiz.";
        document.getElementById('quizErrorLog').textContent = "Developer Error: " + error.message;
        document.getElementById('quizLoadingMsg').classList.remove('animate-pulse');
        document.getElementById('quizLoadingMsg').classList.replace('text-purple-400', 'text-red-500');
        
        if (!document.getElementById('errorBackBtn')) {
            const backBtn = document.createElement('button');
            backBtn.id = 'errorBackBtn';
            backBtn.className = 'mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-bold text-xs';
            backBtn.innerText = 'Go Back';
            backBtn.onclick = resetQuiz;
            document.getElementById('quizLoading').appendChild(backBtn);
        }
    }
}

// ===========================
// QUIZ RENDER & SUBMIT
// ===========================
        function renderQuiz(questions) {
            questions = normalizeQuestions(questions);
            if (!questions.length) { alert('No valid questions returned. Please try again.'); resetQuiz(); return; }
            currentQuizTotal = questions.length;
            document.getElementById('quizLoading').classList.add('hidden');
            document.getElementById('quizLoading').classList.remove('flex');
            document.getElementById('quizContainer').classList.remove('hidden');
            const list = document.getElementById('questionsList');
            list.innerHTML = "";
            questions.forEach((q, idx) => {
                const card = document.createElement('div');
                card.className = "glass-panel p-5 rounded-2xl relative";
                let optsHTML = "";
                q.o.forEach((opt, oi) => { const s = escapeHtml(opt || '—'); optsHTML += `<div class="quiz-option" data-idx="${oi}" data-correct="${q.correctIndex}" onclick="checkAnswer(this)"><div class="quiz-opt-letter">${'ABCD'[oi] || oi + 1}</div><span class="flex-1">${s}</span><i class="fa-solid fa-check quiz-opt-icon qi-check"></i><i class="fa-solid fa-xmark quiz-opt-icon qi-x"></i></div>`; });
                const expHtml = q.e ? `<div class="explanation hidden mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200"><span class="font-bold text-blue-400 block mb-1">Explanation:</span>${escapeHtml(q.e)}</div>` : '';
                card.innerHTML = `<h3 class="font-bold text-white mb-4"><span class="text-purple-400 mr-2">Q${idx + 1}.</span>${escapeHtml(q.q)}</h3><div>${optsHTML}</div>${expHtml}`;
                list.appendChild(card);
            });
            const submitDiv = document.createElement('div');
            submitDiv.innerHTML = `<button id="submitQuizBtn" onclick="handleQuizSubmit()" class="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"><i class="fa-solid fa-flag-checkered"></i> Submit Quiz</button><div id="quizResult" class="hidden flex-col items-center justify-center p-8 mt-6 glass-panel rounded-3xl animate-slide-up"><h3 class="text-2xl font-bold text-white mb-2">Quiz Complete!</h3><div class="text-5xl font-black text-purple-400 mb-2" id="resultScoreDisplay"></div><p class="text-sm font-medium text-zinc-400 mb-6" id="resultPercentageDisplay"></p><div id="performanceBadge" class="px-5 py-2.5 rounded-full text-xs font-bold mb-6 flex items-center gap-2 text-center"></div><div class="flex gap-3 w-full"><button onclick="viewLeaderboardNow()" class="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"><i class="fa-solid fa-trophy"></i> Leaderboard</button><button onclick="resetQuiz()" class="flex-1 bg-white text-black font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"><i class="fa-solid fa-rotate"></i> New Quiz</button></div></div>`;
            list.appendChild(submitDiv);
        }

        window.handleQuizSubmit = function () {
            isQuizSubmitted = true;
            document.getElementById('submitQuizBtn').classList.add('hidden');
            const points = currentQuizScore;
            document.getElementById('resultScoreDisplay').innerText = `${currentQuizScore}/${currentQuizTotal}`;
            document.getElementById('resultPercentageDisplay').innerText = `+${points} Points!`;
            document.getElementById('performanceBadge').innerHTML = `<i class="fa-solid fa-star text-lg"></i> Quiz Complete!`;
            document.getElementById('performanceBadge').className = "px-5 py-2.5 rounded-full text-xs font-bold mb-6 flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/30";
            const userId = window.currentUserId || 'guest';
            const userName = document.getElementById('displayUserName')?.textContent || 'Student';
            let lb = JSON.parse(localStorage.getItem('quiz_leaderboard') || '[]');
            let user = lb.find(u => u.id === userId);
            if (user) { user.points += points; user.quizzes += 1; user.name = userName; }
            else { lb.push({ id: userId, name: userName, points: points, quizzes: 1 }); }
            localStorage.setItem('quiz_leaderboard', JSON.stringify(lb));

            // Save to unified dashboard tracker
            const topicSelect = document.getElementById('quizTopic');
            const customTopicInput = document.getElementById('customTopicInput');
            const quizLevelEl = document.getElementById('quizLevel');
            let dashTopic = 'General';
            if (currentQuizSource === 'document') {
                dashTopic = quizDocFileName ? quizDocFileName.replace(/\.[^.]+$/, '') : 'Document Quiz';
            } else if (topicSelect) {
                dashTopic = topicSelect.value === 'custom' ? (customTopicInput?.value || 'Custom') : topicSelect.options[topicSelect.selectedIndex]?.text || topicSelect.value;
            }
            if (typeof saveDashboardEntry === 'function') {
                saveDashboardEntry({
                    type: 'quiz',
                    score: currentQuizScore,
                    total: currentQuizTotal,
                    percentage: Math.round((currentQuizScore / currentQuizTotal) * 100),
                    topic: dashTopic,
                    difficulty: quizLevelEl?.value || 'Medium'
                });
            }

            document.getElementById('quizResult').classList.remove('hidden');
            document.getElementById('quizResult').classList.add('flex');
        };

        window.viewLeaderboardNow = function () {
            document.getElementById('quizContainer').classList.add('hidden');
            document.getElementById('quizConfig').classList.add('hidden');
            document.getElementById('leaderboardScreen').classList.remove('hidden');
            const lb = JSON.parse(localStorage.getItem('quiz_leaderboard') || '[]');
            lb.sort((a, b) => b.points !== a.points ? b.points - a.points : b.quizzes - a.quizzes);
            const list = document.getElementById('leaderboardList');
            const userId = window.currentUserId || 'guest';
            list.innerHTML = '';
            if (lb.length === 0) { list.innerHTML = '<p class="text-center text-zinc-500 py-8">No scores yet! Complete a quiz to appear here. 🏆</p>'; document.getElementById('userPosition').textContent = '-'; document.getElementById('userBestScore').textContent = '0 pts'; return; }
            lb.forEach((entry, i) => {
                const rank = i + 1;
                const isMe = entry.id === userId;
                const icon = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
                const div = document.createElement('div');
                div.className = `leaderboard-entry ${isMe ? 'border-blue-500/50 bg-blue-500/5' : ''}`;
                div.innerHTML = `<div class="rank-badge ${rankClass}">${icon}</div><div class="flex-1"><p class="font-bold text-sm ${isMe ? 'text-blue-400' : 'text-white'}">${entry.name}${isMe ? '<span style="font-size:9px;background:rgba(59,130,246,0.2);color:#60a5fa;padding:1px 6px;border-radius:20px;font-weight:900;margin-left:6px;">YOU</span>' : ''}</p><p class="text-xs text-zinc-500">${entry.quizzes} quiz${entry.quizzes > 1 ? 'zes' : ''}</p></div><div class="text-right"><p class="text-xl font-black ${isMe ? 'text-blue-400' : 'text-white'}">${entry.points}</p><p class="text-[10px] text-zinc-500">points</p></div>`;
                list.appendChild(div);
            });
            const myIdx = lb.findIndex(e => e.id === userId);
            if (myIdx !== -1) { document.getElementById('userPosition').textContent = `#${myIdx + 1}`; document.getElementById('userBestScore').textContent = `${lb[myIdx].points} pts`; }
            else { document.getElementById('userPosition').textContent = 'Not ranked'; document.getElementById('userBestScore').textContent = '0 pts'; }
            document.getElementById('view-quiz').scrollTo(0, 0);
        };

        function checkAnswer(el) {
            if (isQuizSubmitted) return;
            const parent = el.parentElement;
            if (parent.classList.contains('answered')) return;
            parent.classList.add('answered');
            const selected = parseInt(el.getAttribute('data-idx'));
            const correct = parseInt(el.getAttribute('data-correct'));
            if (selected === correct) { el.classList.add('correct'); currentQuizScore++; }
            else {
                el.classList.add('wrong');
                Array.from(parent.children).forEach(c => { if (parseInt(c.getAttribute('data-idx')) === correct) c.classList.add('correct'); });
            }
            const expDiv = el.closest('.glass-panel').querySelector('.explanation');
            if (expDiv) { expDiv.classList.remove('hidden'); expDiv.classList.add('animate-slide-up'); }
        }

        function resetQuiz() {
            document.getElementById('quizContainer').classList.add('hidden');
            document.getElementById('quizLoading').classList.add('hidden');
            document.getElementById('quizConfig').classList.remove('hidden');
            document.getElementById('leaderboardScreen').classList.add('hidden');
            document.getElementById('view-quiz').scrollTo(0, 0);
        }
        function backToQuizHome() { resetQuiz(); }
