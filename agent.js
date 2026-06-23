// ===========================
// COUNSELING AGENT (ARIA)
// ===========================
        const ARIA_SYSTEM_PROMPT = `You are ARIA (Academic & Career Intelligence Advisor), a compassionate, expert career and academic counselor embedded in UniGateway — a student portal used primarily by Pakistani students aged 15-25.

    YOUR EXPERTISE COVERS:
    1. CAREER GUIDANCE: Explore career paths in tech, medicine, engineering, business, arts, law, social sciences, agriculture, aviation, military, teaching, media, etc. Match interests to careers with Pakistani job market insights.

    2. UNIVERSITY SELECTION (Pakistan): NUST, FAST-NUCES, UET Lahore/Peshawar/Taxila, LUMS, IBA Karachi, PIEAS, NED, Aga Khan University, COMSATS, Bahria, Air University, UCP, Lahore School of Economics, SZABIST, and others. Know their merit criteria, programs, entry tests, fees, hostel, reputation.

    3. ENTRY TEST STRATEGY: MDCAT (for medical), NET (NUST), ECAT (UET), FAST NU test, NTS/NAT, GAT. Provide subject breakdown, weightage, preparation timelines, key topics, book recommendations.

    4. SCHOLARSHIPS: HEC scholarships, Ehsaas Undergraduate Scholarship, Fulbright (for grad), Chevening, DAAD, Commonwealth, university-specific scholarships, Edhi Foundation, and international opportunities.

    5. SUBJECT/FSC GUIDANCE: Pre-Medical, Pre-Engineering, Computer Science, Commerce, Humanities, ICS — guide which to choose based on interests and career goals.

    6. STUDY PROBLEMS: Procrastination, concentration, exam anxiety, revision strategies, time management, FSc vs O/A levels comparison, gap year decisions.

    7. MENTAL HEALTH & WELLBEING: Academic stress, exam pressure, comparison with peers, parental pressure, feeling lost, motivation loss, burnout. Be empathetic, normalize struggles, give coping strategies. For severe cases, gently suggest professional help.

    8. PARENTAL/SOCIETAL PRESSURE: Family wanting medicine/engineering when student wants arts/design/other fields. Guide students on how to have conversations with parents, explain career viability, compromise strategies.

    9. ABROAD STUDIES: Process for studying in UK, USA, Canada, Germany, Turkey, China, Malaysia — requirements, GPA needed, IELTS/SAT/GRE, how to apply, funding.

    10. JOB MARKET & FUTURE: What fields have the best job prospects in Pakistan, remote work opportunities, freelancing, entrepreneurship.

    COMMUNICATION STYLE — CRITICAL RULES:
    - KEEP RESPONSES SHORT: Max 80-100 words per reply. Students don't read long walls of text.
    - Use 2-3 bullet points MAX when listing things. Not 8 bullets.
    - Always end with ONE short follow-up question to keep the conversation going
    - Be like a smart friend texting you — not a Wikipedia article
    - Use emojis occasionally to make it feel friendly (not excessive)
    - If topic needs more detail, break it into multiple back-and-forth messages
    - For emotional topics: ONE empathetic sentence first, then one practical tip
    - Use occasional Urdu words naturally (yaar, bilkul, Insha'Allah)

    RESPONSE FORMAT:
    • Short answer (2-3 sentences OR 2-3 bullets — never both)
    • One actionable tip or key insight
    • One follow-up question

    NEVER: Give medical diagnoses, legal advice, or recommend specific medications. For mental health crises, immediately provide crisis resources warmly.

    You are saving students from expensive career counselors. Be brilliant, be brief, be helpful.`;

        let agentConversation = [];    // Agent Memory
        let agentIsTyping = false;  // One person type at a time

        function showAgentInfo() {
            document.getElementById('agentInfoModal').classList.remove('hidden');
            document.getElementById('agentInfoModal').classList.add('flex');
        }
        function closeAgentInfo() {
            document.getElementById('agentInfoModal').classList.add('hidden');
            document.getElementById('agentInfoModal').classList.remove('flex');
        }

        function injectAgentTopic(topic) {
            const topicMessages = {
                'Career Path Finder': "I'm not sure what career path to choose. Can you help me figure out what's best for me?",
                'University Selection': "Which university should I apply to? Can you help me compare my options?",
                'Entry Test Strategy': "How should I prepare for my entry tests? What strategy should I follow?",
                'Scholarship Opportunities': "What scholarships are available for students like me in Pakistan and abroad?",
                'Subject Selection': "I'm confused about which subjects to choose (Pre-Medical, Pre-Engineering, Computer Science, etc.). Can you guide me?",
                'Study Problems': "I'm struggling with my studies — concentration, procrastination, and time management. Please help.",
                'Mental Stress & Pressure': "I'm feeling very stressed and overwhelmed with academic pressure. I need help."
            };
            const message = topicMessages[topic] || `I need help with: ${topic}`;
            document.getElementById('agentInput').value = message;
            document.getElementById('agentInput').focus();
            autoResizeAgentInput(document.getElementById('agentInput'));
        }

        function sendAgentQuickStart(message) {
            document.getElementById('agentInput').value = message;
            sendAgentMessage();
        }

        function handleAgentKeydown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAgentMessage();
            }
        }

        function autoResizeAgentInput(el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 100) + 'px';
        }

        async function sendAgentMessage() {
            const input = document.getElementById('agentInput');
            const text = input.value.trim();
            if (!text || agentIsTyping) return;

            // Hide welcome card
            const welcome = document.getElementById('agentWelcomeCard');
            if (welcome) welcome.classList.add('hidden');

            input.value = '';
            input.style.height = 'auto';

            // Add user message
            appendAgentMessage('user', text);
            agentConversation.push({ role: 'user', content: text });

            // Show typing
            agentIsTyping = true;
            document.getElementById('agentTyping').classList.remove('hidden');
            document.getElementById('agentSendBtn').style.opacity = '0.5';
            document.getElementById('agentSendBtn').style.pointerEvents = 'none';
            document.getElementById('agentStatusText').textContent = 'ARIA is thinking...';

            scrollAgentToBottom();

            try {
                const response = await fetch("/api/ai/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: "system", content: ARIA_SYSTEM_PROMPT },
                            ...agentConversation.slice(-12) // Keep last 12 messages for context
                        ],
                        model: "llama-3.1-8b-instant",
                        temperature: 0.72,
                        max_tokens: 700
                    })
                });

                const data = await response.json();
                const aiText = data.choices[0].message.content.trim();
                agentConversation.push({ role: 'assistant', content: aiText });

                document.getElementById('agentTyping').classList.add('hidden');
                await typewriterAgentMessage(aiText);

            } catch (err) {
                document.getElementById('agentTyping').classList.add('hidden');
                appendAgentMessage('ai', "I'm having trouble connecting right now. Please check your internet and try again. 💙");
            } finally {
                agentIsTyping = false;
                document.getElementById('agentSendBtn').style.opacity = '1';
                document.getElementById('agentSendBtn').style.pointerEvents = 'auto';
                document.getElementById('agentStatusText').textContent = 'AI Career & Academic Counselor';
                scrollAgentToBottom();
            }
        }

        async function typewriterAgentMessage(text) {
            // Parse and render markdown-ish formatting
            const formatted = formatAgentText(text);

            const container = document.getElementById('agentMessages');
            const wrapper = document.createElement('div');
            wrapper.className = 'agent-msg-ai animate-slide-up';

            const avatar = document.createElement('div');
            avatar.className = 'ai-avatar';
            avatar.textContent = 'A';

            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.innerHTML = '';

            wrapper.appendChild(avatar);
            wrapper.appendChild(bubble);
            container.appendChild(wrapper);

            // Add cursor
            const cursor = document.createElement('span');
            cursor.className = 'cursor-blink';
            bubble.appendChild(cursor);

            // Typewriter effect on plain text, then swap to formatted
            const plainText = text;
            const chars = plainText.split('');
            let displayed = '';
            const chunkSize = 4; // Slightly larger chunks = faster and smoother on mobile
            let scrollCounter = 0;

            for (let i = 0; i < chars.length; i += chunkSize) {
                displayed += chars.slice(i, i + chunkSize).join('');
                bubble.textContent = displayed;
                bubble.appendChild(cursor);
                // Only scroll every 5 iterations to reduce reflows
                scrollCounter++;
                if (scrollCounter % 5 === 0) scrollAgentToBottom();
                await new Promise(r => setTimeout(r, 10));
            }

            // Replace with fully formatted version
            bubble.innerHTML = formatted;

            // Add follow-up suggestion chips
            const suggestions = generateSuggestions(text);
            if (suggestions.length > 0) {
                const chipsDiv = document.createElement('div');
                chipsDiv.className = 'agent-suggest-chips';
                suggestions.forEach(s => {
                    const chip = document.createElement('button');
                    chip.className = 'agent-suggest-chip';
                    chip.textContent = s;
                    chip.onclick = () => { document.getElementById('agentInput').value = s; sendAgentMessage(); };
                    chipsDiv.appendChild(chip);
                });
                bubble.appendChild(chipsDiv);
            }

            scrollAgentToBottom();
        }

        function formatAgentText(text) {
            // Bold **text**
            text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            // Italic *text*
            text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
            // Bullet points
            text = text.replace(/^[-•]\s(.+)$/gm, '<li>$1</li>');
            text = text.replace(/(<li>.*<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`);
            // Numbered lists
            text = text.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');
            // Line breaks
            text = text.replace(/\n\n/g, '</p><p>');
            text = text.replace(/\n/g, '<br>');
            // Wrap in paragraph
            if (!text.startsWith('<')) text = '<p>' + text + '</p>';

            return text;
        }

        function generateSuggestions(text) {
            const lower = text.toLowerCase();
            const suggestions = [];

            if (lower.includes('career') || lower.includes('field') || lower.includes('profession')) {
                suggestions.push('What career has the best salary?', 'Which field is growing fastest in Pakistan?');
            } else if (lower.includes('university') || lower.includes('nust') || lower.includes('fast') || lower.includes('uet')) {
                suggestions.push('What are the merit criteria?', 'Which university is best for CS?');
            } else if (lower.includes('scholarship') || lower.includes('fund')) {
                suggestions.push('How to apply for HEC scholarship?', 'Can I study abroad for free?');
            } else if (lower.includes('stress') || lower.includes('anxiet') || lower.includes('pressure')) {
                suggestions.push('How to manage exam stress?', 'How to talk to my parents about pressure?');
            } else if (lower.includes('test') || lower.includes('mdcat') || lower.includes('ecat') || lower.includes('net')) {
                suggestions.push('Recommended books for preparation?', 'How many months do I need?');
            } else if (lower.includes('study') || lower.includes('concent') || lower.includes('focus')) {
                suggestions.push('Best study techniques?', 'How to make a study schedule?');
            } else {
                suggestions.push('Tell me more', 'What should I do next?');
            }

            return suggestions.slice(0, 3);
        }

        function appendAgentMessage(type, text) {
            const container = document.getElementById('agentMessages');
            const wrapper = document.createElement('div');

            if (type === 'user') {
                wrapper.className = 'agent-msg-user animate-slide-up';
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                bubble.textContent = text;
                wrapper.appendChild(bubble);
            } else {
                wrapper.className = 'agent-msg-ai animate-slide-up';
                const avatar = document.createElement('div');
                avatar.className = 'ai-avatar';
                avatar.textContent = 'A';
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                bubble.innerHTML = formatAgentText(text);
                wrapper.appendChild(avatar);
                wrapper.appendChild(bubble);
            }

            container.appendChild(wrapper);
            scrollAgentToBottom();
        }

        function scrollAgentToBottom() {
            const container = document.getElementById('agentMessages');
            container.scrollTop = container.scrollHeight;
        }

        function clearAgentChat() {
            agentConversation = [];
            agentIsTyping = false;
            const container = document.getElementById('agentMessages');
            container.innerHTML = '';
            renderAgentWelcome();
            document.getElementById('agentTyping').classList.add('hidden');
            document.getElementById('agentSendBtn').style.opacity = '1';
            document.getElementById('agentSendBtn').style.pointerEvents = 'auto';
            document.getElementById('agentStatusText').textContent = 'AI Career & Academic Counselor';
        }

        function renderAgentWelcome() {
            const container = document.getElementById('agentMessages');
            container.innerHTML = `
        <div id="agentWelcomeCard" class="space-y-4">
            <div class="relative rounded-3xl overflow-hidden p-5"
                style="background:linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(14,165,233,0.1) 100%);border:1px solid rgba(99,102,241,0.2);">
                <div class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                    style="background:radial-gradient(circle,#6366f1,transparent);transform:translate(30%,-30%);"></div>
                <div class="flex items-start gap-4">
                    <div class="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-black text-white shadow-lg"
                        style="background:linear-gradient(135deg,#0ea5e9,#6366f1);box-shadow:0 8px 20px rgba(99,102,241,0.4);">A</div>
                    <div>
                        <p class="text-xs font-black uppercase tracking-widest mb-1" style="color:#818cf8;">ARIA · AI Counselor</p>
                        <h2 class="text-lg font-black text-white leading-tight mb-2">Your Personal Academic<br>&amp; Career Guide 🎓</h2>
                        <p class="text-xs text-zinc-400 leading-relaxed">I'm here to help you make the right decisions — from choosing subjects to finding your dream career path. No appointment needed.</p>
                    </div>
                </div>
                <div class="mt-4 grid grid-cols-3 gap-2">
                    <div class="p-2.5 rounded-xl text-center" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07);"><i class="fa-solid fa-comments text-indigo-400 text-sm mb-1 block"></i><p class="text-[9px] text-zinc-400 font-bold">Free Advice</p></div>
                    <div class="p-2.5 rounded-xl text-center" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07);"><i class="fa-solid fa-brain text-sky-400 text-sm mb-1 block"></i><p class="text-[9px] text-zinc-400 font-bold">AI Powered</p></div>
                    <div class="p-2.5 rounded-xl text-center" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07);"><i class="fa-solid fa-lock text-emerald-400 text-sm mb-1 block"></i><p class="text-[9px] text-zinc-400 font-bold">Private</p></div>
                </div>
            </div>
            <p class="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">What do you need help with?</p>
            <div class="grid grid-cols-2 gap-2.5">
                <button onclick="sendAgentQuickStart('I need help choosing my career path. Can you guide me step by step?')" class="agent-quick-card text-left p-4 rounded-2xl border transition-all active:scale-95" style="background:rgba(99,102,241,0.08);border-color:rgba(99,102,241,0.2);">
                    <i class="fa-solid fa-compass text-indigo-400 text-lg mb-2 block"></i>
                    <p class="text-xs font-black text-white">Find My Career Path</p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">Discover what suits you</p>
                </button>
                <button onclick="sendAgentQuickStart('Which university should I apply to for engineering or computer science?')" class="agent-quick-card text-left p-4 rounded-2xl border transition-all active:scale-95" style="background:rgba(14,165,233,0.08);border-color:rgba(14,165,233,0.2);">
                    <i class="fa-solid fa-graduation-cap text-sky-400 text-lg mb-2 block"></i>
                    <p class="text-xs font-black text-white">University Guidance</p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">NUST, FAST, UET &amp; more</p>
                </button>
                <button onclick="sendAgentQuickStart('How should I prepare for MDCAT or engineering entry tests? Give me a detailed strategy.')" class="agent-quick-card text-left p-4 rounded-2xl border transition-all active:scale-95" style="background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.2);">
                    <i class="fa-solid fa-pen-to-square text-amber-400 text-lg mb-2 block"></i>
                    <p class="text-xs font-black text-white">Entry Test Strategy</p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">MDCAT, NET, ECAT</p>
                </button>
                <button onclick="sendAgentQuickStart('I am feeling very stressed about my studies and future. I feel lost and overwhelmed. Please help me.')" class="agent-quick-card text-left p-4 rounded-2xl border transition-all active:scale-95" style="background:rgba(236,72,153,0.08);border-color:rgba(236,72,153,0.2);">
                    <i class="fa-solid fa-heart-pulse text-pink-400 text-lg mb-2 block"></i>
                    <p class="text-xs font-black text-white">Stress &amp; Pressure</p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">Academic mental wellbeing</p>
                </button>
                <button onclick="sendAgentQuickStart('My family wants me to do medicine or engineering but I am interested in arts and design. What should I do?')" class="agent-quick-card text-left p-4 rounded-2xl border transition-all active:scale-95" style="background:rgba(168,85,247,0.08);border-color:rgba(168,85,247,0.2);">
                    <i class="fa-solid fa-people-arrows text-purple-400 text-lg mb-2 block"></i>
                    <p class="text-xs font-black text-white">Family vs My Dreams</p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">Handle parental pressure</p>
                </button>
                <button onclick="sendAgentQuickStart('What scholarships are available for Pakistani students locally and internationally?')" class="agent-quick-card text-left p-4 rounded-2xl border transition-all active:scale-95" style="background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.2);">
                    <i class="fa-solid fa-award text-emerald-400 text-lg mb-2 block"></i>
                    <p class="text-xs font-black text-white">Scholarships</p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">Local &amp; international funding</p>
                </button>
            </div>
            <div class="grid grid-cols-3 gap-2 pb-2">
                <button onclick="sendAgentQuickStart('What are the best degrees for getting a high-paying job in Pakistan right now?')" class="text-left p-3 rounded-xl border transition-all active:scale-95" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.08);">
                    <i class="fa-solid fa-briefcase text-zinc-400 text-base mb-1.5 block"></i>
                    <p class="text-[10px] font-black text-zinc-300">Job Market</p>
                </button>
                <button onclick="sendAgentQuickStart('I want to study abroad. How do I get into a foreign university and what do I need?')" class="text-left p-3 rounded-xl border transition-all active:scale-95" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.08);">
                    <i class="fa-solid fa-plane text-zinc-400 text-base mb-1.5 block"></i>
                    <p class="text-[10px] font-black text-zinc-300">Study Abroad</p>
                </button>
                <button onclick="sendAgentQuickStart('I cannot focus on my studies at all. I procrastinate everything. How do I fix this?')" class="text-left p-3 rounded-xl border transition-all active:scale-95" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.08);">
                    <i class="fa-solid fa-clock text-zinc-400 text-base mb-1.5 block"></i>
                    <p class="text-[10px] font-black text-zinc-300">Time Mgmt</p>
                </button>
            </div>
        </div>`;
        }

        let agentVoiceRecognition = null;
        let agentVoiceActive = false;

        function startAgentVoice() {
            if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                alert('Voice input not supported on this browser.');
                return;
            }
            if (agentVoiceActive) {
                agentVoiceRecognition?.stop();
                agentVoiceActive = false;
                document.getElementById('agentVoiceBtn').style.color = '';
                document.getElementById('agentVoiceBtn').style.background = 'rgba(255,255,255,0.05)';
                return;
            }
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            agentVoiceRecognition = new SR();
            agentVoiceRecognition.lang = 'en-US';
            agentVoiceRecognition.continuous = false;
            agentVoiceRecognition.interimResults = false;
            agentVoiceActive = true;
            document.getElementById('agentVoiceBtn').style.color = '#818cf8';
            document.getElementById('agentVoiceBtn').style.background = 'rgba(99,102,241,0.2)';

            agentVoiceRecognition.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                document.getElementById('agentInput').value = transcript;
                autoResizeAgentInput(document.getElementById('agentInput'));
            };
            agentVoiceRecognition.onend = () => {
                agentVoiceActive = false;
                document.getElementById('agentVoiceBtn').style.color = '';
                document.getElementById('agentVoiceBtn').style.background = 'rgba(255,255,255,0.05)';
            };
            agentVoiceRecognition.onerror = () => {
                agentVoiceActive = false;
                document.getElementById('agentVoiceBtn').style.color = '';
            };
            agentVoiceRecognition.start();
        }

