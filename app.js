// --- CONFIG ---
const UNI_SHEET = "./universities.csv";
let allData = [], currentFilterType = 'all', currentFilterCity = 'all';

// ===========================
// AUTH UI
// ===========================
function toggleAuth(type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (type === 'register') { loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); }
    else { registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); }
}

// ===========================
// NAVIGATION
// ===========================
function switchView(viewName) {     // On click of feature, that feature open and in backend it pass in the argument.
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('page-active'));
    document.querySelectorAll('.nav-btn').forEach(n => { n.classList.remove('active'); n.querySelector('span').classList.remove('font-bold'); });
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add('page-active');
    const btn = document.getElementById(`nav-${viewName}`);
    if (btn) { btn.classList.add('active'); btn.querySelector('span').classList.add('font-bold'); }
    const titles = { 'admissions': 'UniGateway', 'calculator': 'Merit Calc', 'voice': 'Voice AI', 'quiz': 'Quiz', 'exam': 'Exam Planner', 'channels': 'Channels', 'agent': 'AI Agent', 'feedback': 'Feedback', 'dashboard': 'Dashboard', 'insights': 'My Insights' };
    document.getElementById('headerTitle').innerText = titles[viewName] || 'UniGateway';
    if (viewName === 'quiz') resetQuiz();
    else if (viewName === 'calculator') { ['calcMatric', 'calcFsc', 'calcTest'].forEach(id => document.getElementById(id).value = ''); document.getElementById('totalMatric').value = 1100; document.getElementById('totalFsc').value = 1100; document.getElementById('totalTest').value = 100; document.getElementById('progressRing').style.strokeDashoffset = 326.72; document.getElementById('aggDisplay').innerHTML = `0<span class="text-xl">%</span>`; currentFormula = FORMULAS["default"]; document.getElementById('selectedUniLabel').innerText = currentFormula.name; document.getElementById('wMatric').innerText = currentFormula.m + "%"; document.getElementById('wFsc').innerText = currentFormula.f + "%"; document.getElementById('wTest').innerText = currentFormula.t + "%"; }
    else if (viewName === 'admissions') { document.getElementById('searchInput').value = ''; clearFilters(); }
    else if (viewName === 'feedback') { document.getElementById('fbMessage').value = ''; }
    else if (viewName === 'exam') { loadSavedSchedule(); }
    else if (viewName === 'dashboard') { renderDashboard(); }
    else if (viewName === 'insights') { renderInsights(); }
    else if (viewName === 'agent') {
        // If chat was cleared, restore welcome card
        const msgs = document.getElementById('agentMessages');
        if (msgs && msgs.children.length === 0) {
            renderAgentWelcome();
        }
    }
    else if (viewName === 'channels') {
        // Init channels on first open
        setTimeout(() => {
            if (!chUnsubscribe) switchChannel('general');
        }, 300);
    }
    if (targetView) targetView.scrollTo(0, 0);
}

// ===========================
// INIT & RENDERING
// ===========================
function init() {
    // Note: I temporarily removed the cacheBuster, as it sometimes causes 400 Bad Request errors on Google Sheets
    Papa.parse(UNI_SHEET, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            if (results.data && results.data.length > 0) {
                allData = results.data;
                renderHome(allData);
                populateFilterSheet(allData);
            } else {
                alert("Developer Error: Google Sheet loaded, but it is empty!");
            }
        },
        error: function (error) {
            // This will pop up an alert telling us exactly why it failed!
            alert("Developer Error fetching universities: " + error.message);
        }
    });

    switchView('admissions');
    renderSheetList();
    if (window.currentUserId) loadUserCalculatorData();
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    let cleanStr = dateStr.replace(/,/g, ' ').replace(/-/g, ' ').replace(/\//g, ' ').trim();
    const parts = cleanStr.split(/\s+/);
    if (parts.length >= 3) {
        let day = parseInt(parts[0]), monthStr = parts[1].toLowerCase(), year = parseInt(parts[2]);
        if (year < 100) year += 2000;
        const months = { "jan": 0, "january": 0, "feb": 1, "february": 1, "mar": 2, "march": 2, "apr": 3, "april": 3, "may": 4, "jun": 5, "june": 5, "jul": 6, "july": 6, "aug": 7, "august": 7, "sep": 8, "september": 8, "oct": 9, "october": 9, "nov": 10, "november": 10, "dec": 11, "december": 11, "01": 0, "1": 0, "02": 1, "2": 1, "03": 2, "3": 2, "04": 3, "4": 3, "05": 4, "5": 4, "06": 5, "6": 5, "07": 6, "7": 6, "08": 7, "8": 7, "09": 8, "9": 8, "10": 9, "11": 10, "12": 11 };
        let month = months[monthStr];
        if (month !== undefined && !isNaN(day) && !isNaN(year)) return new Date(year, month, day);
    }
    const standardDate = new Date(cleanStr);
    if (!isNaN(standardDate)) return standardDate;
    return null;
}

