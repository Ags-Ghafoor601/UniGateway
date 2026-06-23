// ===========================
// DASHBOARD & ANALYTICS MODULE
// ===========================

const DASHBOARD_ACHIEVEMENTS = [
    { id: 'first_quiz', name: 'First Steps', icon: '🎯', desc: 'Complete your first quiz', check: s => s.totalSessions >= 1 },
    { id: 'five_quizzes', name: 'Getting Started', icon: '🔥', desc: 'Complete 5 sessions', check: s => s.totalSessions >= 5 },
    { id: 'ten_quizzes', name: 'Dedicated Learner', icon: '📚', desc: 'Complete 10 sessions', check: s => s.totalSessions >= 10 },
    { id: 'twenty_five', name: 'Knowledge Seeker', icon: '🧠', desc: 'Complete 25 sessions', check: s => s.totalSessions >= 25 },
    { id: 'perfect_score', name: 'Perfectionist', icon: '💎', desc: 'Score 100% on any session', check: (s, entries) => entries.some(e => e.percentage === 100) },
    { id: 'high_avg', name: 'Honor Roll', icon: '🏅', desc: 'Maintain 80%+ average', check: s => s.totalSessions >= 3 && s.avgPercentage >= 80 },
    { id: 'streak_3', name: 'On Fire', icon: '🔥', desc: 'Achieve a 3-day streak', check: s => s.longestStreak >= 3 },
    { id: 'streak_7', name: 'Unstoppable', icon: '⚡', desc: 'Achieve a 7-day streak', check: s => s.longestStreak >= 7 },
    { id: 'fifty_correct', name: 'Half Century', icon: '🎖️', desc: 'Answer 50 questions correctly', check: s => s.totalCorrect >= 50 },
    { id: 'hundred_correct', name: 'Centurion', icon: '👑', desc: 'Answer 100 questions correctly', check: s => s.totalCorrect >= 100 },
    { id: 'multi_topic', name: 'Well Rounded', icon: '🌟', desc: 'Practice 5 different topics', check: (s, entries) => new Set(entries.map(e => e.topic).filter(Boolean)).size >= 5 },
];

function _dashKey() {
    const uid = window.currentUserId || 'guest';
    return `uniGateway_dashboard_${uid}`;
}

function loadDashboardData() {
    try {
        const raw = localStorage.getItem(_dashKey());
        if (raw) return JSON.parse(raw);
    } catch (e) { }
    return { entries: [], stats: { totalSessions: 0, totalCorrect: 0, totalQuestions: 0, avgPercentage: 0, bestScore: 0, currentStreak: 0, longestStreak: 0, lastActive: null }, achievements: [] };
}

function _saveDashboardData(data) {
    localStorage.setItem(_dashKey(), JSON.stringify(data));
}

function _recalcDashStats(data) {
    const entries = data.entries;
    const s = data.stats;
    s.totalSessions = entries.length;
    s.totalCorrect = entries.reduce((sum, e) => sum + e.score, 0);
    s.totalQuestions = entries.reduce((sum, e) => sum + e.total, 0);
    s.avgPercentage = s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0;
    s.bestScore = entries.length > 0 ? Math.max(...entries.map(e => e.percentage)) : 0;

    // Streak calculation based on unique days
    const days = [...new Set(entries.map(e => new Date(e.timestamp).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
    let current = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < days.length; i++) {
        const expected = new Date(today); expected.setDate(today.getDate() - i);
        if (new Date(days[i]).toDateString() === expected.toDateString()) current++;
        else break;
    }
    s.currentStreak = current;

    // Longest streak ever
    let longest = 0, streak = 1;
    const sortedDays = [...new Set(entries.map(e => new Date(e.timestamp).toDateString()))].map(d => new Date(d)).sort((a, b) => a - b);
    for (let i = 1; i < sortedDays.length; i++) {
        const diff = (sortedDays[i] - sortedDays[i - 1]) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) streak++;
        else { longest = Math.max(longest, streak); streak = 1; }
    }
    longest = Math.max(longest, streak);
    s.longestStreak = sortedDays.length > 0 ? longest : 0;

    s.lastActive = entries.length > 0 ? entries[entries.length - 1].timestamp : null;

    // Achievements
    const unlocked = data.achievements.map(a => a.id);
    DASHBOARD_ACHIEVEMENTS.forEach(ach => {
        if (!unlocked.includes(ach.id) && ach.check(s, entries)) {
            data.achievements.push({ id: ach.id, name: ach.name, icon: ach.icon, desc: ach.desc, unlockedAt: new Date().toISOString() });
        }
    });
}

// Called by quiz.js and exam.js after submission
function saveDashboardEntry(entry) {
    // entry: { type, score, total, percentage, topic, difficulty }
    const data = loadDashboardData();
    data.entries.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        type: entry.type || 'quiz',
        timestamp: new Date().toISOString(),
        score: entry.score || 0,
        total: entry.total || 0,
        percentage: entry.percentage || 0,
        topic: entry.topic || 'General',
        difficulty: entry.difficulty || 'Medium'
    });
    _recalcDashStats(data);
    _saveDashboardData(data);
    return data;
}

