// ===========================
// INSIGHTS & WEAKNESS ANALYZER MODULE
// ===========================

const getTopicEmoji = (topicName) => {
    if (!topicName) return '🎯';
    const t = topicName.toLowerCase();
    if(t.includes('math') || t.includes('calculus') || t.includes('algebra')) return '📐';
    if(t.includes('physic')) return '⚛️';
    if(t.includes('chemist')) return '🧪';
    if(t.includes('bio') || t.includes('genetics') || t.includes('anatomy')) return '🧬';
    if(t.includes('english') || t.includes('gramm') || t.includes('vocab')) return '📚';
    if(t.includes('computer') || t.includes('program') || t.includes('software')) return '💻';
    if(t.includes('history')) return '📜';
    if(t.includes('geo')) return '🌍';
    if(t.includes('logic') || t.includes('reason')) return '🧠';
    if(t.includes('general')) return '🌐';
    return '🎯';
};

function renderInsights() {
    const container = document.getElementById('insightsContent');
    if (!container) return;

    // Load data from dashboard
    const data = (typeof loadDashboardData === 'function') ? loadDashboardData() : { entries: [] };
    const entries = data.entries || [];

    if (entries.length === 0) {
        container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
            <div class="relative mb-8">
                <div class="absolute inset-0 bg-rose-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div class="w-28 h-28 rounded-[2rem] flex items-center justify-center relative z-10" style="background:linear-gradient(135deg,rgba(244,63,94,0.15),rgba(239,68,68,0.05));border:1px solid rgba(244,63,94,0.3);box-shadow:inset 0 0 20px rgba(244,63,94,0.2);">
                    <i class="fa-solid fa-satellite-dish text-rose-400 text-5xl"></i>
                </div>
            </div>
            <h3 class="text-2xl font-black text-white mb-3 tracking-tight">No Data Detected</h3>
            <p class="text-sm text-zinc-400 mb-8 max-w-[280px] leading-relaxed">Your insight radar is currently empty. Take a few tests so our AI can scan your performance and find areas for improvement.</p>
            <button onclick="switchView('quiz')" class="px-8 py-4 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center gap-3">
                <i class="fa-solid fa-bolt text-yellow-300"></i> Start Scanning
            </button>
        </div>`;
        return;
    }

    // Group by topic
    const topicMap = {};
    entries.forEach(e => {
        if (!topicMap[e.topic]) topicMap[e.topic] = { correct: 0, total: 0, count: 0 };
        topicMap[e.topic].correct += e.score;
        topicMap[e.topic].total += e.total;
        topicMap[e.topic].count++;
    });

    const topics = Object.keys(topicMap).map(t => ({
        name: t,
        avg: Math.round((topicMap[t].correct / topicMap[t].total) * 100),
        count: topicMap[t].count
    })).sort((a, b) => a.avg - b.avg); // Sort ascending by average (weakest first)

    const weakTopics = topics.filter(t => t.avg < 75).slice(0, 5); // Top 5 weak topics under 75%

    let weakHTML = '';
    if (weakTopics.length > 0) {
        weakHTML = `
        <div class="mb-8">
            <div class="flex items-center justify-between mb-4 px-1">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                    <p class="text-xs font-black text-zinc-400 uppercase tracking-widest">Target Priorities</p>
                </div>
                <span class="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">${weakTopics.length} detected</span>
            </div>
            
            <div class="space-y-4">
                ${weakTopics.map((t, index) => {
                    const radius = 20;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (t.avg / 100) * circumference;
                    const colorClass = t.avg < 50 ? 'text-red-500' : 'text-orange-400';
                    const strokeColor = t.avg < 50 ? '#ef4444' : '#fb923c';
                    const safeName = typeof escapeHtml === 'function' ? escapeHtml(t.name) : t.name;

                    return `
                    <div onclick="generateTopicGuide('${encodeURIComponent(t.name)}')" class="glass-card p-5 rounded-[1.5rem] flex items-center gap-4 animate-slide-up opacity-0 relative overflow-hidden group hover:bg-white/[0.04] transition-colors cursor-pointer active:scale-[0.98]" style="animation-delay:${index * 0.1}s">
                        <!-- Background glow effect -->
                        <div class="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.03] blur-2xl group-hover:opacity-[0.06] transition-opacity" style="background:${strokeColor}"></div>
                        
                        <!-- Circular Progress -->
                        <div class="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 50 50">
                                <circle class="text-zinc-800" stroke-width="4" stroke="currentColor" fill="transparent" r="20" cx="25" cy="25"/>
                                <circle class="${colorClass}" stroke-width="4" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" stroke="currentColor" fill="transparent" r="20" cx="25" cy="25" style="transition: stroke-dashoffset 1s ease-out"/>
                            </svg>
                            <span class="absolute text-[10px] font-black text-white">${t.avg}%</span>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-0.5">
                                <div class="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-xs shadow-inner">
                                    ${getTopicEmoji(t.name)}
                                </div>
                                <h4 class="text-base font-black text-white truncate">${safeName}</h4>
                            </div>
                            <p class="text-[11px] text-zinc-500 font-medium ml-8">Avg Score: ${t.avg}% · ${t.count} Tests</p>
                        </div>
                        
                        <div class="h-9 px-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white group-hover:border-violet-500 transition-colors flex-shrink-0">
                            <i class="fa-solid fa-wand-magic-sparkles text-xs mr-1.5"></i>
                            <span class="text-[10px] font-bold uppercase tracking-wider">Fix</span>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            <p class="text-center text-[10px] text-zinc-500 mt-4 font-medium uppercase tracking-widest"><i class="fa-solid fa-hand-pointer mr-1"></i> Tap a topic to generate study guide</p>
        </div>
        `;
    } else {
        weakHTML = `
        <div class="glass-card p-8 rounded-[2rem] text-center mb-8 relative overflow-hidden">
            <div class="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500 blur-[80px] opacity-20"></div>
            <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-500 blur-[80px] opacity-20"></div>
            
            <div class="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5 relative z-10" style="background:linear-gradient(135deg,rgba(16,185,129,0.2),rgba(20,184,166,0.1));border:1px solid rgba(16,185,129,0.3);box-shadow:0 0 30px rgba(16,185,129,0.2);">
                <i class="fa-solid fa-check-double text-emerald-400 text-3xl"></i>
            </div>
            <h3 class="text-2xl font-black text-white mb-2 relative z-10">Optimal State!</h3>
            <p class="text-sm text-zinc-400 leading-relaxed relative z-10">Your diagnostic scan shows no critical weaknesses. You are dominating your current subjects. Keep pushing the limits!</p>
        </div>
        `;
    }

    container.innerHTML = `
    <!-- Top Decorative Header inside the view -->
    <div class="mb-8 mt-2 text-center animate-fade-in">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
            <i class="fa-solid fa-microscope text-zinc-400 text-xl"></i>
        </div>
        <h2 class="text-3xl font-black text-white tracking-tight mb-2">Diagnostic Scan</h2>
        <p class="text-xs font-medium text-zinc-500 max-w-xs mx-auto">AI-powered analysis of your recent academic performance</p>
    </div>

    <!-- Weaknesses Section -->
    ${weakHTML}

    <!-- AI Guide Container -->
    <div id="aiGuideContainer" class="hidden pb-10">
        <div class="flex items-center gap-2 mb-4 px-2 animate-fade-in">
            <div class="w-6 h-6 rounded-md bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <i class="fa-solid fa-robot text-white text-[10px]"></i>
            </div>
            <h3 class="text-sm font-black text-white tracking-wide">ARIA Strategy Protocol: <span id="aiGuideTopicName" class="text-violet-300"></span></h3>
        </div>
        
        <div id="aiGuideContent" class="glass-panel p-6 rounded-[2rem] text-sm leading-relaxed text-zinc-300 relative overflow-hidden border border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.05)]">
            <!-- Loading State is injected here initially -->
        </div>
    </div>
    `;
}

async function generateTopicGuide(encodedTopic) {
    const topicName = decodeURIComponent(encodedTopic);

    const container = document.getElementById('aiGuideContainer');
    const content = document.getElementById('aiGuideContent');
    const topicLabel = document.getElementById('aiGuideTopicName');
    
    container.classList.remove('hidden');
    topicLabel.textContent = topicName;
    
    // Skeleton Loading State
    content.innerHTML = `
        <div class="animate-pulse space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-book-open text-violet-400"></i>
                </div>
                <div>
                    <div class="h-3 w-32 bg-zinc-700/50 rounded-full mb-2"></div>
                    <div class="h-2 w-24 bg-zinc-800 rounded-full"></div>
                </div>
            </div>
            <div class="h-2 bg-zinc-800 rounded-full w-full"></div>
            <div class="h-2 bg-zinc-800 rounded-full w-full"></div>
            <div class="h-2 bg-zinc-800 rounded-full w-5/6"></div>
            <div class="h-2 bg-zinc-800 rounded-full w-4/6 mb-4"></div>
            
            <div class="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] mt-6">
                <div class="h-3 w-1/3 bg-zinc-700/50 rounded-full mb-3"></div>
                <div class="space-y-2 mt-4">
                    <div class="h-2 bg-zinc-800 rounded-full w-full"></div>
                    <div class="h-2 bg-zinc-800 rounded-full w-3/4"></div>
                </div>
            </div>
        </div>
    `;

    // Smooth scroll to container
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    { 
                        role: "system", 
                        content: "You are ARIA, an elite academic advisor. The student needs to master a specific topic. Provide a highly actionable study guide specifically for this topic. Include: 1) Core concepts to focus on, 2) Recommended books (preferably those used in Pakistani curriculum like Punjab Textbook Board or famous international reference books), 3) 1-2 Specific YouTube channels or video types to search for. Keep it structured, engaging, and under 150 words." 
                    },
                    { 
                        role: "user", 
                        content: `I am struggling with the topic: "${topicName}". Give me a specific study guide, book recommendations, and YouTube channels to master this.` 
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.7,
                max_tokens: 400
            })
        });

        const data = await response.json();
        const aiText = data.choices[0].message.content.trim();
        
        // Advanced formatter for premium look
        let formatted = aiText;
        
        // Bolding
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-black tracking-wide">$1</strong>');
        // Italics
        formatted = formatted.replace(/\*([^*\n]+)\*/g, '<em class="text-violet-300">$1</em>');
        
        // Bullet points (convert to custom sleek list items)
        formatted = formatted.replace(/^[-•]\s(.+)$/gm, `
            <li class="flex gap-3 mb-4 items-start">
                <div class="mt-1 w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 border border-violet-500/30">
                    <div class="w-1.5 h-1.5 bg-violet-400 rounded-full"></div>
                </div>
                <span class="flex-1">$1</span>
            </li>`);
        formatted = formatted.replace(/(<li.*<\/li>\n?)+/gs, (match) => `<ul class="my-5 text-zinc-300">${match}</ul>`);
        
        // Paragraphs
        formatted = formatted.replace(/\n\n/g, '</p><p class="mb-4 text-zinc-400 text-[13px]">');
        formatted = formatted.replace(/\n/g, '<br>');
        if (!formatted.startsWith('<')) formatted = '<p class="mb-4 text-zinc-400 text-[13px]">' + formatted + '</p>';

        // Render with entrance animation
        content.innerHTML = `
        <div class="animate-fade-in relative z-10">
            <div class="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                    <i class="fa-solid fa-book-open-reader text-violet-400 text-lg"></i>
                </div>
                <div>
                    <h4 class="text-white font-black tracking-wide">Targeted Study Guide</h4>
                    <p class="text-[10px] text-violet-400 font-bold uppercase tracking-widest mt-0.5">Resources & Strategy</p>
                </div>
            </div>
            ${formatted}
            
            <div class="mt-6 pt-4 border-t border-white/5 flex justify-end">
                <button onclick="document.getElementById('aiGuideContainer').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold">
                    Close Guide
                </button>
            </div>
        </div>
        
        <!-- Decorative background elements inside the guide -->
        <div class="absolute -top-20 -right-20 w-40 h-40 bg-violet-600 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-fuchsia-600 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
        `;

    } catch (err) {
        content.innerHTML = `
        <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <i class="fa-solid fa-triangle-exclamation text-rose-500 text-xl"></i>
            <div>
                <p class="text-rose-100 font-bold text-sm">Connection Terminated</p>
                <p class="text-rose-400/80 text-[10px] mt-0.5">Unable to connect to ARIA network. Please check your signal and try again.</p>
            </div>
        </div>`;
    }
}