function renderHome(data) {
    const grid = document.getElementById('uniGrid'); grid.innerHTML = "";
    data.sort((a, b) => { const dA = parseDate(a.Deadline) || new Date(8640000000000000); const dB = parseDate(b.Deadline) || new Date(8640000000000000); return dA - dB; });
    data.forEach((uni, idx) => {
        if (!uni.Acronym) return;
        const deadline = parseDate(uni.Deadline); const now = new Date(); now.setHours(0, 0, 0, 0);
        const isValid = deadline && !isNaN(deadline); const isOpen = isValid && deadline >= now;
        const dStr = isValid ? deadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Check Site";
        const logoPath = `logos/${uni.Acronym}.png`;
        const card = document.createElement('div');
        // Cap animation delay to max 0.4s to prevent last cards appearing too late
        const delay = Math.min(idx * 0.04, 0.4);
        card.style.cssText = `animation-delay:${delay}s;`;
        card.className = "glass-card p-4 rounded-2xl animate-slide-up opacity-0 cursor-pointer";
        card.onclick = () => openDetail(uni, dStr, isOpen);
        // Apply Tracking Check
        const applyKey = `uniGateway_applied_${window.currentUserId || 'guest'}`;
        const appliedUnis = JSON.parse(localStorage.getItem(applyKey) || '[]');
        const isApplied = appliedUnis.includes(uni.Acronym);
        let applyBtnHtml = '';
        if (isOpen) {
            if (isApplied) {
                applyBtnHtml = `<button id="apply-btn-${uni.Acronym}" onclick="toggleApply('${uni.Acronym}', event)" class="mt-3 w-full py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-1"><i class="fa-solid fa-check-circle"></i> Applied</button>`;
            } else {
                applyBtnHtml = `<button id="apply-btn-${uni.Acronym}" onclick="toggleApply('${uni.Acronym}', event)" class="mt-3 w-full py-2 bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold rounded-xl transition-all flex justify-center items-center">Apply Compulsory? <span class="text-blue-400 ml-1">Click Yes</span></button>`;
            }
        }

        card.innerHTML = `<div class="flex justify-between items-start mb-3 pointer-events-none"><div class="flex gap-3"><div class="uni-logo-container"><div class="uni-fallback-text">${uni.Acronym.substring(0, 2)}</div><img src="${logoPath}" class="uni-logo-img" loading="lazy" onerror="this.style.opacity='0'"></div><div><h3 class="font-bold text-white leading-tight">${uni.Acronym}</h3><p class="text-[10px] text-zinc-400">${uni.City}</p></div></div><div class="px-2 py-0.5 rounded-md border ${isOpen ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} text-[9px] font-black uppercase">${isOpen ? 'Open' : 'Closed'}</div></div><div class="flex justify-between bg-black/30 p-2.5 rounded-xl border border-white/5 pointer-events-none"><div><p class="text-[8px] text-zinc-500 uppercase font-bold">Test</p><p class="text-[10px] font-bold text-white">${uni.Test}</p></div><div class="text-right"><p class="text-[8px] text-zinc-500 uppercase font-bold">Deadline</p><p class="text-[10px] font-bold ${isOpen ? 'text-blue-400' : 'text-red-400'}">${dStr}</p></div></div>${applyBtnHtml}`;
        grid.appendChild(card);
    });
}

