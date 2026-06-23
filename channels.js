// ===========================
// CHANNELS (DISCORD-STYLE)
// ===========================
        const CHANNEL_DEFS = {
            general: { name: 'General', emoji: '💬', color: '#f59e0b', desc: 'Chat freely about anything — uni life, tips, memes', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
            ecat: { name: 'ECAT Prep', emoji: '⚡', color: '#ef4444', desc: 'Engineering entry test — share resources, ask doubts', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
            mdcat: { name: 'MDCAT', emoji: '🔬', color: '#10b981', desc: 'Medical entry test discussion — biology, chemistry, physics', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
            net: { name: 'NUST NET', emoji: '🚀', color: '#6366f1', desc: 'NUST entry test — questions, past papers, strategies', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' },
            cs: { name: 'CS Hub', emoji: '💻', color: '#0ea5e9', desc: 'Computer science students — coding, projects, career', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.3)' },
            scholarships: { name: 'Scholarships', emoji: '🏆', color: '#8b5cf6', desc: 'Share and find scholarship opportunities', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
            abroad: { name: 'Study Abroad', emoji: '🌍', color: '#06b6d4', desc: 'Studying outside Pakistan — visa, admissions, funding', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)' },
            motivation: { name: 'Motivation', emoji: '🔥', color: '#f97316', desc: 'Struggling? Come here for support and encouragement', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' }
        };

        // Avatar colors assigned based on userId hash
        const AVATAR_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'];
        function getAvatarColor(uid) {
            let hash = 0;
            for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
            return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
        }

        let currentChannel = 'general';
        let chUnsubscribe = null;
        let chAttachmentData = null; // {type:'image'|'file', data:base64|null, name:string, size:string, fileType:string}
        let chAttachMenuOpen = false;

        function switchChannel(channelId) {
            if (currentChannel === channelId && chUnsubscribe) return;
            currentChannel = channelId;

            // Update tab styles
            document.querySelectorAll('.ch-tab-btn').forEach(b => b.classList.remove('active'));
            const activeTab = document.getElementById(`chtab-${channelId}`);
            if (activeTab) activeTab.classList.add('active');

            // Update description bar
            const def = CHANNEL_DEFS[channelId];
            document.getElementById('chDescIcon').textContent = def.emoji;
            document.getElementById('chDescText').textContent = def.desc;
            document.getElementById('chInput').placeholder = `Message #${def.name.toLowerCase().replace(' ', '-')}...`;

            // Clear messages, show spinner
            const msgArea = document.getElementById('chMessages');
            msgArea.innerHTML = `<div id="chLoadingSpinner" class="flex items-center justify-center py-12">
            <div class="flex flex-col items-center gap-3">
                <div class="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-xs text-zinc-500">Loading messages...</p>
            </div>
        </div>`;

            // Unsubscribe previous listener
            if (chUnsubscribe) { chUnsubscribe(); chUnsubscribe = null; }

            // Subscribe to new channel
            subscribeToChannel(channelId);
        }

        function subscribeToChannel(channelId) {
            if (!window._db) {
                // Firestore not ready yet, retry
                setTimeout(() => subscribeToChannel(channelId), 800);
                return;
            }
            try {
                const q = window._fsQuery(
                    window._fsCollection(window._db, `channels/${channelId}/messages`),
                    window._fsOrderBy('timestamp', 'asc'),
                    window._fsLimit(250) // Increased to show more saved hub history
                );
                chUnsubscribe = window._fsOnSnapshot(q, (snapshot) => {
                    renderChannelMessages(snapshot, channelId);
                }, (err) => {
                    console.error('Channel error:', err);
                    showChError('Could not load messages. Check your connection.');
                });
            } catch (e) {
                setTimeout(() => subscribeToChannel(channelId), 1000);
            }
        }

        function renderChannelMessages(snapshot, channelId) {
            const msgArea = document.getElementById('chMessages');
            const wasAtBottom = msgArea.scrollHeight - msgArea.scrollTop - msgArea.clientHeight < 60;

            const myId = window.currentUserId || 'guest';
            const def = CHANNEL_DEFS[channelId];

            // 1. Inject Persistent Hub Welcome Banner at the top
            msgArea.innerHTML = `
        <div class="p-4 mb-4 rounded-2xl border mx-1 mt-2" style="background:${def.bg}; border-color:${def.border};">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center text-2xl shadow-inner">${def.emoji}</div>
                <div>
                    <h3 class="font-black text-white text-sm">Welcome to the ${def.name} Hub</h3>
                    <p class="text-[10px] text-white/70 mt-0.5">${def.desc}</p>
                </div>
            </div>
            <div class="mt-3 p-2.5 bg-black/20 rounded-xl flex items-start gap-2 border border-white/5">
                <i class="fa-solid fa-thumbtack text-[10px] mt-0.5" style="color:${def.color};"></i>
                <p class="text-[10px] text-white/80 leading-relaxed"><strong>Hub Rules:</strong> Keep communication strictly focused on this topic. Help fellow students, share resources, and be respectful.</p>
            </div>
        </div>`;

            if (snapshot.empty) {
                msgArea.innerHTML += `
            <div class="flex flex-col items-center justify-center py-10 text-center opacity-50">
                <p class="text-xs font-bold text-white mb-1">No messages yet</p>
                <p class="text-[10px] text-zinc-400">Start the conversation! 👋</p>
            </div>`;
                document.getElementById('chOnlineCount').textContent = '0 messages';
                return;
            }

            let lastDate = '';
            let msgCount = 0;
            snapshot.forEach((docSnap) => {
                const msg = { id: docSnap.id, ...docSnap.data() };
                msgCount++;

                // Day divider
                let dateStr = '';
                if (msg.timestamp?.toDate) {
                    const d = msg.timestamp.toDate();
                    dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
                    if (dateStr !== lastDate) {
                        const divider = document.createElement('div');
                        divider.className = 'ch-day-divider';
                        const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
                        divider.innerHTML = `<span>${dateStr === today ? 'Today' : dateStr}</span>`;
                        msgArea.appendChild(divider);
                        lastDate = dateStr;
                    }
                }

                const isOwn = msg.userId === myId;
                const row = document.createElement('div');
                row.className = `ch-msg-row ${isOwn ? 'own-msg' : ''}`;

                const avatarColor = getAvatarColor(msg.userId || 'x');
                const initials = (msg.userName || 'U').substring(0, 1).toUpperCase();
                const timeStr = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

                let bubbleContent = '';

                if (msg.type === 'image' && msg.imageData) {
                    bubbleContent = `
                <div class="ch-img-bubble" onclick="openChImageFull('${msg.imageData}')">
                    <img src="${msg.imageData}" alt="image" loading="lazy">
                </div>
                <div class="ch-meta ${isOwn ? 'text-right' : ''}">${timeStr}</div>`;
                } else if (msg.type === 'file') {
                    const fileIconMap = { pdf: 'fa-file-pdf text-red-400', doc: 'fa-file-word text-blue-400', docx: 'fa-file-word text-blue-400', ppt: 'fa-file-powerpoint text-orange-400', pptx: 'fa-file-powerpoint text-orange-400', xlsx: 'fa-file-excel text-green-400', xls: 'fa-file-excel text-green-400', txt: 'fa-file-lines text-zinc-400' };
                    const ext = (msg.fileName || '').split('.').pop().toLowerCase();
                    const iconClass = fileIconMap[ext] || 'fa-file text-zinc-400';
                    bubbleContent = `
                <div class="ch-file-bubble ${isOwn ? '' : 'ch-bubble'}" style="${isOwn ? 'background:linear-gradient(135deg,rgba(245,158,11,0.25),rgba(239,68,68,0.15));border:1px solid rgba(245,158,11,0.3);border-radius:12px;' : ''}">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(255,255,255,0.08);">
                        <i class="fa-solid ${iconClass} text-base"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-white truncate">${escapeHtml(msg.fileName || 'File')}</p>
                        <p class="text-[10px] text-zinc-500">${escapeHtml(msg.fileSize || '')} · ${ext.toUpperCase()}</p>
                    </div>
                </div>
                <div class="ch-meta ${isOwn ? 'text-right' : ''}">${timeStr}</div>`;
                } else {
                    bubbleContent = `
                <div class="ch-bubble">
                    <p class="text-xs text-white leading-relaxed">${escapeHtml(msg.text || '')}</p>
                </div>
                <div class="ch-meta ${isOwn ? 'text-right' : ''}">${timeStr}</div>`;
                }

                row.innerHTML = `
            <div class="ch-avatar flex-shrink-0" style="background:${avatarColor};">${initials}</div>
            <div class="flex-1 min-w-0 ${isOwn ? 'flex flex-col items-end' : ''}">
                <p class="ch-username" style="color:${avatarColor};">${isOwn ? 'You' : escapeHtml(msg.userName || 'Student')}</p>
                ${bubbleContent}
            </div>`;

                msgArea.appendChild(row);
            });

            document.getElementById('chOnlineCount').textContent = `${msgCount} message${msgCount !== 1 ? 's' : ''}`;
            document.getElementById('chMemberCount').textContent = `${msgCount} msgs`;

            if (wasAtBottom || msgArea.scrollTop === 0) {
                msgArea.scrollTop = msgArea.scrollHeight;
            }
        }

        function showChError(msg) {
            document.getElementById('chMessages').innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center">
            <i class="fa-solid fa-triangle-exclamation text-amber-500 text-3xl mb-3"></i>
            <p class="text-sm font-bold text-white mb-1">Connection Issue</p>
            <p class="text-xs text-zinc-500">${msg}</p>
            <button onclick="switchChannel(currentChannel)" class="mt-4 px-4 py-2 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/30 active:scale-95">Retry</button>
        </div>`;
        }

        async function sendChannelMessage() {
            const input = document.getElementById('chInput');
            const text = input.value.trim();
            const hasAttachment = chAttachmentData !== null;

            if (!text && !hasAttachment) return;
            if (!window._db) { alert('Still connecting... Please wait a moment.'); return; }
            if (!window.currentUserId) { alert('Please log in to send messages.'); return; }

            const myName = document.getElementById('displayUserName')?.textContent || 'Student';
            const btn = document.getElementById('chSendBtn');
            btn.style.opacity = '0.5';
            btn.disabled = true;
            input.value = '';
            input.style.height = 'auto';

            try {
                const msgData = {
                    userId: window.currentUserId,
                    userName: myName,
                    timestamp: window._fsServerTimestamp(),
                    type: 'text',
                    text: text || ''
                };

                if (hasAttachment) {
                    msgData.type = chAttachmentData.type;
                    if (chAttachmentData.type === 'image') {
                        msgData.imageData = chAttachmentData.data;
                        msgData.text = text || '';
                    } else if (chAttachmentData.type === 'file') {
                        msgData.fileName = chAttachmentData.name;
                        msgData.fileSize = chAttachmentData.size;
                        msgData.fileType = chAttachmentData.fileType;
                        msgData.text = text || '';
                    }
                }

                await window._fsAddDoc(
                    window._fsCollection(window._db, `channels/${currentChannel}/messages`),
                    msgData
                );

                clearChAttachment();
            } catch (err) {
                console.error('Send error:', err);
                alert('Failed to send message. Please try again.');
            } finally {
                btn.style.opacity = '1';
                btn.disabled = false;
            }
        }

        function handleChKeydown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChannelMessage();
            }
        }

        function autoResizeChInput(el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 90) + 'px';
        }

        function toggleChAttachMenu() {
            chAttachMenuOpen = !chAttachMenuOpen;
            document.getElementById('chAttachMenu').classList.toggle('hidden', !chAttachMenuOpen);
        }

        // Close attach menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#chAttachBtn') && !e.target.closest('#chAttachMenu')) {
                document.getElementById('chAttachMenu')?.classList.add('hidden');
                chAttachMenuOpen = false;
            }
        });

        async function handleChImageSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            document.getElementById('chAttachMenu').classList.add('hidden');
            chAttachMenuOpen = false;

            // Compress image
            const compressed = await compressImage(file, 400, 0.7);
            const sizeKB = Math.round(compressed.length * 0.75 / 1024);

            if (sizeKB > 800) {
                alert('Image too large after compression. Please use a smaller image.');
                event.target.value = '';
                return;
            }

            chAttachmentData = { type: 'image', data: compressed, name: file.name, size: `${sizeKB}KB` };

            document.getElementById('chImagePreview').classList.remove('hidden');
            document.getElementById('chFilePreview').classList.add('hidden');
            document.getElementById('chPreviewImg').src = compressed;
            document.getElementById('chPreviewName').textContent = file.name;
            document.getElementById('chPreviewSize').textContent = `${sizeKB}KB`;
            event.target.value = '';
        }

        function handleChFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            document.getElementById('chAttachMenu').classList.add('hidden');
            chAttachMenuOpen = false;

            const sizeKB = Math.round(file.size / 1024);
            const ext = file.name.split('.').pop().toLowerCase();

            chAttachmentData = { type: 'file', data: null, name: file.name, size: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB}KB`, fileType: ext };

            document.getElementById('chFilePreview').classList.remove('hidden');
            document.getElementById('chImagePreview').classList.add('hidden');
            document.getElementById('chFilePreviewName').textContent = file.name;
            document.getElementById('chFilePreviewSize').textContent = chAttachmentData.size;
            event.target.value = '';
        }

        function clearChAttachment() {
            chAttachmentData = null;
            document.getElementById('chImagePreview').classList.add('hidden');
            document.getElementById('chFilePreview').classList.add('hidden');
        }

        function compressImage(file, maxPx, quality) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let w = img.width, h = img.height;
                        if (w > maxPx || h > maxPx) {
                            if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
                            else { w = Math.round(w * maxPx / h); h = maxPx; }
                        }
                        canvas.width = w; canvas.height = h;
                        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // Full-screen image viewer
        function openChImageFull(src) {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:999;display:flex;align-items:center;justify-content:center;';
            overlay.onclick = () => overlay.remove();
            const img = document.createElement('img');
            img.src = src;
            img.style.cssText = 'max-width:95vw;max-height:90vh;object-fit:contain;border-radius:12px;';
            overlay.appendChild(img);
            document.body.appendChild(overlay);
        }

