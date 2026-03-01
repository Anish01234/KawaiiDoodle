// Patch app.js: all three flicker/scroll fixes
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app.js');
const rawBytes = fs.readFileSync(filePath, 'utf8');
// Normalize to LF for easier string matching; we'll write back as-is via restore
const hasCRLF = rawBytes.includes('\r\n');
let src = rawBytes.replace(/\r\n/g, '\n');

// ─── FIX 1: Home silent poll — no renderView() ──────────────────────────────
const F1_OLD = '            // Intelligent Update for Home View to prevent flickering\n            if (this.state.view === \'home\') {\n                if (silent) {\n                    this.renderView();\n                } else {\n                    this.renderView();\n                }\n            } else if (this.state.view === \'history\') {\n                if (silent) {\n                    this.updateHomeViewHomeView();\n                    this.updateDraftView(); // Manual update for drafts\n                } else {\n                    this.renderView();\n                }\n            }';

const F1_NEW = '            // No full re-render on silent polls — only surgical badge update\n            if (this.state.view === \'home\') {\n                if (silent) {\n                    const badge = document.getElementById(\'home-unread-badge\');\n                    if (badge) {\n                        badge.textContent = newUnread > 0 ? newUnread + \' new 💌\' : \'\';\n                        badge.className = newUnread > 0 ? \'text-xs font-bold text-white bg-pink-400 px-2 py-0.5 rounded-full\' : \'\';\n                    }\n                } else {\n                    this.renderView();\n                }\n            } else if (this.state.view === \'history\') {\n                if (silent) { this.updateHomeViewHomeView(); this.updateDraftView(); }\n                else { this.renderView(); }\n            }';

if (!src.includes(F1_OLD)) { console.error('❌ Fix1: target not found'); process.exit(1); }
src = src.replace(F1_OLD, F1_NEW);
console.log('✅ Fix1: home silent poll no longer calls renderView()');

// ─── FIX 2: updateDraftView — append-only ───────────────────────────────────
const DRAFTS_START = '    updateDraftView() {';
const DRAFTS_END = '\n    updateHomeViewHomeView() {';
const di = src.indexOf(DRAFTS_START);
const de = src.indexOf(DRAFTS_END, di);
if (di < 0 || de < 0) { console.error('❌ Fix2: markers not found'); process.exit(1); }

const F2_NEW = `    updateDraftView() {
        const container = document.getElementById('drafts-section');
        if (!container) return;
        const drafts = App.state.drafts || [];
        if (drafts.length === 0) { container.innerHTML = ''; this._renderedDraftIds = new Set(); return; }
        if (!this._renderedDraftIds) this._renderedDraftIds = new Set();
        const scrollRow = document.getElementById('sketchbook-scroll-row');

        if (!scrollRow) {
            // First render: build from scratch
            this._renderedDraftIds = new Set();
            const cardsHtml = drafts.map(d => {
                this._renderedDraftIds.add(d.id);
                return '<div class="bg-white p-2 rounded-xl shadow-sm relative shrink-0 w-32 snap-start">' +
                    '<img src="' + d.image_data + '" class="w-full aspect-square object-contain rounded-lg bg-gray-50/50 border border-gray-100" />' +
                    '<div class="absolute inset-0 flex items-center justify-center gap-1 bg-black/10 rounded-xl">' +
                    '<button onclick="App.editDoodleFromUrl(\\'' + d.image_data + '\\')" class="bg-white/90 text-blue-500 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>' +
                    '<button onclick="App.deleteDraft(\\'' + d.id + '\\')" class="bg-white/90 text-red-400 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>' +
                    '</div></div>';
            }).join('');
            const sentinelHtml = App.state.hasMoreDrafts
                ? '<div id="drafts-scroll-sentinel" class="shrink-0 flex items-center justify-center w-10 h-full"><div class="w-4 h-4 border-2 border-blue-200 border-t-blue-400 rounded-full animate-spin"></div></div>'
                : '';
            container.innerHTML = '<div class="bg-blue-50/50 p-4 rounded-bubbly border border-blue-100">' +
                '<h3 class="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2"><i data-lucide="book-heart" class="w-4 h-4"></i> My Sketchbook</h3>' +
                '<div id="sketchbook-scroll-row" class="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x">' + cardsHtml + sentinelHtml + '</div></div>';
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Append-only: only add new cards, never touch existing DOM
        const sentinel = document.getElementById('drafts-scroll-sentinel');
        const newDrafts = drafts.filter(d => !this._renderedDraftIds.has(d.id));
        let iconsNeeded = false;
        newDrafts.forEach(d => {
            this._renderedDraftIds.add(d.id);
            const card = document.createElement('div');
            card.className = 'bg-white p-2 rounded-xl shadow-sm relative shrink-0 w-32 snap-start';
            card.innerHTML = '<img src="' + d.image_data + '" class="w-full aspect-square object-contain rounded-lg bg-gray-50/50 border border-gray-100" />' +
                '<div class="absolute inset-0 flex items-center justify-center gap-1 bg-black/10 rounded-xl">' +
                '<button onclick="App.editDoodleFromUrl(\\'' + d.image_data + '\\')" class="bg-white/90 text-blue-500 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>' +
                '<button onclick="App.deleteDraft(\\'' + d.id + '\\')" class="bg-white/90 text-red-400 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>' +
                '</div>';
            if (sentinel) scrollRow.insertBefore(card, sentinel); else scrollRow.appendChild(card);
            iconsNeeded = true;
        });
        if (App.state.hasMoreDrafts && !sentinel) {
            const el = document.createElement('div');
            el.id = 'drafts-scroll-sentinel'; el.className = 'shrink-0 flex items-center justify-center w-10 h-full';
            el.innerHTML = '<div class="w-4 h-4 border-2 border-blue-200 border-t-blue-400 rounded-full animate-spin"></div>';
            scrollRow.appendChild(el); iconsNeeded = true;
        } else if (!App.state.hasMoreDrafts && sentinel) { sentinel.remove(); }
        if (iconsNeeded && window.lucide) lucide.createIcons();
    }`;