// ===========================
// APPLICATION TRACKING
// ===========================
window.toggleApply = function(acronym, event) {
    if(event) event.stopPropagation();
    const key = `uniGateway_applied_${window.currentUserId || 'guest'}`;
    let applied = JSON.parse(localStorage.getItem(key) || '[]');
    const isApplied = applied.includes(acronym);
    
    if (isApplied) {
        applied = applied.filter(a => a !== acronym);
    } else {
        applied.push(acronym);
    }
    localStorage.setItem(key, JSON.stringify(applied));
    
    const btn = document.getElementById(`apply-btn-${acronym}`);
    if (btn) {
        if (!isApplied) { // Now it's applied
            btn.innerHTML = `<i class="fa-solid fa-check-circle"></i> Applied`;
            btn.className = "mt-3 w-full py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-1";
        } else {
            btn.innerHTML = `Apply Compulsory? <span class="text-blue-400 ml-1">Click Yes</span>`;
            btn.className = "mt-3 w-full py-2 bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold rounded-xl transition-all flex justify-center items-center";
        }
    }
    
    if (document.getElementById('view-dashboard') && document.getElementById('view-dashboard').classList.contains('page-active')) {
        if (typeof renderDashboard === 'function') renderDashboard();
    }
}

// ===========================
// FILTERS
// ===========================
function openFilterSheet() { document.getElementById('sheetOverlay').classList.add('open'); document.getElementById('filterSheet').classList.add('open'); }
function closeAllSheets() { document.getElementById('sheetOverlay').classList.remove('open'); document.getElementById('filterSheet').classList.remove('open'); document.getElementById('uniSheet').classList.remove('open'); }
function populateFilterSheet(data) {
    const cities = new Set();
    data.forEach(uni => { if (uni.City) cities.add(uni.City.trim()); });
    const grid = document.getElementById('cityGrid');
    grid.innerHTML = `<button onclick="setFilterCity('all')" class="filter-btn active w-full" id="btn-city-all">All</button>`;
    Array.from(cities).sort().forEach(city => { const btn = document.createElement('button'); btn.className = 'filter-btn w-full truncate'; btn.innerText = city; btn.id = `btn-city-${city.replace(/\s+/g, '')}`; btn.onclick = () => setFilterCity(city); grid.appendChild(btn); });
}
function setFilterType(type) { currentFilterType = type; document.querySelectorAll('[id^="btn-type-"]').forEach(b => b.classList.remove('active')); document.getElementById(type === 'all' ? 'btn-type-all' : `btn-type-${type.toLowerCase()}`).classList.add('active'); }
function setFilterCity(city) { currentFilterCity = city; document.querySelectorAll('#cityGrid .filter-btn').forEach(b => b.classList.remove('active')); const targetId = city === 'all' ? 'btn-city-all' : `btn-city-${city.replace(/\s+/g, '')}`; const targetBtn = document.getElementById(targetId); if (targetBtn) targetBtn.classList.add('active'); }
function applyFilters() { filterUniversities(); closeAllSheets(); }
function clearFilters() { setFilterType('all'); setFilterCity('all'); applyFilters(); }
function updateActiveFilterLabels() {
    const cityLabel = document.getElementById('activeCityLabel'); const typeLabel = document.getElementById('activeTypeLabel'); const container = document.getElementById('activeFilters');
    if (currentFilterCity === 'all' && currentFilterType === 'all') { container.classList.add('hidden'); }
    else { container.classList.remove('hidden'); cityLabel.innerText = currentFilterCity === 'all' ? 'All Cities' : currentFilterCity; typeLabel.innerText = currentFilterType === 'all' ? 'All Types' : currentFilterType; cityLabel.classList.toggle('hidden', currentFilterCity === 'all'); typeLabel.classList.toggle('hidden', currentFilterType === 'all'); }
}
function filterUniversities() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allData.filter(uni => { const a = (uni.Acronym || '').toLowerCase(); const n = (uni.Name || '').toLowerCase(); const t = (uni.Type || '').toLowerCase(); return (a.includes(search) || n.includes(search)) && (currentFilterType === 'all' || t === currentFilterType.toLowerCase()) && (currentFilterCity === 'all' || uni.City === currentFilterCity); });
    renderHome(filtered); updateActiveFilterLabels();
}