// ===========================
// DASHBOARD RENDERING
// ===========================

function renderDashboard() {
    const data = loadDashboardData();
    _recalcDashStats(data);
    const container = document.getElementById('dashboardContent');
    if (!container) return;

    const s = data.stats;
    const entries = data.entries;
    const achievements = data.achievements;

    if (entries.length === 0) {
        container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div class="w-24 h-24 rounded-3xl flex items-center justify-center mb-6" style="background:linear-gradient(135deg,rgba(16,185,129,0.2),rgba(59,130,246,0.15));border:1px solid rgba(16,185,129,0.25);">
                <i class="fa-solid fa-chart-pie text-emerald-400 text-4xl"></i>
            </div>
            <h3 class="text-xl font-black text-white mb-2">No Activity Yet</h3>
            <p class="text-sm text-zinc-500 mb-6 max-w-xs">Complete a quiz or exam practice to start tracking your performance and unlock achievements!</p>
            <button onclick="switchView('quiz')" class="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl active:scale-95 transition-transform flex items-center gap-2">
                <i class="fa-solid fa-brain"></i> Take a Quiz
            </button>
        </div>`;
        return;
    }

    // Recent entries (last 10)
    const recent = [...entries].reverse().slice(0, 10);

    // Topic breakdown
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
    })).sort((a, b) => b.count - a.count).slice(0, 6);

    // Last 10 scores for bar chart
    const chartEntries = [...entries].slice(-10);

    // Applied Universities
    const applyKey = `uniGateway_applied_${window.currentUserId || 'guest'}`;
    const appliedUnis = JSON.parse(localStorage.getItem(applyKey) || '[]');
    const appliedHtml = appliedUnis.length > 0 ? `
    <div class="glass-panel p-5 rounded-3xl mb-5 animate-slide-up opacity-0" style="animation-delay:0.28s;">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.2);">
                    <i class="fa-solid fa-building-columns text-emerald-400 text-xs"></i>
                </div>
                <h3 class="text-sm font-black text-white">My Applications</h3>
            </div>
            <span class="text-[10px] font-bold text-zinc-500">${appliedUnis.length} Applied</span>
        </div>
        <div class="space-y-2">
            ${appliedUnis.map(acronym => `
                <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/10 overflow-hidden">
                            <img src="logos/${acronym}.png" class="w-6 h-6 object-contain" onerror="this.style.display='none'">
                        </div>
                        <span class="text-sm font-bold text-white">${escapeHtml(acronym)}</span>
                    </div>
                    <span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 uppercase tracking-wider">Applied</span>
                </div>
            `).join('')}
        </div>
    </div>` : '';

    container.innerHTML = `
    <!-- Overview Stats -->
    <div class="grid grid-cols-2 gap-3 mb-5 animate-slide-up opacity-0" style="animation-delay:0.05s;">
        <div class="glass-card p-4 rounded-2xl text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <p class="text-3xl font-black text-white mt-1">${s.totalSessions}</p>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Total Tests</p>
        </div>
        <div class="glass-card p-4 rounded-2xl text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <p class="text-3xl font-black ${s.avgPercentage >= 70 ? 'text-emerald-400' : s.avgPercentage >= 50 ? 'text-yellow-400' : 'text-red-400'} mt-1">${s.avgPercentage}%</p>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Avg Score</p>
        </div>
        <div class="glass-card p-4 rounded-2xl text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
            <p class="text-3xl font-black text-yellow-400 mt-1">${s.bestScore}%</p>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Best Score</p>
        </div>
        <div class="glass-card p-4 rounded-2xl text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
            <p class="text-3xl font-black text-orange-400 mt-1">${s.currentStreak}<span class="text-lg">🔥</span></p>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Day Streak</p>
        </div>
    </div>

    <!-- Extra stats row -->
    <div class="flex gap-2 mb-5 animate-slide-up opacity-0" style="animation-delay:0.1s;">
        <div class="flex-1 glass-card p-3 rounded-xl flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.25);">
                <i class="fa-solid fa-bullseye text-blue-400 text-sm"></i>
            </div>
            <div>
                <p class="text-sm font-black text-white">${s.totalCorrect}<span class="text-zinc-500 font-medium">/${s.totalQuestions}</span></p>
                <p class="text-[9px] text-zinc-500 font-bold uppercase">Correct Answers</p>
            </div>
        </div>
        <div class="flex-1 glass-card p-3 rounded-xl flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.25);">
                <i class="fa-solid fa-bolt text-purple-400 text-sm"></i>
            </div>
            <div>
                <p class="text-sm font-black text-white">${s.longestStreak} days</p>
                <p class="text-[9px] text-zinc-500 font-bold uppercase">Best Streak</p>
            </div>
        </div>
    </div>

    <!-- Performance Graph -->
    <div class="glass-panel p-5 rounded-3xl mb-5 animate-slide-up opacity-0" style="animation-delay:0.15s;">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.2);">
                    <i class="fa-solid fa-chart-simple text-emerald-400 text-xs"></i>
                </div>
                <h3 class="text-sm font-black text-white">Score History</h3>
            </div>
            <span class="text-[10px] font-bold text-zinc-500">Last ${chartEntries.length} tests</span>
        </div>
        <div class="dash-chart-container">
            <div class="dash-chart-grid">
                <div class="dash-chart-gridline" style="bottom:100%"><span class="dash-chart-label">100</span></div>
                <div class="dash-chart-gridline" style="bottom:75%"><span class="dash-chart-label">75</span></div>
                <div class="dash-chart-gridline" style="bottom:50%"><span class="dash-chart-label">50</span></div>
                <div class="dash-chart-gridline" style="bottom:25%"><span class="dash-chart-label">25</span></div>
                <div class="dash-chart-gridline" style="bottom:0%"><span class="dash-chart-label">0</span></div>
            </div>
            <div class="dash-chart-bars">
                ${chartEntries.map((e, i) => {
                    const h = Math.max(4, e.percentage);
                    const color = e.percentage >= 80 ? 'from-emerald-500 to-teal-400' : e.percentage >= 60 ? 'from-blue-500 to-indigo-400' : e.percentage >= 40 ? 'from-yellow-500 to-orange-400' : 'from-red-500 to-pink-400';
                    const day = new Date(e.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    return `<div class="dash-chart-bar-wrapper" style="animation-delay:${i * 0.06}s">
                        <div class="dash-chart-bar bg-gradient-to-t ${color}" style="height:${h}%" title="${e.percentage}% — ${e.topic}">
                            <span class="dash-chart-bar-val">${e.percentage}%</span>
                        </div>
                        <span class="dash-chart-bar-label">${day}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>
    </div>

    <!-- Subject Breakdown -->
    ${topics.length > 0 ? `
    <div class="glass-panel p-5 rounded-3xl mb-5 animate-slide-up opacity-0" style="animation-delay:0.2s;">
        <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.2);">
                <i class="fa-solid fa-layer-group text-blue-400 text-xs"></i>
            </div>
            <h3 class="text-sm font-black text-white">Subject Mastery</h3>
        </div>
        <div class="space-y-3">
            ${topics.map(t => {
                const barColor = t.avg >= 80 ? 'bg-emerald-500' : t.avg >= 60 ? 'bg-blue-500' : t.avg >= 40 ? 'bg-yellow-500' : 'bg-red-500';
                return `<div>
                    <div class="flex justify-between text-xs mb-1.5">
                        <span class="text-zinc-300 font-bold truncate flex-1 mr-2">${escapeHtml(t.name)}</span>
                        <span class="font-black text-white flex-shrink-0">${t.avg}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${barColor}" style="width:${t.avg}%;transition:width 0.8s ease;"></div>
                    </div>
                    <p class="text-[9px] text-zinc-600 mt-1">${t.count} test${t.count > 1 ? 's' : ''}</p>
                </div>`;
            }).join('')}
        </div>
    </div>` : ''}

    <!-- Achievements -->
    <div class="glass-panel p-5 rounded-3xl mb-5 animate-slide-up opacity-0" style="animation-delay:0.25s;">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.2);">
                    <i class="fa-solid fa-award text-yellow-400 text-xs"></i>
                </div>
                <h3 class="text-sm font-black text-white">Badges</h3>
            </div>
            <span class="text-[10px] font-bold text-zinc-500">${achievements.length}/${DASHBOARD_ACHIEVEMENTS.length} unlocked</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
            ${DASHBOARD_ACHIEVEMENTS.map(ach => {
                const unlocked = achievements.find(a => a.id === ach.id);
                return `<div class="dash-achievement ${unlocked ? 'unlocked' : 'locked'}" title="${ach.desc}">
                    <span class="text-2xl ${unlocked ? '' : 'grayscale opacity-30'}">${ach.icon}</span>
                    <span class="text-[9px] font-bold ${unlocked ? 'text-white' : 'text-zinc-600'} mt-1 text-center leading-tight">${ach.name}</span>
                </div>`;
            }).join('')}
        </div>
    </div>

    ${appliedHtml}
    
    <!-- Activity Timeline -->
    <div class="glass-panel p-5 rounded-3xl mb-20 animate-slide-up opacity-0" style="animation-delay:0.3s;">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.2);">
                    <i class="fa-solid fa-clock-rotate-left text-purple-400 text-xs"></i>
                </div>
                <h3 class="text-sm font-black text-white">Recent Tests</h3>
            </div>
            <span class="text-[10px] font-bold text-zinc-500">${entries.length} total</span>
        </div>
        <div class="space-y-2">
            ${recent.map(e => {
                const d = new Date(e.timestamp);
                const timeAgo = _dashTimeAgo(d);
                const icon = e.type === 'quiz' ? 'fa-brain' : 'fa-clipboard-check';
                const typeLabel = e.type === 'quiz' ? 'Quiz' : 'Exam Practice';
                const pctColor = e.percentage >= 80 ? 'text-emerald-400' : e.percentage >= 60 ? 'text-blue-400' : e.percentage >= 40 ? 'text-yellow-400' : 'text-red-400';
                const bgColor = e.percentage >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : e.percentage >= 60 ? 'bg-blue-500/10 border-blue-500/20' : e.percentage >= 40 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';
                return `<div class="flex items-center gap-3 p-3 rounded-xl border ${bgColor} transition-all">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);">
                        <i class="fa-solid ${icon} ${pctColor} text-xs"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-white truncate">${escapeHtml(e.topic)}</p>
                        <p class="text-[10px] text-zinc-500">${typeLabel} · ${e.difficulty} · ${timeAgo}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <p class="text-sm font-black ${pctColor}">${e.percentage}%</p>
                        <p class="text-[9px] text-zinc-600">${e.score}/${e.total}</p>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>`;
}

function _dashTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