src = src.slice(0, di) + F2_NEW + src.slice(de);
console.log('✅ Fix2: updateDraftView append-only (no scroll reset)');

// ─── FIX 3: updateHomeViewHomeView — append-only ──────────────────────────────────
const HIST_START = '\n    updateHomeViewHomeView() {';
const HIST_END = '\n    setupHistoryInfiniteScroll() {';
const hi = src.indexOf(HIST_START);
const he = src.indexOf(HIST_END, hi);
if (hi < 0 || he < 0) { console.error('❌ Fix3: markers not found'); process.exit(1); }

const F3_NEW = `
    updateHomeViewHomeView() {
        const container = document.getElementById('history-list-container');
        if (!container) return;

        if (this.state.isLoadingHistory && this.state.history.length === 0) {
            container.innerHTML = '<div class="flex flex-col gap-3">' + [1,2,3].map(() =>
                '<div class="bg-white/60 rounded-2xl shadow-md overflow-hidden animate-pulse">' +
                '<div class="w-full aspect-square bg-pink-100/50"></div>' +
                '<div class="px-3 py-2 flex items-center justify-between gap-2">' +
                '<div class="h-3 w-24 bg-pink-100 rounded-full"></div>' +
                '<div class="h-3 w-16 bg-gray-100 rounded-full"></div></div></div>').join('') + '</div>';
            this._renderedHistoryIds = new Set();
            return;
        }

        if (!this._renderedHistoryIds) this._renderedHistoryIds = new Set();

        const renderCard = (d) => {
            const isSent = d.sender_id === App.state.session?.user?.id;
            const otherId = isSent ? d.receiver_id : d.sender_id;
            const cacheName = App.state.userCache?.[otherId];
            const friend = (Social?.friends || []).find(f => f.id === otherId);
            let name = cacheName || (friend?.username) || (otherId ? otherId.substring(0, 6) + '...' : '?');
            let label = '';
            if (d.isGroup && d.recipients?.length > 0) {
                const names = d.recipients.map(rid => { const c = App.state.userCache?.[rid]; const fr = (Social?.friends || []).find(f => f.id === rid); return c || (fr?.username) || rid.substring(0, 5) + '..'; });
                label = '<span class="text-pink-400 font-bold">📤 To: ' + names.join(', ') + '</span>';
            } else if (isSent) {
                label = '<span class="text-pink-400 font-bold">📤 To: ' + name + '</span>';
            } else {
                const av = App.state.avatarCache?.[otherId];
                const avatar = av ? '<img src="' + av + '" class="w-4 h-4 rounded-full object-cover shrink-0 border border-indigo-100">' : '<span class="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><i data-lucide="user" class="w-2.5 h-2.5 text-indigo-400"></i></span>';
                label = '<span class="text-indigo-400 font-bold flex items-center gap-1">' + avatar + ' 📥 From: ' + name + '</span>';
            }
            const ts = new Date(d.created_at);
            const dateStr = ts.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = ts.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            return '<div class="bg-white/90 rounded-2xl shadow-md overflow-hidden">' +
                '<div class="relative"><img src="' + d.image_data + '" class="w-full aspect-square object-contain bg-white" loading="lazy" />' +
                '<div class="absolute top-2 right-2 flex flex-col gap-1.5">' +
                '<button onclick="App.editDoodle(\\'' + d.image_data + '\\')" class="bg-white/95 text-pink-500 p-2 rounded-full shadow-md transition-all hover:scale-110 active:scale-90"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>' +
                '<button onclick="App.setWallpaper(\\'' + d.image_data + '\\', \\'' + d.id + '\\')" class="bg-white/95 text-blue-400 p-2 rounded-full shadow-md transition-all hover:scale-110 active:scale-90"><i data-lucide="smartphone" class="w-3.5 h-3.5"></i></button>' +
                '</div></div>' +
                '<div class="px-3 py-2 flex items-center justify-between gap-2">' +
                '<div class="text-[10px] flex items-center gap-1 min-w-0 truncate">' + label + '</div>' +
                '<div class="text-right shrink-0"><div class="text-[9px] text-gray-400 font-medium">' + dateStr + '</div>' +
                '<div class="text-[9px] text-gray-300">' + timeStr + '</div></div></div></div>';
        };

        if (this.state.history.length === 0) {
            container.innerHTML = '<p class="text-center text-white/60 py-20">No magic found yet... 🥺</p>';
            this._renderedHistoryIds = new Set(); return;
        }

        let cardsList = container.querySelector('.history-cards-list');
        const sentinel = document.getElementById('history-scroll-sentinel');
        const endMsg = container.querySelector('.history-end-msg');

        if (!cardsList) {
            const newItems = this.state.history.filter(d => !this._renderedHistoryIds.has(d.id));
            newItems.forEach(d => this._renderedHistoryIds.add(d.id));
            const sentinelHtml = App.state.hasMoreHistory
                ? '<div id="history-scroll-sentinel" class="flex items-center justify-center py-6"><div class="w-5 h-5 border-2 border-pink-200 border-t-pink-400 rounded-full animate-spin"></div></div>'
                : '<p class="history-end-msg text-center text-white/40 text-xs py-6 italic">You\\'ve seen it all ✨</p>';
            container.innerHTML = '<div class="history-cards-list flex flex-col gap-3">' + newItems.map(renderCard).join('') + '</div>' + sentinelHtml;
            if (window.lucide) lucide.createIcons();
            return;
        }

        const newItems = this.state.history.filter(d => !this._renderedHistoryIds.has(d.id));
        if (newItems.length === 0 && (!!sentinel === App.state.hasMoreHistory)) return;
        newItems.forEach(d => { this._renderedHistoryIds.add(d.id); cardsList.insertAdjacentHTML('beforeend', renderCard(d)); });

        if (App.state.hasMoreHistory) {
            if (!sentinel) container.insertAdjacentHTML('beforeend', '<div id="history-scroll-sentinel" class="flex items-center justify-center py-6"><div class="w-5 h-5 border-2 border-pink-200 border-t-pink-400 rounded-full animate-spin"></div></div>');
            if (endMsg) endMsg.remove();
        } else {
            if (sentinel) sentinel.remove();
            if (!endMsg) container.insertAdjacentHTML('beforeend', '<p class="history-end-msg text-center text-white/40 text-xs py-6 italic">You\\'ve seen it all ✨</p>');
        }
        if (newItems.length > 0 && window.lucide) lucide.createIcons();
    }`;

src = src.slice(0, hi) + F3_NEW + src.slice(he);
console.log('✅ Fix3: updateHomeViewHomeView append-only (no flicker)');

fs.writeFileSync(filePath, hasCRLF ? src.replace(/\n/g, '\r\n') : src, 'utf8');
console.log('✅ src/app.js patched successfully');
