#!/usr/bin/env python3
"""
Patch app.js with three flicker/scroll fixes:
1. Home page silent polls: stop calling renderView(), only update badge
2. updateDraftsDOM: true append-only DOM (no innerHTML replacement after first render)
3. updateHistoryDOM: true append-only DOM (no innerHTML replacement after first render)
"""
import re, sys

with open('src/app.js', 'r', encoding='utf-8') as f:
    src = f.read()

# ─────────────────────────────────────────────────────────────────────────────
# FIX 1: Home silent poll — replace the innermost silent branch for home view
# ─────────────────────────────────────────────────────────────────────────────
old1 = """            // Intelligent Update for Home View to prevent flickering
            if (this.state.view === 'home') {
                if (silent) {
                    this.renderView();
                } else {
                    this.renderView();
                }
            } else if (this.state.view === 'history') {
                if (silent) {
                    this.updateHistoryDOM();
                    this.updateDraftsDOM(); // Manual update for drafts
                } else {
                    this.renderView();
                }
            }"""

new1 = """            // Intelligent Update: avoid full re-renders on silent background polls
            if (this.state.view === 'home') {
                if (silent) {
                    // Only update the unread badge — never destroy home DOM on a poll
                    const badge = document.getElementById('home-unread-badge');
                    if (badge) {
                        badge.textContent = newUnread > 0 ? `${newUnread} new 💌` : '';
                        badge.className = newUnread > 0
                            ? 'text-xs font-bold text-white bg-pink-400 px-2 py-0.5 rounded-full'
                            : '';
                    }
                } else {
                    this.renderView();
                }
            } else if (this.state.view === 'history') {
                if (silent) {
                    this.updateHistoryDOM();
                    this.updateDraftsDOM();
                } else {
                    this.renderView();
                }
            }"""

assert old1 in src, "FIX 1 target not found!"
src = src.replace(old1, new1, 1)
print("✅ Fix 1 applied: Home silent poll no longer calls renderView()")

# ─────────────────────────────────────────────────────────────────────────────
# FIX 2: updateDraftsDOM — replace full body with append-only version
# ─────────────────────────────────────────────────────────────────────────────
# Find the function start
drafts_start_marker = "    updateDraftsDOM() {"
drafts_end_marker = "\n    updateHistoryDOM() {"

di = src.index(drafts_start_marker)
de = src.index(drafts_end_marker, di)

old2 = src[di:de]

