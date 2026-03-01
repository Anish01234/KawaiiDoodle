// All 7 fixes: real-time updates, foreground refresh, scroll preservation
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'app.js');
let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// ─── FIX 1 & 2: subscribeToDoodles + appStateChange ────────────────────────
// Replace subscribeToDoodles body: surgical update instead of renderView()
// Also replace the appStateChange listener to add foreground refresh

const OLD_APP_STATE = `            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                this.enableFullscreenMode();
                window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) setTimeout(() => this.enableFullscreenMode(), 500);
                });
            }`;

const NEW_APP_STATE = `            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                this.enableFullscreenMode();
                window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) {
                        setTimeout(() => this.enableFullscreenMode(), 500);
                        // Silent refresh on foreground — like a messaging app
                        if (this.state.session) {
                            this.loadHistory(true);
                        }
                    }
                });
            }`;

if (!src.includes(OLD_APP_STATE)) { console.error('FIX2: appStateChange target not found'); process.exit(1); }
src = src.replace(OLD_APP_STATE, NEW_APP_STATE);
console.log('✅ Fix 2: appStateChange now triggers silent refresh on foreground');

// Fix subscribeToDoodles — replace renderView() with surgical DOM update
const OLD_SUB = `                console.log('🌈 New Magic Received!', payload);
                this.state.lastDoodle = payload.new.image_data;
                this.toast('New doodle from a friend! 💖', 'pink');

                // Auto-set wallpaper via smart logic
                this.setSmartWallpaper(payload.new);

                if (this.state.view === 'home' || this.state.view === 'widget') this.renderView();`;

const NEW_SUB = `                console.log('🌈 New Magic Received!', payload);
                this.state.lastDoodle = payload.new.image_data;

                // Only show toast if doodle is TO me (not from me)
                if (payload.new.receiver_id === this.state.session?.user?.id ||
                    (payload.new.isGroup && payload.new.recipients?.includes(this.state.session?.user?.id))) {
                    this.toast('New doodle from a friend! 💖', 'pink');
                }

                // Instant lock screen via Realtime (no 30s poll wait)
                this.setSmartWallpaper(payload.new);

                // Surgical home update — never call renderView() (causes flicker)
                if (this.state.view === 'home' || this.state.view === 'widget') {
                    const img = document.getElementById('home-latest-doodle');
                    if (img && payload.new.image_data) img.src = payload.new.image_data;
                    const badge = document.getElementById('home-unread-badge');
                    if (badge) {
                        const newCount = (this.state.unreadCount || 0) + 1;
                        this.state.unreadCount = newCount;
                        badge.textContent = newCount > 0 ? newCount + ' new 💌' : '';
                        badge.className = newCount > 0 ? 'text-xs font-bold text-white bg-pink-400 px-2 py-0.5 rounded-full' : '';
                    }
                }
                // Silent load to merge new item into history state
                this.loadHistory(true);`;

if (!src.includes(OLD_SUB)) { console.error('FIX1: subscribeToDoodles target not found'); process.exit(1); }
src = src.replace(OLD_SUB, NEW_SUB);
console.log('✅ Fix 1: subscribeToDoodles is now surgical (no renderView, instant lock screen)');

// ─── FIX 3 & 7: setView — home re-nav refresh + history first-visit guard ──
const OLD_SET_VIEW_GUARD = `    setView(viewName) {
        if (this.state.view === viewName) return; // Prevent reset if already on view`;

const NEW_SET_VIEW_GUARD = `    setView(viewName) {
        const alreadyOnView = this.state.view === viewName;
        // For home: allow re-nav to silently refresh instead of blocking
        if (alreadyOnView && viewName !== 'home') return;`;

if (!src.includes(OLD_SET_VIEW_GUARD)) { console.error('FIX3: setView guard target not found'); process.exit(1); }
src = src.replace(OLD_SET_VIEW_GUARD, NEW_SET_VIEW_GUARD);
console.log('✅ Fix 3: setView — home re-nav allowed through for silent refresh');