// ===========================
// CALCULATOR
// ===========================
const FORMULAS = {
    "default": { m: 10, f: 40, t: 50, testTotal: 100, name: "Standard Formula" },
    "NUST": { m: 10, f: 15, t: 75, testTotal: 200, name: "NUST (NET)" },
    "FAST": { m: 10, f: 40, t: 50, testTotal: 100, name: "FAST (NU)" },
    "COMSATS": { m: 10, f: 40, t: 50, testTotal: 100, name: "COMSATS (NTS)" },
    "UET": { m: 0, f: 70, t: 30, testTotal: 400, name: "UET (ECAT)" },
    "GIKI": { m: 5, f: 10, t: 85, testTotal: 200, name: "GIKI (Entry Test)" },
    "PIEAS": { m: 15, f: 25, t: 60, testTotal: 100, name: "PIEAS" },
    "NED": { m: 10, f: 40, t: 50, testTotal: 100, name: "NED University" },
    "MDCAT": { m: 10, f: 40, t: 50, testTotal: 200, name: "Medical (MDCAT/UHS)" },
    "NTS_NAT": { m: 10, f: 40, t: 50, testTotal: 100, name: "NTS NAT (General)" },
    "PU": { m: 25, f: 75, t: 0, testTotal: 100, name: "Punjab University (Open)" },
    "Air": { m: 15, f: 35, t: 50, testTotal: 100, name: "Air University" },
    "Bahria": { m: 10, f: 40, t: 50, testTotal: 100, name: "Bahria University" },
    "Mehran": { m: 10, f: 60, t: 30, testTotal: 100, name: "Mehran UET" },
    "Sindh": { m: 10, f: 30, t: 60, testTotal: 100, name: "Sindh University" }
};
let currentFormula = FORMULAS["default"];
function openUniSheet() { document.getElementById('sheetOverlay').classList.add('open'); document.getElementById('uniSheet').classList.add('open'); }
function renderSheetList() { const list = document.getElementById('sheetList'); list.innerHTML = ""; Object.keys(FORMULAS).forEach(key => { const item = document.createElement('div'); item.className = "p-4 rounded-xl hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors"; item.onclick = () => selectUni(key); item.innerHTML = `<div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">${key.substring(0, 1)}</div><span class="font-bold text-white">${FORMULAS[key].name}</span>`; list.appendChild(item); }); }
function filterSheetList() { const q = document.getElementById('sheetSearch').value.toLowerCase(); Array.from(document.getElementById('sheetList').children).forEach(item => { item.style.display = item.innerText.toLowerCase().includes(q) ? 'flex' : 'none'; }); }
function selectUni(key) { currentFormula = FORMULAS[key]; document.getElementById('selectedUniLabel').innerText = currentFormula.name; document.getElementById('wMatric').innerText = currentFormula.m + "%"; document.getElementById('wFsc').innerText = currentFormula.f + "%"; document.getElementById('wTest').innerText = currentFormula.t + "%"; document.getElementById('totalTest').value = currentFormula.testTotal; closeAllSheets(); }
function runCalculation() {
    const mObt = parseFloat(document.getElementById('calcMatric').value) || 0; const fObt = parseFloat(document.getElementById('calcFsc').value) || 0; const tObt = parseFloat(document.getElementById('calcTest').value) || 0;
    const mTot = parseFloat(document.getElementById('totalMatric').value) || 1100; const fTot = parseFloat(document.getElementById('totalFsc').value) || 1100; const tTot = parseFloat(document.getElementById('totalTest').value) || 100;
    if (mObt > mTot || fObt > fTot || tObt > tTot) { alert("Obtained marks cannot be greater than Total marks!"); return; }
    const agg = (((mObt / mTot) * 100) * (currentFormula.m / 100)) + (((fObt / fTot) * 100) * (currentFormula.f / 100)) + (((tObt / tTot) * 100) * (currentFormula.t / 100));
    const circle = document.getElementById('progressRing'); const radius = circle.r.baseVal.value; const circumference = radius * 2 * Math.PI; circle.style.strokeDashoffset = circumference - (agg / 100) * circumference;
    document.getElementById('aggDisplay').innerHTML = `${agg.toFixed(2)}<span class="text-xl">%</span>`;
    localStorage.setItem(`uniGateway_${window.currentUserId || 'guest'}_calcData`, JSON.stringify({ matricObt: mObt, fscObt: fObt, testObt: tObt, matricTot: mTot, fscTot: fTot, testTot: tTot, aggregate: agg.toFixed(2) }));
}
function loadUserCalculatorData() { const savedData = localStorage.getItem(`uniGateway_${window.currentUserId || 'guest'}_calcData`); if (savedData) { const data = JSON.parse(savedData); document.getElementById('calcMatric').value = data.matricObt || ''; document.getElementById('calcFsc').value = data.fscObt || ''; document.getElementById('calcTest').value = data.testObt || ''; document.getElementById('totalMatric').value = data.matricTot || 1100; document.getElementById('totalFsc').value = data.fscTot || 1100; document.getElementById('totalTest').value = data.testTot || 100; if (data.aggregate) { const circle = document.getElementById('progressRing'); const radius = circle.r.baseVal.value; const circ = radius * 2 * Math.PI; circle.style.strokeDashoffset = circ - (data.aggregate / 100) * circ; document.getElementById('aggDisplay').innerHTML = `${data.aggregate}<span class="text-xl">%</span>`; } } }