new2 = """    updateDraftsDOM() {
        const container = document.getElementById('drafts-section');
        if (!container) return;

        const drafts = App.state.drafts || [];
        if (drafts.length === 0) {
            container.innerHTML = '';
            this._renderedDraftIds = new Set();
            return;
        }

        if (!this._renderedDraftIds) this._renderedDraftIds = new Set();
        const scrollRow = document.getElementById('sketchbook-scroll-row');

        // First render: build entire structure fresh
        if (!scrollRow) {
            this._renderedDraftIds = new Set();
            const cardsHtml = drafts.map(d => {
                this._renderedDraftIds.add(d.id);
                return `<div class="bg-white p-2 rounded-xl shadow-sm relative shrink-0 w-32 snap-start">
                    <img src="${d.image_data}" class="w-full aspect-square object-contain rounded-lg bg-gray-50/50 border border-gray-100" />
                    <div class="absolute inset-0 flex items-center justify-center gap-1 bg-black/10 rounded-xl">
                        <button onclick="App.editDoodleFromUrl('${d.image_data}')" class="bg-white/90 text-blue-500 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>
                        <button onclick="App.deleteDraft('${d.id}')" class="bg-white/90 text-red-400 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                </div>`;
            }).join('');
            const sentinelHtml = App.state.hasMoreDrafts
                ? `<div id="drafts-scroll-sentinel" class="shrink-0 flex items-center justify-center w-10 h-full"><div class="w-4 h-4 border-2 border-blue-200 border-t-blue-400 rounded-full animate-spin"></div></div>`
                : '';
            container.innerHTML = `<div class="bg-blue-50/50 p-4 rounded-bubbly border border-blue-100">
                <h3 class="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2"><i data-lucide="book-heart" class="w-4 h-4"></i> My Sketchbook</h3>
                <div id="sketchbook-scroll-row" class="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x">${cardsHtml}${sentinelHtml}</div>
            </div>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Append-only: only add cards for IDs not yet in the DOM
        const sentinel = document.getElementById('drafts-scroll-sentinel');
        const newDrafts = drafts.filter(d => !this._renderedDraftIds.has(d.id));
        let iconsNeeded = false;

        newDrafts.forEach(d => {
            this._renderedDraftIds.add(d.id);
            const card = document.createElement('div');
            card.className = 'bg-white p-2 rounded-xl shadow-sm relative shrink-0 w-32 snap-start';
            card.innerHTML = `<img src="${d.image_data}" class="w-full aspect-square object-contain rounded-lg bg-gray-50/50 border border-gray-100" />
                <div class="absolute inset-0 flex items-center justify-center gap-1 bg-black/10 rounded-xl">
                    <button onclick="App.editDoodleFromUrl('${d.image_data}')" class="bg-white/90 text-blue-500 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>
                    <button onclick="App.deleteDraft('${d.id}')" class="bg-white/90 text-red-400 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>`;
            if (sentinel) scrollRow.insertBefore(card, sentinel);
            else scrollRow.appendChild(card);
            iconsNeeded = true;
        });

        // Manage sentinel visibility
        if (App.state.hasMoreDrafts && !sentinel) {
            const el = document.createElement('div');
            el.id = 'drafts-scroll-sentinel';
            el.className = 'shrink-0 flex items-center justify-center w-10 h-full';
            el.innerHTML = '<div class="w-4 h-4 border-2 border-blue-200 border-t-blue-400 rounded-full animate-spin"></div>';
            scrollRow.appendChild(el);
            iconsNeeded = true;
        } else if (!App.state.hasMoreDrafts && sentinel) {
            sentinel.remove();
        }

        if (iconsNeeded && window.lucide) lucide.createIcons();
    }"""

src = src[:di] + new2 + src[de:]
print("✅ Fix 2 applied: updateDraftsDOM is now append-only (no scroll reset)")

# ─────────────────────────────────────────────────────────────────────────────
# FIX 3: updateHistoryDOM — replace full body with append-only version
# ─────────────────────────────────────────────────────────────────────────────
hist_start_marker = "\n    updateHistoryDOM() {"
hist_end_marker = "\n    setupHistoryInfiniteScroll() {"

hi = src.index(hist_start_marker)
he = src.index(hist_end_marker, hi)

old3 = src[hi:he]