// Fix the history setView block to be smart about first vs re-visit
const OLD_HISTORY_VIEW = `            if (viewName === 'history') {
                if (this.state.unreadCount > 0) {
                    this.markAllRead();
                }
                this.loadHistory();
            }`;

const NEW_HISTORY_VIEW = `            if (viewName === 'history') {
                if (this.state.unreadCount > 0) {
                    this.markAllRead();
                }
                // First visit: full load. Re-visit: silent check only (preserve scroll)
                const firstVisit = !this._historyLoaded;
                this._historyLoaded = true;
                this.loadHistory(firstVisit ? false : true);
            }
            // Home re-nav: silent refresh only (already rendered, just update data)
            if (viewName === 'home' && alreadyOnView) {
                this.loadHistory(true);
                return;
            }`;

if (!src.includes(OLD_HISTORY_VIEW)) { console.error('FIX7: history setView target not found'); process.exit(1); }
src = src.replace(OLD_HISTORY_VIEW, NEW_HISTORY_VIEW);
console.log('✅ Fix 7: setView(history) — first visit full-load, re-visit silent');

// ─── FIX 4: setupHistoryInfiniteScroll — sentinel node caching ─────────────
const OLD_HIST_SCROLL = `    setupHistoryInfiniteScroll() {
        if (this._historyObserver) {
            this._historyObserver.disconnect();
            this._historyObserver = null;
        }
        const sentinel = document.getElementById('history-scroll-sentinel');
        if (!sentinel) return;
        this._historyObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && App.state.hasMoreHistory && !App.state.isLoadingHistory) {
                App.loadMoreHistory();
            }
        }, { threshold: 0.1 });
        this._historyObserver.observe(sentinel);
        // Fire immediately if sentinel is already in view (user scrolled before load finished)
        const rect = sentinel.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView && App.state.hasMoreHistory && !App.state.isLoadingHistory) {
            App.loadMoreHistory();
        }
    },`;

const NEW_HIST_SCROLL = `    setupHistoryInfiniteScroll() {
        const sentinel = document.getElementById('history-scroll-sentinel');
        if (!sentinel) return;
        // Skip re-wire if we're already observing this exact sentinel node (prevents flicker)
        if (this._historySentinelNode === sentinel && this._historyObserver) return;
        if (this._historyObserver) this._historyObserver.disconnect();
        this._historySentinelNode = sentinel;
        this._historyObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && App.state.hasMoreHistory && !App.state.isLoadingHistory) {
                App.loadMoreHistory();
            }
        }, { threshold: 0.1 });
        this._historyObserver.observe(sentinel);
        // Fire immediately if already in view
        const rect = sentinel.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0 && App.state.hasMoreHistory && !App.state.isLoadingHistory) {
            App.loadMoreHistory();
        }
    },`;

if (!src.includes(OLD_HIST_SCROLL)) { console.error('FIX4: setupHistoryInfiniteScroll target not found'); process.exit(1); }
src = src.replace(OLD_HIST_SCROLL, NEW_HIST_SCROLL);
console.log('✅ Fix 4: setupHistoryInfiniteScroll — sentinel caching (no flicker on re-wire)');

// ─── FIX 5: loadMoreDrafts — save scroll before loading ────────────────────
const OLD_LOAD_MORE_DRAFTS = `    async loadMoreDrafts(btn) {
        if (btn && typeof btn === 'object') btn.innerHTML = '<i data-lucide="loader" class="animate-spin w-3 h-3 inline"></i> Loading...';
        this.state.draftsOffset += 5;
        await this.loadHistory(true, true);
    },`;