// ===========================
// FEEDBACK
// ===========================
async function sendFeedback() {
    const subject = document.getElementById('fbSubject').value;
    const message = document.getElementById('fbMessage').value.trim();

    if (!message) {
        alert("Please enter a message before sending.");
        return;
    }

    if (message.length > 2000) {
        alert("Message is too long. Please keep it under 2000 characters.");
        return;
    }

    const lastFeedbackTime = localStorage.getItem('lastFeedbackTime');
    if (lastFeedbackTime) {
        const elapsed = Date.now() - parseInt(lastFeedbackTime);
        if (elapsed < 5 * 60 * 1000) { // 5 minutes cooldown
            alert("Please wait 5 minutes before submitting more feedback to prevent spam.");
            return;
        }
    }

    const btn = document.querySelector('button[onclick="sendFeedback()"]');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        if (!window._db || !window._fsAddDoc) {
            throw new Error("Database connection not ready. Please wait a moment and try again.");
        }

        await window._fsAddDoc(window._fsCollection(window._db, "feedback"), {
            subject: subject,
            message: message,
            createdAt: window._fsServerTimestamp(),
            userId: window.currentUserId || 'guest',
            source: 'web'
        });

        localStorage.setItem('lastFeedbackTime', Date.now().toString());

        alert("Feedback Sent Successfully!");
        document.getElementById('fbMessage').value = "";
    } catch (e) {
        console.error("Feedback Error:", e);
        alert(e.message || "Error sending feedback. Please try again.");
    } finally {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = original;
    }
}

function setFeedbackTopic(topic, btnElement) {
    document.getElementById('fbSubject').value = topic;
    // Remove active class from all pills
    document.querySelectorAll('.fb-pill').forEach(btn => btn.classList.remove('active', 'ring-2', 'ring-offset-2', 'ring-offset-black', 'ring-blue-500'));
    // Add active styles to clicked pill
    if (btnElement) {
        btnElement.classList.add('active', 'ring-2', 'ring-offset-2', 'ring-offset-black', 'ring-blue-500');
    }
}

// ===========================
// DETAIL MODAL & UTILS
// ===========================
function openDetail(u, d, o) { document.getElementById('dAcronym').innerText = u.Acronym; document.getElementById('dName').innerText = u.Name; document.getElementById('dTest').innerText = u.Test; document.getElementById('dDeadline').innerText = d; const btn = document.getElementById('dLink'); if (o) { btn.href = u.Link; btn.innerText = "Apply Now"; btn.className = "block w-full py-4 mt-6 bg-white text-black text-center font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"; btn.style.pointerEvents = "auto"; btn.style.opacity = "1"; } else { btn.href = "#"; btn.innerText = "Admissions Closed"; btn.className = "block w-full py-4 mt-6 bg-zinc-800 text-zinc-500 text-center font-bold rounded-2xl"; btn.style.pointerEvents = "none"; btn.style.opacity = "0.7"; } document.getElementById('detailModal').classList.remove('hidden'); }
function closeDetail() { document.getElementById('detailModal').classList.add('hidden'); }

function escapeHtml(text) { if (!text) return ""; return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

// ===========================
// AI HELPER (shared)
// ===========================
async function callGroqAPI(prompt, maxTokens = 1000) {
    // Safety: truncate extremely long prompts to prevent 413 errors
    const MAX_PROMPT_LENGTH = 4000;
    let safePrompt = prompt.length > MAX_PROMPT_LENGTH ? prompt.substring(0, MAX_PROMPT_LENGTH) + '\n[Content truncated for size]' : prompt;
    const safeMaxTokens = Math.min(maxTokens, 3500);

    const makeRequest = async (p, tokens) => {
        return await fetch("/api/ai/quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: p,
                max_tokens: tokens
            })
        });
    };

    let response = await makeRequest(safePrompt, safeMaxTokens);

    // If 413 (Payload Too Large), retry with aggressively truncated prompt
    if (response.status === 413) {
        console.warn('API 413: Payload too large. Retrying with smaller prompt...');
        safePrompt = safePrompt.substring(0, 1500) + '\n[Content truncated for size]';
        response = await makeRequest(safePrompt, Math.min(safeMaxTokens, 2000));
    }

    // If 429 (Rate Limited), wait and retry up to 2 times
    if (response.status === 429) {
        for (let retry = 1; retry <= 2; retry++) {
            console.warn(`API 429: Rate limited. Waiting ${retry * 3}s before retry ${retry}...`);
            await new Promise(r => setTimeout(r, retry * 3000));
            response = await makeRequest(safePrompt, safeMaxTokens);
            if (response.status !== 429) break;
        }
    }

    if (!response.ok) {
        const statusMessages = {
            400: 'Bad request — check your input',
            401: 'Invalid API key',
            413: 'Content too large — try a shorter document or fewer questions',
            429: 'Rate limited — wait a moment and try again',
            500: 'API server error — try again later'
        };
        throw new Error(statusMessages[response.status] || `API Error: ${response.status}`);
    }
    const data = await response.json();
    return data.content;
}