new3 = """
    updateHistoryDOM() {
        const container = document.getElementById('history-list-container');
        if (!container) return;

        // Skeleton shimmer on initial load (no items yet + actively loading)
        if (this.state.isLoadingHistory && this.state.history.length === 0) {
            container.innerHTML = `<div class="flex flex-col gap-3">${[1,2,3].map(() =>
                `<div class="bg-white/60 rounded-2xl shadow-md overflow-hidden animate-pulse">
                    <div class="w-full aspect-square bg-pink-100/50"></div>
                    <div class="px-3 py-2 flex items-center justify-between gap-2">
                        <div class="h-3 w-24 bg-pink-100 rounded-full"></div>
                        <div class="h-3 w-16 bg-gray-100 rounded-full"></div>
                    </div>
                </div>`).join('')}</div>`;
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
                const names = d.recipients.map(rid => {
                    const c = App.state.userCache?.[rid];
                    const fr = (Social?.friends || []).find(f => f.id === rid);
                    return c || (fr?.username) || rid.substring(0, 5) + '..';
                });
                label = `<span class="text-pink-400 font-bold">📤 To: ${names.join(', ')}</span>`;
            } else if (isSent) {
                label = `<span class="text-pink-400 font-bold">📤 To: ${name}</span>`;
            } else {
                const av = App.state.avatarCache?.[otherId];
                const avatar = av
                    ? `<img src="${av}" class="w-4 h-4 rounded-full object-cover shrink-0 border border-indigo-100">`
                    : `<span class="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><i data-lucide="user" class="w-2.5 h-2.5 text-indigo-400"></i></span>`;
                label = `<span class="text-indigo-400 font-bold flex items-center gap-1">${avatar} 📥 From: ${name}</span>`;
            }

            const ts = new Date(d.created_at);
            const dateStr = ts.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = ts.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            return `<div class="bg-white/90 rounded-2xl shadow-md overflow-hidden">
                <div class="relative">
                    <img src="${d.image_data}" class="w-full aspect-square object-contain bg-white" loading="lazy" />
                    <div class="absolute top-2 right-2 flex flex-col gap-1.5">
                        <button onclick="App.editDoodle('${d.image_data}')" class="bg-white/95 text-pink-500 p-2 rounded-full shadow-md transition-all hover:scale-110 active:scale-90"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>
                        <button onclick="App.setWallpaper('${d.image_data}', '${d.id}')" class="bg-white/95 text-blue-400 p-2 rounded-full shadow-md transition-all hover:scale-110 active:scale-90"><i data-lucide="smartphone" class="w-3.5 h-3.5"></i></button>
                    </div>
                </div>
                <div class="px-3 py-2 flex items-center justify-between gap-2">
                    <div class="text-[10px] flex items-center gap-1 min-w-0 truncate">${label}</div>
                    <div class="text-right shrink-0">
                        <div class="text-[9px] text-gray-400 font-medium">${dateStr}</div>
                        <div class="text-[9px] text-gray-300">${timeStr}</div>
                    </div>
                </div>
            </div>`;
        };

        if (this.state.history.length === 0) {
            container.innerHTML = `<p class="text-center text-white/60 py-20">No magic found yet... 🥺</p>`;
            this._renderedHistoryIds = new Set();
            return;
        }

        let cardsList = container.querySelector('.history-cards-list');
        const sentinel = document.getElementById('history-scroll-sentinel');
        const endMsg = container.querySelector('.history-end-msg');

        if (!cardsList) {
            // First render — build from scratch
            const newItems = this.state.history.filter(d => !this._renderedHistoryIds.has(d.id));
            newItems.forEach(d => this._renderedHistoryIds.add(d.id));
            const sentinelHtml = App.state.hasMoreHistory
                ? `<div id="history-scroll-sentinel" class="flex items-center justify-center py-6"><div class="w-5 h-5 border-2 border-pink-200 border-t-pink-400 rounded-full animate-spin"></div></div>`
                : `<p class="history-end-msg text-center text-white/40 text-xs py-6 italic">You've seen it all ✨</p>`;
            container.innerHTML = `<div class="history-cards-list flex flex-col gap-3">${newItems.map(renderCard).join('')}</div>${sentinelHtml}`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Append-only: only add items we haven't rendered yet
        const newItems = this.state.history.filter(d => !this._renderedHistoryIds.has(d.id));
        if (newItems.length === 0 && (!!sentinel === App.state.hasMoreHistory)) return;

        newItems.forEach(d => {
            this._renderedHistoryIds.add(d.id);
            cardsList.insertAdjacentHTML('beforeend', renderCard(d));
        });

        // Update sentinel/end-msg without touching existing cards
        if (App.state.hasMoreHistory) {
            if (!sentinel) container.insertAdjacentHTML('beforeend',
                `<div id="history-scroll-sentinel" class="flex items-center justify-center py-6"><div class="w-5 h-5 border-2 border-pink-200 border-t-pink-400 rounded-full animate-spin"></div></div>`);
            if (endMsg) endMsg.remove();
        } else {
            if (sentinel) sentinel.remove();
            if (!endMsg) container.insertAdjacentHTML('beforeend',
                `<p class="history-end-msg text-center text-white/40 text-xs py-6 italic">You've seen it all ✨</p>`);
        }

        if (newItems.length > 0 && window.lucide) lucide.createIcons();
    }"""

src = src[:hi] + new3 + src[he:]
print("✅ Fix 3 applied: updateHistoryDOM is now append-only (no flicker)")

with open('src/app.js', 'w', encoding='utf-8') as f:
    f.write(src)

print("✅ All patches written to src/app.js")