const NEW_LOAD_MORE_DRAFTS = `    async loadMoreDrafts(btn) {
        if (btn && typeof btn === 'object') btn.innerHTML = '<i data-lucide="loader" class="animate-spin w-3 h-3 inline"></i> Loading...';
        // Save scroll position BEFORE loading so updateDraftsDOM can restore it
        const scrollRow = document.getElementById('sketchbook-scroll-row');
        if (scrollRow) this._savedDraftScroll = scrollRow.scrollLeft;
        this.state.draftsOffset += 5;
        await this.loadHistory(true, true);
    },`;

if (!src.includes(OLD_LOAD_MORE_DRAFTS)) { console.error('FIX5: loadMoreDrafts target not found'); process.exit(1); }
src = src.replace(OLD_LOAD_MORE_DRAFTS, NEW_LOAD_MORE_DRAFTS);
console.log('✅ Fix 5: loadMoreDrafts saves scrollLeft before load');

// ─── FIX 5b: updateDraftsDOM — restore scroll after append ─────────────────
// Find the append-only section and add scroll restore after new cards are appended
const OLD_ICONS_NEEDED = `        if (iconsNeeded && window.lucide) lucide.createIcons();
    },

    updateHistoryDOM()`;

const NEW_ICONS_NEEDED = `        if (iconsNeeded && window.lucide) lucide.createIcons();

        // Restore scroll position after appending new cards (Fix: scroll reset on loadMore)
        if (this._savedDraftScroll !== undefined && scrollRow) {
            scrollRow.scrollLeft = this._savedDraftScroll;
            this._savedDraftScroll = undefined;
        }
    },

    updateHistoryDOM()`;

if (!src.includes(OLD_ICONS_NEEDED)) { console.error('FIX5b: updateDraftsDOM icon section not found'); process.exit(1); }
src = src.replace(OLD_ICONS_NEEDED, NEW_ICONS_NEEDED);
console.log('✅ Fix 5b: updateDraftsDOM restores scrollLeft after appending new cards');

// ─── FIX 6: setupDraftsInfiniteScroll — sentinel node caching ──────────────
const OLD_DRAFTS_SCROLL = `    setupDraftsInfiniteScroll() {
        if (this._draftsObserver) {
            this._draftsObserver.disconnect();
            this._draftsObserver = null;
        }
        const sentinel = document.getElementById('drafts-scroll-sentinel');
        const scrollRow = document.getElementById('sketchbook-scroll-row');
        if (!sentinel || !scrollRow) return;
        // Use the scroll row as the root so intersection fires on horizontal scroll
        this._draftsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && App.state.hasMoreDrafts && !App.state.isLoadingHistory) {
                App.loadMoreDrafts();
            }
        }, { root: scrollRow, threshold: 0.1 });
        this._draftsObserver.observe(sentinel);
    },`;

const NEW_DRAFTS_SCROLL = `    setupDraftsInfiniteScroll() {
        const sentinel = document.getElementById('drafts-scroll-sentinel');
        const scrollRow = document.getElementById('sketchbook-scroll-row');
        if (!sentinel || !scrollRow) return;
        // Skip re-wire if already observing this exact sentinel (prevents scroll jump)
        if (this._draftsSentinelNode === sentinel && this._draftsObserver) return;
        if (this._draftsObserver) this._draftsObserver.disconnect();
        this._draftsSentinelNode = sentinel;
        this._draftsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && App.state.hasMoreDrafts && !App.state.isLoadingHistory) {
                App.loadMoreDrafts();
            }
        }, { root: scrollRow, threshold: 0.1 });
        this._draftsObserver.observe(sentinel);
    },`;

if (!src.includes(OLD_DRAFTS_SCROLL)) { console.error('FIX6: setupDraftsInfiniteScroll target not found'); process.exit(1); }
src = src.replace(OLD_DRAFTS_SCROLL, NEW_DRAFTS_SCROLL);
console.log('✅ Fix 6: setupDraftsInfiniteScroll — sentinel caching (no scroll jump)');

// Write back with CRLF
fs.writeFileSync(filePath, src.replace(/\n/g, '\r\n'), 'utf8');
console.log('\n✅ All fixes applied to src/app.js');