function cleanJSON(text) {
    text = text.trim();
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Find the JSON array/object boundaries
    const first = text.indexOf('[') !== -1 && (text.indexOf('{') === -1 || text.indexOf('[') < text.indexOf('{')) ? '[' : '{';
    const last = first === '[' ? ']' : '}';
    const start = text.indexOf(first);
    let end = text.lastIndexOf(last);

    if (start === -1) return text;
    if (start !== -1 && end > start) {
        text = text.substring(start, end + 1);
    } else {
        // JSON is truncated (no closing bracket) — try to repair it
        text = text.substring(start);
    }

    // Try parsing as-is first
    try { JSON.parse(text); return text; } catch (e) { /* needs repair */ }

    // Repair truncated JSON: find the last complete object in the array
    if (first === '[') {
        // Find all complete JSON objects {...} in the array
        let depth = 0, inString = false, escape = false;
        let lastCompleteObj = -1;

        for (let i = 1; i < text.length; i++) {
            const ch = text[i];
            if (escape) { escape = false; continue; }
            if (ch === '\\') { escape = true; continue; }
            if (ch === '"') { inString = !inString; continue; }
            if (inString) continue;
            if (ch === '{') depth++;
            if (ch === '}') { depth--; if (depth === 0) lastCompleteObj = i; }
        }

        if (lastCompleteObj > 0) {
            text = text.substring(0, lastCompleteObj + 1) + ']';
            // Remove any trailing comma before the ]
            text = text.replace(/,\s*\]$/, ']');
            try { JSON.parse(text); return text; } catch (e) { /* still broken */ }
        }
    }

    // Last resort: try adding closing brackets
    let repaired = text;
    if (!repaired.endsWith(']') && first === '[') {
        // Remove any incomplete trailing object
        const lastCloseBrace = repaired.lastIndexOf('}');
        if (lastCloseBrace > 0) {
            repaired = repaired.substring(0, lastCloseBrace + 1) + ']';
            repaired = repaired.replace(/,\s*\]$/, ']');
        }
    }
    try { JSON.parse(repaired); return repaired; } catch (e) { /* give up, return best effort */ }

    return repaired;
}

// ===========================
// NORMALIZE QUIZ QUESTIONS (shared)
// ===========================
function normalizeQuestions(questions) {
    const LETTERS = ['A', 'B', 'C', 'D'];
    return questions.filter(q => q && q.q && Array.isArray(q.o) && q.o.length >= 2).map(q => {
        const opts = q.o.map(o => (o || '').toString().trim()).filter(o => o.length > 0);
        const ans = (q.a || '').toString().trim();
        // Try exact, then case-insensitive, then partial match
        let ci = opts.findIndex(o => o === ans);
        if (ci === -1) ci = opts.findIndex(o => o.toLowerCase() === ans.toLowerCase());
        if (ci === -1) ci = opts.findIndex(o => { const a = ans.toLowerCase(), b = o.toLowerCase(); return a.length > 3 && (b.includes(a) || a.includes(b)); });
        // If still no match, splice correct answer in at position 1 (not first to avoid obvious pattern)
        if (ci === -1 && ans) { opts.splice(Math.min(1, opts.length), 0, ans); ci = Math.min(1, opts.length - 1); }
        while (opts.length < 4) opts.push('—');
        const finalOpts = opts.slice(0, 4);
        if (ci >= 4) ci = finalOpts.indexOf(ans) !== -1 ? finalOpts.indexOf(ans) : 0;
        return { ...q, o: finalOpts, correctIndex: ci };
    });
}
