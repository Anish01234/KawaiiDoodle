/**
 * Kawaii Doodle - App Controller
 */

const App = {
    state: {
        view: 'home',
        user: {
            username: localStorage.getItem('user-name') || '',
            kawaiiId: localStorage.getItem('user-id') || '',
            avatarUrl: localStorage.getItem('user-avatar') || ''
        },
        session: null,
        lastDoodle: null,
        history: [],
        activeRecipients: [],
        unreadCount: 0,
        supabase: null,
        config: {
            url: window.CONFIG?.SUPABASE_URL || localStorage.getItem('sb-url') || '',
            key: window.CONFIG?.SUPABASE_KEY || localStorage.getItem('sb-key') || ''
        },
        magicClickCount: 0,
        notificationsEnabled: false,
        bootLogs: [],
        previousView: null,
        isSending: false,
        isLoadingHistory: false,
        viewHistory: [],
        isCanvasDirty: false,
        lastBackPress: 0
    },

    enableDebugConsole() {
        if (window.consoleOverridden) return;
        window.consoleOverridden = true;

        // Track first user gesture so haptic() can safely call navigator.vibrate.
        // vibrate is blocked until interaction; this flag lets us skip it cleanly.
        if (!window._userHasGestured) {
            const markGesture = () => {
                window._userHasGestured = true;
                ['touchstart', 'pointerdown', 'click'].forEach(evt =>
                    document.removeEventListener(evt, markGesture, { capture: true })
                );
            };
            ['touchstart', 'pointerdown', 'click'].forEach(evt =>
                document.addEventListener(evt, markGesture, { once: true, capture: true, passive: true })
            );
        }

        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        // Restore previous logs if any
        try {
            const saved = localStorage.getItem('kawaii_crash_logs');
            if (saved) App.state.bootLogs = JSON.parse(saved);
        } catch (e) { console.warn("Log restore failed", e); }

        const append = (type, args) => {
            const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            const line = `[${new Date().toISOString().split('T')[1].split('.')[0]}] [${type}] ${msg}`;

            App.state.bootLogs.push(line);

            // Persistent Storage Logic (Rolling Buffer of 300 lines)
            if (App.state.bootLogs.length > 300) {
                App.state.bootLogs = App.state.bootLogs.slice(-300);
            }
            try {
                localStorage.setItem('kawaii_crash_logs', JSON.stringify(App.state.bootLogs));
            } catch (e) { /* Storage full or error */ }

            // Also update UI if visible
            const logEl = document.getElementById('boot-log');
            if (logEl) {
                logEl.innerHTML += `<div class="text-[10px] ${type === 'error' ? 'text-red-400' : 'text-green-300'} font-mono mb-1 border-b border-black/5 pb-1">> ${msg}</div>`;
                logEl.scrollTop = logEl.scrollHeight;
            }
        };

        console.log = (...args) => { originalLog.apply(console, args); append('log', args); };
        console.error = (...args) => { originalError.apply(console, args); append('error', args); };
        console.warn = (...args) => { originalWarn.apply(console, args); append('warn', args); };

        // Global Error Handlers
        window.onerror = function (msg, url, lineNo, columnNo, error) {
            const errorMsg = `🔥 Global Error: ${msg} at ${lineNo}:${columnNo}`;
            console.error(errorMsg, error ? error.stack : '');
            return false;
        };

        window.addEventListener('unhandledrejection', event => {
            console.error(`🔥 Unhandled Rejection: ${event.reason}`);
        });

        console.log("🐞 Debug Console Active (Persistent Mode + Global Catch)");
    },

    logBoot(msg) {
        console.log(msg);
        this.state.bootLogs.push(`> ${msg}`);
        const log = document.getElementById('boot-log');
        if (log) {
            log.innerHTML += `> ${msg}<br>`;
            log.scrollTop = log.scrollHeight;
        }
    },

    toggleReleaseNotes() {
        const modal = document.getElementById('release-notes-modal');
        if (modal) modal.classList.toggle('hidden');
    },

    handleMagicSequence() {
        this.state.magicClickCount++;
        if (this.state.magicClickCount >= 5) {
            const adminSettings = document.getElementById('admin-settings');
            if (adminSettings) {
                adminSettings.classList.toggle('hidden');
                this.toast(adminSettings.classList.contains('hidden') ? 'Magic settings hidden 🤫' : 'Magic settings revealed! ✨', 'blue');
            }
            this.state.magicClickCount = 0;
        }
        clearTimeout(this.magicTimeout);
        this.magicTimeout = setTimeout(() => this.state.magicClickCount = 0, 2000);
    },

    triggerEasterEgg(type) {
        this.toast(`Secret Found: ${type.toUpperCase()} MODE! 🥚✨`, 'pink');
        this.haptic('heavy');

        if (type === 'disco') {
            document.body.classList.add('disco-mode');
            // Play sound? (Optional)
        } else if (type === 'gravity') {
            document.body.classList.add('zero-gravity-mode');
        } else if (type === 'chaos') {
            document.body.classList.add('disco-mode', 'zero-gravity-mode');
        }

        // Auto-disable after 10 seconds to create urgency
        setTimeout(() => {
            document.body.classList.remove('disco-mode', 'zero-gravity-mode');
            this.toast('Matrix stabilizing... 🌀', 'blue');
        }, 8000);

        // Spawn massive sparkles
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createSparkle(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
            }, i * 50);
        }
    },


    // --- SAFETY NET ---
    async checkCriticalHealth() {
        try {
            const statusUrl = 'https://raw.githubusercontent.com/Anish01234/KawaiiDoodle/main/status.json';
            const response = await fetch(`${statusUrl}?t=${Date.now()}`);
            if (!response.ok) return;

            const status = await response.json();

            let currentVersion = '0.0.0';
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                const info = await window.Capacitor.Plugins.App.getInfo();
                currentVersion = info.version;
            } else {
                return;
            }

            const isBroken = (status.broken_versions || []).includes(currentVersion);
            const isTooOld = (v1, min) => {
                const p1 = v1.split('.').map(Number);
                const pMin = min.split('.').map(Number);
                for (let i = 0; i < Math.max(p1.length, pMin.length); i++) {
                    const n1 = p1[i] || 0;
                    const nMin = pMin[i] || 0;
                    if (n1 < nMin) return true;
                    if (n1 > nMin) return false;
                }
                return false;
            };

            const belowMinParam = status.min_supported_version && isTooOld(currentVersion, status.min_supported_version);

            if (isBroken || belowMinParam) {
                console.error("CRITICAL: App version blocked.", { currentVersion, status });
                document.body.innerHTML = `
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:#fff0f5; z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem; text-align:center;">
                    <h1 style="font-size:2rem; color:#db2777; margin-bottom:1rem;">⚠️ Update Required</h1>
                    <p style="font-size:1.1rem; color:#4b5563; margin-bottom:2rem;">${status.critical_message || "This version is obsolete. Please update to continue sending magic!"}</p>
                    <button onclick="window.open('${status.force_update_url || 'https://github.com/Anish01234/KawaiiDoodle/releases'}', '_system')" 
                        style="background:#db2777; color:white; padding:1rem 2rem; border-radius:99px; font-weight:bold; font-size:1.2rem; border:none; box-shadow:0 4px 15px rgba(219, 39, 119, 0.3);">
                        Download Fix 🚀
                    </button>
                    <p style="margin-top:2rem; font-size:0.8rem; color:#9ca3af;">Installed: v${currentVersion}</p>
                </div>
                `;
            }
        } catch (e) {
            console.warn("Safety net check failed:", e);
        }
    },

    // Panic Button
    versionTaps: 0,
    versionTapTimer: null,
    handleVersionTap() {
        this.versionTaps++;
        if (this.versionTapTimer) clearTimeout(this.versionTapTimer);
        this.versionTapTimer = setTimeout(() => { this.versionTaps = 0; }, 1000);

        if (this.versionTaps >= 3) {
            this.toast('🚑 Panic Link Activated!', 'pink');
            window.open('https://github.com/Anish01234/KawaiiDoodle/releases', '_system');
            this.versionTaps = 0;
        }
    },

    async init() {
        console.log("🛠️ App.init() started");
        this.enableDebugConsole();
        this.checkCriticalHealth();
        this.logBoot("✨ Kawaii App Initializing v2.9.83...");

        try {
            // Check Force Offline
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('offline') === 'true') {
                this.toast('Offline Mode Active ✈️', 'blue');
                this.setView('landing');
                this.finalizeInit();
                return;
            }

            // Fullscreen
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                this.enableFullscreenMode();
                window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) setTimeout(() => this.enableFullscreenMode(), 500);
                });
            }

            // Bridge Redirect
            if (urlParams.get('redirect_to_app') === 'true') {
                window.location.href = 'io.kawaii.doodle://' + window.location.hash;
                return;
            }

            // Deep Links
            if (window.Capacitor && window.Capacitor.Plugins.App) {
                window.Capacitor.Plugins.App.addListener('appUrlOpen', async (data) => {
                    const url = new URL(data.url);
                    if (url.hash && url.hash.includes('access_token')) {
                        const { error } = await this.state.supabase.auth.setSession({
                            access_token: url.hash.split('access_token=')[1].split('&')[0],
                            refresh_token: url.hash.split('refresh_token=')[1].split('&')[0]
                        });
                        if (!error) window.location.reload();
                    }
                });
            }

            // Init Supabase
            this.initSupabase();

            // Check Session
            let session = null;
            if (this.state.supabase) {
                try {
                    const { data, error } = await this.state.supabase.auth.getSession();
                    if (!error) session = data.session;
                } catch (e) { console.warn("Session check error", e); }
            }

            this.state.session = session;

            if (session) {
                // Fetch Profile
                let profile = null;
                try {
                    const { data, error } = await this.state.supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    if (!error) profile = data;
                } catch (e) {
                    console.warn("Offline: Profile fetch failed", e);
                }

                // Fallback to LocalStorage if offline/error
                const localName = localStorage.getItem('user-name');
                const localId = localStorage.getItem('user-id');
                const localAvatar = localStorage.getItem('user-avatar');

                if (profile && profile.username && profile.kawaii_id) {
                    // Online / Fresh Data
                    this.state.user.username = profile.username;
                    this.state.user.kawaiiId = profile.kawaii_id;
                    this.state.user.avatarUrl = profile.avatar_url || localAvatar || '';

                    localStorage.setItem('user-name', profile.username);
                    localStorage.setItem('user-id', profile.kawaii_id);
                    if (this.state.user.avatarUrl) localStorage.setItem('user-avatar', this.state.user.avatarUrl);

                    this.loadAppData();
                    if (this.state.pendingDeepLink) {
                        const target = this.state.pendingDeepLink;
                        this.state.pendingDeepLink = null;
                        this.setView(target);
                    } else {
                        this.setView('home');
                    }
                } else if (localName && localId) {
                    // Offline Fallback
                    console.log("⚠️ Offline Mode: Using cached profile");
                    this.state.user.username = localName;
                    this.state.user.kawaiiId = localId;
                    this.state.user.avatarUrl = localAvatar || '';

                    this.toast('Offline Mode ✈️', 'blue');
                    this.loadAppData();
                    this.setView('home');
                } else {
                    // Session exists but no data? Force landing/login
                    console.warn("Session valid but no profile/local data found.");
                    this.setView('landing');
                }
            } else {
                // FALLBACK: If Supabase auths but profile fails & no local data, GO TO LANDING
                this.setView('landing');
            }
        } catch (e) {
            console.error("Critical Start Error:", e);
            this.toast("Startup Error: " + e.message, "blue");
            this.setView('landing'); // Force landing on error
        } finally {
            this.finalizeInit(); // ALWAYS RUN
        }
    },

    initSupabase() {
        if (!window.supabase) {
            console.error("Supabase library not found!");
            return;
        }
        const { url, key } = this.state.config;
        if (url && key) {
            this.state.supabase = window.supabase.createClient(url, key);
            console.log("☁️ Supabase client initialized");
        } else {
            console.warn("Supabase config missing");
        }
    },
    // Fallback alias for misspelled calls in stale caches
    initSupabse() {
        console.warn("⚠️ Fallback initSupabse called! (Stale cache detected)");
        return this.initSupabase();
    },

    async loadHistory(silent = false) {
        if (!this.state.supabase || !this.state.session) return;

        if (!silent) {
            this.state.isLoadingHistory = true;
            this.updateHistoryDOM(); // Show spinner immediately
        }

        try {
            // 1. Load History (Doodles)
            if (performance && performance.memory) {
                console.log(`🧠 Memory Start: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)}MB`);
            }

            let { data: doodles, error: doodleError } = await this.state.supabase
                .from('doodles')
                .select('*')
                .or(`sender_id.eq.${this.state.session.user.id},receiver_id.eq.${this.state.session.user.id}`)
                .order('created_at', { ascending: false })
                .limit(20);

            if (doodles) {
                const sizeBytes = JSON.stringify(doodles).length;
                console.log(`📦 History Packet Size: ${(sizeBytes / 1024).toFixed(2)} KB for ${doodles.length} items`);

                // Auto-set wallpaper if we have a new doodle sent TO us
                const latestReceived = doodles.find(d => d.receiver_id === this.state.session.user.id);
                if (latestReceived) {
                    this.setSmartWallpaper(latestReceived);
                }
            }

            if (doodleError) {
                console.warn("History fetch (5) failed, retrying with single item...", doodleError);
                // Fallback: Try loading just 1 if 5 failed (Critical Memory Mode)
                const { data: retryData, error: retryError } = await this.state.supabase
                    .from('doodles')
                    .select('*')
                    .or(`sender_id.eq.${this.state.session.user.id},receiver_id.eq.${this.state.session.user.id}`)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (retryError) throw retryError;
                doodles = retryData;
                // this.toast("Low memory mode active 💾", "blue");
            }

            // 2. Load Drafts (from Cloud)
            const { data: drafts, error: draftError } = await this.state.supabase
                .from('drafts')
                .select('*')
                .eq('user_id', this.state.session.user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (draftError) console.warn("Drafts load error:", draftError);
            this.state.drafts = drafts || [];

            // 3. Process Doodles (Group Sent & Cache Names)
            const userIds = new Set();
            if (doodles) {
                // Initialize lastDoodle for Home View
                if (doodles.length > 0) {
                    this.state.lastDoodle = doodles[0].image_data;
                }

                doodles.forEach(d => {
                    userIds.add(d.sender_id);
                    userIds.add(d.receiver_id);
                });
            }

            if (userIds.size > 0) {
                const { data: profiles, error: profError } = await this.state.supabase
                    .from('profiles')
                    .select('*')
                    .in('id', Array.from(userIds));

                if (profiles) {
                    if (!this.state.userCache) this.state.userCache = {};
                    if (!this.state.avatarCache) this.state.avatarCache = {};
                    profiles.forEach(p => {
                        this.state.userCache[p.id] = p.username;
                        this.state.avatarCache[p.id] = p.avatar_url;
                    });
                }
            }

            // Grouping Logic for SENT doodles
            const groupedHistory = [];
            const processedImages = new Set();

            if (doodles) {
                doodles.forEach(d => {
                    const isSent = d.sender_id === this.state.session.user.id;
                    if (isSent) {
                        // Use image_data as hash to group
                        if (processedImages.has(d.image_data)) {
                            // Find existing group
                            const group = groupedHistory.find(g => g.isGroup && g.image_data === d.image_data);
                            if (group) group.recipients.push(d.receiver_id);
                        } else {
                            processedImages.add(d.image_data);
                            groupedHistory.push({
                                ...d,
                                isGroup: true,
                                recipients: [d.receiver_id]
                            });
                        }
                    } else {
                        groupedHistory.push(d);
                    }
                });
            }

            // CHECK FOR CHANGES TO PREVENT BLINKING
            const currentHash = JSON.stringify(this.state.history.map(h => h.id));
            const newHash = JSON.stringify(groupedHistory.map(h => h.id));

            // Also check unread count change
            const currentUnread = this.state.unreadCount;
            const newUnread = doodles ? doodles.filter(d =>
                d.receiver_id === this.state.session.user.id &&
                d.is_read === false
            ).length : 0;

            if (silent && currentHash === newHash && currentUnread === newUnread) {
                return;
            }

            this.state.history = groupedHistory;
            this.state.unreadCount = newUnread;

            // Intelligent Update for Home View to prevent flickering
            if (this.state.view === 'home') {
                if (silent) {
                    this.updateHomeView();
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
            }

            // Update App Badge
            if (window.Capacitor && window.Capacitor.Plugins.Badge) {
                window.Capacitor.Plugins.Badge.set({ count: newUnread }).catch(() => { });
            }

        } catch (e) {
            console.error("History Load Error:", e);
            this.toast(`Failed to load magic: ${e.message || 'Unknown error'} 😭`, 'blue');
        } finally {
            this.state.isLoadingHistory = false;
            // Ensure UI removes spinner even if errored
            if (this.state.view === 'history') {
                this.updateHistoryDOM();
            }
        }
    },

    updateDraftsDOM() {
        const container = document.getElementById('drafts-section');
        if (!container) return;

        const drafts = App.state.drafts || [];
        if (drafts.length === 0) {
            container.innerHTML = '';
            return;
        }

        const newHtml = `
            <div class="bg-blue-50/50 p-4 rounded-bubbly border border-blue-100">
                <h3 class="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2">
                    <i data-lucide="book-heart" class="w-4 h-4"></i> My Sketchbook
                </h3>
                <div class="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x">
                    ${drafts.map((d, i) => `
                        <div class="bg-white p-2 rounded-xl shadow-sm relative shrink-0 w-32 snap-start">
                            <img src="${d.image_data}" class="w-full aspect-square object-contain rounded-lg bg-gray-50/50 border border-gray-100" />
                            <div class="absolute inset-0 flex items-center justify-center gap-1 bg-black/10 rounded-xl backdrop-blur-[1px]">
                                <button onclick="App.editDoodleFromUrl('${d.image_data}')" class="bg-white/90 text-blue-500 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all">
                                    <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                                </button>
                                <button onclick="App.deleteDraft('${d.id}')" class="bg-white/90 text-red-400 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;

        if (container.innerHTML !== newHtml) {
            container.innerHTML = newHtml;
            if (window.lucide) lucide.createIcons();
        }
    },

    updateHistoryDOM() {
        const container = document.getElementById('history-list-container');
        if (!container) return;

        if (this.state.isLoadingHistory && this.state.history.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-pink-400">
                    <div class="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                    <p class="font-bold text-sm animate-pulse">Waiting for connection... ✨</p>
                    <p class="text-xs text-pink-300 mt-1">Your doodles will appear here</p>
                </div>
             `;
            return;
        }

        // Anti-Flicker: Only update if the LIST of IDs has changed
        // This ignores trivial updates like "1 min ago" -> "1 min ago" re-renders
        const currentIdsHash = JSON.stringify(this.state.history.map(d => d.id));
        if (this._lastHistoryHash === currentIdsHash) return;
        this._lastHistoryHash = currentIdsHash;

        const newHtml = this.state.history.length === 0 ? `<p class="text-center text-white/60 py-20">No magic found yet... 🥺</p>` :
            this.state.history.map(d => `
            <div class="bg-white/80 p-4 rounded-bubbly shadow-lg animate-float">
                <div class="relative">
                    <img src="${d.image_data}" class="w-full aspect-square object-contain rounded-xl mb-3 bg-white shadow-inner" />
                    <button onclick="App.editDoodle('${d.image_data}')" class="absolute top-2 right-2 bg-white/90 text-pink-500 p-2 rounded-full shadow-md transition-all hover:scale-110 z-10 active:scale-95">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="App.setWallpaper('${d.image_data}', '${d.id}')" class="absolute top-12 right-2 bg-white/90 text-blue-500 p-2 rounded-full shadow-md transition-all hover:scale-110 z-10 active:scale-95">
                        <i data-lucide="smartphone" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex justify-between items-center text-[10px] font-bold text-pink-400">
                    <span>
                        ${(() => {
                    const isSent = d.sender_id === App.state.session.user.id;
                    const otherId = isSent ? d.receiver_id : d.sender_id;
                    const cacheName = App.state.userCache ? App.state.userCache[otherId] : null;
                    const friend = (Social.friends || []).find(f => f.id === otherId);

                    let name = cacheName || (friend ? friend.username : 'Unknown');
                    if (name === 'Unknown' && otherId) name = otherId.substring(0, 6) + '...';

                    // Group logic
                    if (d.isGroup) {
                        const names = d.recipients.map(rid => {
                            const f = (Social.friends || []).find(fr => fr.id === rid);
                            const cName = App.state.userCache ? App.state.userCache[rid] : null;
                            return cName || (f ? f.username : rid.substring(0, 5) + '..');
                        });
                        return `TO: ${names.join(', ')} 📤`;
                    }

                    return isSent ? `TO: ${name} 📤` : `FROM: ${name} 📥`;
                })()}
                        </span>
                        <span class="text-gray-400">${new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');

        if (container.innerHTML !== newHtml) {
            container.innerHTML = newHtml;
            if (window.lucide) lucide.createIcons();
        }
    },

    // Surgically updates only the dynamic parts of the home view (badge + doodle)
    // without a full re-render so there is no flicker during silent polling.
    updateHomeView() {
        // If the home view isn't even rendered yet, bail out.
        const content = document.getElementById('content');
        if (!content || this.state.view !== 'home') return;

        // 1. Update the unread badge on the History button
        const historyBtn = content.querySelector('#btn-history-badge');
        if (historyBtn) {
            historyBtn.textContent = this.state.unreadCount > 0 ? this.state.unreadCount : '';
            historyBtn.style.display = this.state.unreadCount > 0 ? 'flex' : 'none';
        } else {
            // Badge element not found (older render) — fall back to a full re-render
            this.renderView();
            return;
        }

        // 2. Update the doodle image if it changed
        const doodleImg = content.querySelector('img[data-home-doodle]');
        if (doodleImg && this.state.lastDoodle && doodleImg.src !== this.state.lastDoodle) {
            doodleImg.src = this.state.lastDoodle;
        }
    },

    async markAllRead() {
        if (!this.state.supabase || !this.state.session) return;
        if (this.state.unreadCount === 0) return;

        // Optimistic Update
        this.state.unreadCount = 0;
        this.renderView();
        if (window.Capacitor && window.Capacitor.Plugins.Badge) {
            window.Capacitor.Plugins.Badge.clear().catch(() => { });
        }

        try {
            await this.state.supabase
                .from('doodles')
                .update({ is_read: true })
                .eq('receiver_id', this.state.session.user.id)
                .eq('is_read', false);
            console.log("✅ Marked all as read");
        } catch (e) {
            console.warn("Failed to mark read:", e);
        }
    },

    async setWallpaper(imageData, id) {
        this.confirmKawaii({
            title: "New Look? 📱",
            message: "Set this doodle as your lock screen?",
            okText: "Set as Wallpaper! ✨",
            onConfirm: async () => {
                this.toast('Updating lock screen... ✨', 'pink');
                try {
                    const { Wallpaper } = window.Capacitor.Plugins;
                    if (Wallpaper) {
                        await Wallpaper.setSeamlessDoodleAsWallpaper({ image: imageData });
                        this.toast('Lock screen updated! ✨', 'pink');
                        if (id) localStorage.setItem('last-wallpaper-id', id);
                    } else {
                        this.toast('Feature not available 😭', 'blue');
                    }
                } catch (e) {
                    console.error(e);
                    this.toast('Failed to set wallpaper', 'blue');
                }
            }
        });
    },

    async setSmartWallpaper(doodle) {
        if (!doodle || !doodle.image_data) return;

        // CRITICAL: Only set if I am the RECEIVER.
        // If I sent it, do NOT set my own wallpaper.
        console.log(`🔍 Wallpaper Check: Me(${this.state.session.user.id}) vs Receiver(${doodle.receiver_id})`);

        if (doodle.receiver_id !== this.state.session.user.id) {
            console.log("Not setting wallpaper: I am the sender.");
            return;
        }

        // Check persistent flag (requires SQL update: user must add column)
        if (doodle.wallpaper_set_at) {
            console.log("Wallpaper already set historically (DB flag). Skipping.");
            return;
        }

        const lastSetId = localStorage.getItem('last-wallpaper-id');
        if (doodle.id === lastSetId) return;

        console.log("🖼️ Setting Wallpaper (Receiver Mode)...");
        try {
            const { Wallpaper } = window.Capacitor.Plugins;
            if (Wallpaper) {
                await Wallpaper.setSeamlessDoodleAsWallpaper({ image: doodle.image_data });
                this.toast('Lock screen updated! ✨', 'pink');
                localStorage.setItem('last-wallpaper-id', doodle.id);

                // Mark as set in DB so it doesn't re-set on reinstall/clear data
                // NOTE: This requires the 'wallpaper_set_at' column AND proper RLS policies
                try {
                    const { error } = await this.state.supabase
                        .from('doodles')
                        .update({ wallpaper_set_at: new Date().toISOString() })
                        .eq('id', doodle.id); // This will FAIL if RLS blocks receivers

                    if (error) {
                        console.error("❌ DB Update Failed (RLS Permission?):", error);
                        this.toast('Database sync failed! Check RLS policies.', 'blue');
                    } else {
                        console.log("✅ Successfully marked doodle as wallpaper_set_at in DB");
                    }
                } catch (dbErr) {
                    console.warn("Could not update DB (column might be missing):", dbErr);
                }
            }
        } catch (e) {
            console.error("Wallpaper set failed:", e);
        }
    },


    async syncProfile() {
        if (!this.state.supabase || !this.state.user.username || !this.state.user.kawaiiId) return;
        try {
            const user = (await this.state.supabase.auth.getUser()).data.user;
            if (!user) return;

            // Intelligently grab the avatar: State -> LocalStorage -> Metadata -> Default
            const metadataAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.full_name;
            // IMPORTANT: If state doesn't have it but metadata does, metadata wins!
            const avatar = this.state.user.avatarUrl || metadataAvatar || localStorage.getItem('user-avatar') || '';

            const updateData = {
                id: user.id,
                username: this.state.user.username,
                kawaii_id: this.state.user.kawaiiId
            };

            // Only add if we have a valid avatar URL
            if (avatar && avatar.startsWith('http')) {
                updateData.avatar_url = avatar;
                this.state.user.avatarUrl = avatar;
                localStorage.setItem('user-avatar', avatar);
            }

            const { error } = await this.state.supabase
                .from('profiles')
                .upsert(updateData);

            if (error) {
                console.warn("Profile sync logic:", error.message);
                // Fallback: If 'avatar_url' doesn't exist in DB, it will fail.
                // We'll try one more time without it to keep the app working.
                if (error.message.includes('avatar_url')) {
                    delete updateData.avatar_url;
                    await this.state.supabase.from('profiles').upsert(updateData);
                    console.log("⚠️ avatar_url column missing - skipping avatar sync");
                }
            } else {
                console.log("✨ Profile & Avatar synced!");
            }
        } catch (e) { console.log("Sync error:", e); }
    },

    subscribeToDoodles() {
        if (!this.state.supabase) return;
        if (this.state.doodleSubscription) return; // Prevent duplicates

        const channel = this.state.supabase
            .channel('public:doodles')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'doodles' }, payload => {
                console.log('🌈 New Magic Received!', payload);
                this.state.lastDoodle = payload.new.image_data;
                this.toast('New doodle from a friend! 💖', 'pink');

                // Auto-set wallpaper via smart logic
                this.setSmartWallpaper(payload.new);

                if (this.state.view === 'home' || this.state.view === 'widget') this.renderView();
            })
            .subscribe();

        this.state.doodleSubscription = channel;
        console.log("📡 Listening for forest magic...");
    },

    async handleGoogleSignIn() {
        if (!this.state.supabase) {
            this.toast('Login is currently unavailable! 🥺', 'blue');
            return;
        }

        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            try {
                const { GoogleAuth } = window.Capacitor.Plugins;
                if (!GoogleAuth) throw new Error("GoogleAuth plugin not found");

                const user = await GoogleAuth.signIn();
                this.logBoot("✅ Native Google Auth Success");

                // Restore fullscreen after account picker closes
                this.enableFullscreenMode();

                if (user && user.authentication && user.authentication.idToken) {
                    const { data, error } = await this.state.supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: user.authentication.idToken
                    });

                    if (error) throw error;

                    // Capture Avatar
                    if (user.imageUrl) {
                        App.state.user.avatarUrl = user.imageUrl;
                        localStorage.setItem('user-avatar', user.imageUrl);
                    }

                    this.toast('Login Successful! 🎉', 'pink');
                    // Force a profile sync before reload to ensure avatar travels to cloud
                    await this.syncProfile();
                    window.location.reload();
                } else {
                    throw new Error("No ID token received from Google");
                }
            } catch (e) {
                console.error("Native Google Login failed:", e);
                // Restore fullscreen even on error
                this.enableFullscreenMode();

                // Show raw error for debugging
                const rawError = JSON.stringify(e, Object.getOwnPropertyNames(e));
                this.toast(`Login Error: ${e.message || e.code || rawError}`, 'blue');
            }
            return;
        }

        // Web Fallback (Browser)
        try {
            App.toast('Opening Google login...', 'blue');
            const { error } = await this.state.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + window.location.pathname + '?redirect_to_app=true'
                }
            });

            if (error) throw error;
        } catch (e) {
            console.error(e);
            this.toast('Google login failed', 'blue');
        }
    },

    async signOut() {
        this.toast('Signing out... 👋', 'blue');

        // Stop all magic loops
        if (this.historyInterval) clearInterval(this.historyInterval);
        if (Social.friendInterval) clearInterval(Social.friendInterval);
        if (this.magicTimeout) clearTimeout(this.magicTimeout);

        try {
            // Fire and forget the remote sign out
            if (this.state.supabase) {
                await this.state.supabase.auth.signOut();
            }

            // Force Google Disconnect
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                const { GoogleAuth } = window.Capacitor.Plugins;
                if (GoogleAuth) {
                    await GoogleAuth.signOut();
                    await GoogleAuth.disconnect();
                }
            }
        } catch (e) {
            console.error('Sign out error:', e);
        }

        // Clear all local session data
        localStorage.clear();

        // Reset state in-memory (no page reload = no flicker!)
        this.state.session = null;
        this.state.user = { username: '', kawaiiId: '', avatarUrl: '' };
        this.state.history = [];
        this.state.drafts = [];
        this.state.activeRecipients = [];
        this.state.unreadCount = 0;
        this.state.viewHistory = [];
        this.state.isCanvasDirty = false;
        this.state.notificationsEnabled = false;
        this.state.updateAvailable = false;

        // Smooth transition to landing
        this.setView('landing');
        this.toast('Signed out! See you soon 🌸', 'pink');
    },

    handleSaveConfig() {
        const url = document.getElementById('sb-url').value.trim();
        const key = document.getElementById('sb-key').value.trim();

        if (!url || !key) {
            this.toast('Please enter both magic values! 🥺', 'blue');
            return;
        }

        localStorage.setItem('sb-url', url);
        localStorage.setItem('sb-key', key);
        this.state.config = { url, key };
        this.initSupabase();
        this.toast('Magic connection saved! ✨', 'pink');
        this.renderView();
    },

    navigateBack() {
        if (this.state.viewHistory.length > 0) {
            const prev = this.state.viewHistory.pop();
            this.state.view = prev;
            this.renderView();
            // Re-trigger setView side effects without pushing to history
            const viewName = prev;
            const header = document.querySelector('header');
            const nav = document.querySelector('nav');
            if (viewName === 'widget' || viewName === 'landing' || viewName === 'setup') {
                header.style.display = 'none';
                nav.style.display = 'none';
            } else {
                header.style.display = 'flex';
                nav.style.display = 'flex';
                document.body.classList.add('bg-kawaii-pink');
                document.body.classList.remove('bg-transparent');
                const content = document.getElementById('content');
                if (viewName === 'draw') {
                    document.body.classList.add('draw-mode');
                    nav.style.display = 'none';
                    if (content) {
                        content.classList.remove('p-4', 'items-center', 'overflow-y-auto');
                        content.classList.add('h-full', 'w-full', 'p-0', 'overflow-hidden');
                    }
                } else {
                    document.body.classList.remove('draw-mode');
                    nav.style.display = 'flex';
                    nav.classList.remove('nav-minimized');
                    if (nav.firstElementChild) nav.firstElementChild.style.display = 'flex';
                    if (content && viewName !== 'landing') {
                        content.classList.add('p-4', 'items-center', 'overflow-y-auto');
                        content.classList.remove('h-full', 'w-full', 'p-0', 'overflow-hidden');
                    }
                }
            }
            setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 0);
        } else {
            document.body.classList.remove('draw-mode');
        }

        // Auto-scroll to top on view change
        const content = document.getElementById('content');
        if (content) content.scrollTop = 0;

        this.renderView();

        // Update Nav visibility
        const nav = document.getElementById('app-nav');
        if (nav) {
            if (view === 'landing') {
                nav.classList.add('hidden');
            } else {
                nav.classList.remove('hidden');
            }
        }
    },

    renderView() {
        const content = document.getElementById('content');
        if (!content) return;

        console.log(`🎨 Rendering view: ${this.state.view}`);

        switch (this.state.view) {
            case 'landing':
                content.innerHTML = `
                    <div class="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in text-center px-6">
                        <div class="w-32 h-32 bg-white rounded-bubbly shadow-xl flex items-center justify-center animate-float">
                             <i data-lucide="palette" class="w-16 h-16 text-pink-500"></i>
                        </div>
                        <div class="space-y-2">
                            <h2 class="text-3xl font-black text-gray-800">Kawaii Doodle</h2>
                            <p class="text-gray-500 font-medium">Draw magic and send it to friends! ✨</p>
                        </div>
                        <button onclick="App.login()" class="w-full max-w-xs bg-white text-pink-500 py-4 rounded-full font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                            <i data-lucide="log-in"></i>
                            START DRAWING
                        </button>
                         <p class="text-[10px] text-pink-400 font-bold tracking-widest uppercase opacity-50">Experimental Beta v2.7</p>
                    </div>
                `;
                break;

            case 'home':
                content.innerHTML = `
                    <div class="w-full max-w-lg mx-auto space-y-6 animate-fade-in pb-20">
                        <div class="flex justify-between items-center px-2">
                            <h2 class="text-xl font-black text-gray-800">Recent Magic ✨</h2>
                            <button onclick="App.loadHistory()" class="p-2 text-pink-400 hover:text-pink-600 transition-colors">
                                <i data-lucide="refresh-cw" class="${this.state.isLoadingHistory ? 'animate-spin' : ''}"></i>
                            </button>
                        </div>
                        
                        <div id="history-feed" class="space-y-4">
                            ${this.state.isLoadingHistory ? `
                                <div class="py-20 text-center space-y-4">
                                    <div class="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
                                    <p class="text-sm font-bold text-pink-300">Summoning doodles...</p>
                                </div>
                            ` : this.state.history.length === 0 ? `
                                <div class="py-20 text-center bg-white/40 rounded-bubbly border-2 border-dashed border-white/60">
                                    <p class="text-gray-400 font-bold italic">No magic found yet... 🥺</p>
                                    <button onclick="App.setView('draw')" class="mt-4 text-pink-500 font-black text-xs underline underline-offset-4">START A NEW DOODLE</button>
                                </div>
                            ` : this.state.history.map(item => `
                                <div class="bg-white rounded-bubbly shadow-sm overflow-hidden border-2 border-white group hover:shadow-md transition-all">
                                    <div class="p-3 flex items-center justify-between border-b border-gray-50 bg-pink-50/30">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-pink-100 overflow-hidden">
                                                <i data-lucide="user" class="w-4 h-4 text-pink-300"></i>
                                            </div>
                                            <span class="text-xs font-bold text-gray-600">${item.profiles?.username || 'Unknown Artist'}</span>
                                        </div>
                                        <span class="text-[9px] font-bold text-pink-300">${new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div class="aspect-square bg-gray-50 flex items-center justify-center relative">
                                        <img src="${item.image_data}" class="w-full h-full object-contain" loading="lazy">
                                        <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                             <button onclick="App.editDoodle('${item.image_data}')" class="bg-white/90 p-3 rounded-full shadow-lg text-pink-500 transform hover:scale-110 active:scale-95 transition-all">
                                                <i data-lucide="edit-3" class="w-5 h-5"></i>
                                             </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;

            case 'draw':
                content.innerHTML = `
                    <div class="fixed inset-0 bg-white z-[80] flex flex-col animate-fade-in overflow-hidden">
                        <!-- Toolbar -->
                        <div class="p-4 flex justify-between items-center border-b border-gray-100 bg-white/80 backdrop-blur-md">
                            <button onclick="App.setView('home')" class="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                                <i data-lucide="chevron-left" class="w-6 h-6"></i>
                            </button>
                            <div class="flex gap-2">
                                <button id="btn-undo" class="p-2 bg-gray-50 rounded-full text-gray-400 disabled:opacity-30 disabled:pointer-events-none">
                                    <i data-lucide="undo-2" class="w-5 h-5"></i>
                                </button>
                                <button id="btn-redo" class="p-2 bg-gray-50 rounded-full text-gray-400 disabled:opacity-30 disabled:pointer-events-none">
                                    <i data-lucide="redo-2" class="w-5 h-5"></i>
                                </button>
                            </div>
                            <button id="send-doodle" class="bg-pink-500 text-white px-6 py-2 rounded-full font-black shadow-lg shadow-pink-200 hover:bg-pink-600 active:scale-95 transition-all flex items-center gap-2">
                                <span>SEND MAGIC</span>
                                <i data-lucide="send" class="w-4 h-4"></i>
                            </button>
                        </div>

                        <!-- Canvas Area -->
                        <div class="flex-1 relative bg-gray-100 overflow-hidden touch-none" id="canvas-container">
                            <canvas id="drawing-canvas" class="bg-white shadow-inner"></canvas>
                            
                            <!-- Drawing Controls Overlay -->
                            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full px-6 max-w-sm">
                                <!-- Recipient Picker -->
                                <div id="friend-bubbles" class="flex gap-2 overflow-x-auto no-scrollbar w-full py-2 px-4 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-lg min-h-[60px] items-center">
                                    <!-- Populated by Social.js -->
                                </div>
                                
                                <div class="bg-white/90 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col gap-4 w-full">
                                    <!-- Brush Size -->
                                    <div class="flex items-center gap-4 px-2">
                                        <i data-lucide="brush" class="w-4 h-4 text-gray-400"></i>
                                        <input type="range" id="brush-size" min="1" max="50" value="5" class="flex-1 accent-pink-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                                    </div>
                                    
                                    <!-- Palette -->
                                    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1" id="palette-container">
                                        <!-- Populated by canvas.js -->
                                    </div>

                                    <!-- Action Tools -->
                                    <div class="flex justify-between items-center border-t border-gray-100 pt-3">
                                        <div class="flex gap-3">
                                            <button id="btn-eraser-tool" class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-pink-500 transition-colors">
                                                <i data-lucide="eraser" class="w-5 h-5"></i>
                                            </button>
                                            <button id="btn-fill-tool" class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-pink-500 transition-colors">
                                                <i data-lucide="paint-bucket" class="w-5 h-5"></i>
                                            </button>
                                            <button id="clear-canvas" class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors">
                                                <i data-lucide="trash-2" class="w-5 h-5"></i>
                                            </button>
                                        </div>
                                        <button id="save-draft" class="text-xs font-black text-pink-500 bg-pink-50 px-4 py-2 rounded-full border border-pink-100 active:scale-95 transition-all">
                                            SAVE DRAFT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                // Initialize Canvas Logic
                setTimeout(() => {
                    if (window.initCanvas) window.initCanvas();
                    if (window.Social) Social.renderRecipientBubbles();
                }, 50);
                break;

            case 'friends':
                content.innerHTML = `
                    <div class="w-full max-w-lg mx-auto space-y-6 animate-fade-in pb-20">
                        <div class="bg-white rounded-bubbly shadow-xl p-6 border-4 border-pink-100">
                            <h3 class="text-xl font-black text-pink-500 mb-4 flex items-center gap-2">
                                <i data-lucide="user-plus"></i> Find Besties
                            </h3>
                            <div class="flex gap-2 p-1 bg-gray-50 rounded-full border-2 border-gray-100">
                                <input id="friend-id-input" type="text" placeholder="Type Kawaii ID..." class="flex-1 bg-transparent px-4 py-3 outline-none font-bold text-gray-700">
                                <button onclick="window.handleSearchFriend()" class="bg-pink-500 text-white px-6 py-3 rounded-full font-black shadow-lg hover:bg-pink-600 transition-all">
                                    ADD
                                </button>
                            </div>
                            <p class="text-[10px] text-gray-400 mt-2 px-2 italic">Tip: Your friends can find your ID in Settings!</p>
                        </div>

                        <div class="space-y-4">
                            <h3 class="text-lg font-black text-gray-800 px-2 flex items-center gap-2">
                                <i data-lucide="users" class="text-pink-400"></i> My Friends
                            </h3>
                            <div id="friend-list" class="space-y-2">
                                <!-- Populated by Social.js -->
                            </div>
                        </div>
                    </div>
                `;
                // Initialize Social Logic
                setTimeout(() => {
                    if (window.Social) Social.renderFriendList();
                }, 50);
                break;

            case 'history':
                // For now, history view is redundant with home or can be a specific filtered view
                this.setView('home');
                break;
        }

        // Always refresh icons
        if (window.lucide) lucide.createIcons();
    },

    async loadAppData() {
        console.log("📦 Loading App Data...");
        await this.loadHistory();
        if (window.Social) {
            await Social.loadFriends();
            Social.listenToSocial();
        }
    },

    async loadHistory() {
        if (!this.state.supabase || !this.state.session) return;

        console.log("📜 Summoning history...");
        this.state.isLoadingHistory = true;
        this.renderView(); // Show loader

        try {
            const userId = this.state.session.user.id;

            // Fetch doodles where user is sender or receiver
            const { data, error } = await this.state.supabase
                .from('doodles')
                .select(`
                    id,
                    image_data,
                    created_at,
                    profiles:sender_id (username, avatar_url)
                `)
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            this.state.history = data || [];
            console.log(`✅ Loaded ${this.state.history.length} doodles`);
        } catch (e) {
            console.error("History fetch failed:", e);
            this.toast("Could not load magic feed 🥺", "blue");
        } finally {
            this.state.isLoadingHistory = false;
            this.renderView();
        }
    },

    initPush() {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
        const { PushNotifications } = window.Capacitor.Plugins;
        if (!PushNotifications) return;

        PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token: ' + token.value);
            this.updateFcmToken(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
            this.toast(notification.title || "New Message!", "pink");
            if (window.Social) Social.loadFriends(); // Refresh social state
            this.loadHistory();
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
            if (notification.notification.data && notification.notification.data.type === 'doodle') {
                this.setView('history');
            }
        });

        PushNotifications.register();
    },

    async updateFcmToken(token) {
        if (!this.state.supabase || !this.state.session) return;
        try {
            const { error } = await this.state.supabase
                .from('profiles')
                .update({ fcm_token: token })
                .eq('id', this.state.session.user.id);
            if (error) throw error;
            console.log("✅ FCM Token updated in profile");
        } catch (e) {
            console.error("Failed to update FCM token:", e);
        }
    },


    // --- Actions ---
    editDoodle(imageData) {
        this.state.pendingDoodle = imageData;
        this.toast('Opening studio... 🎨', 'pink');
        this.setView('draw');
    },

    editDoodleFromUrl(url) {
        this.editDoodle(url);
    },

    // Save draft to LOCAL storage (works offline)
    saveLocalDraft(imageData) {
        try {
            const drafts = JSON.parse(localStorage.getItem('kawaii-local-drafts') || '[]');
            drafts.unshift({
                id: Date.now(),
                image_data: imageData,
                created_at: new Date().toISOString()
            });
            localStorage.setItem('kawaii-local-drafts', JSON.stringify(drafts));
            this.toast('Draft saved locally! 📂', 'pink');
        } catch (e) {
            console.error('Local draft save failed:', e);
            this.toast('Could not save draft 😭', 'blue');
        }
    },

    // Sync local drafts to Supabase when back online
    async syncLocalDrafts() {
        if (!this.state.supabase || !this.state.session) return;
        if (!navigator.onLine) return;

        const drafts = JSON.parse(localStorage.getItem('kawaii-local-drafts') || '[]');
        if (drafts.length === 0) return;

        console.log(`☁️ Syncing ${drafts.length} local drafts...`);
        let synced = 0;

        for (const draft of drafts) {
            try {
                const { error } = await this.state.supabase
                    .from('drafts')
                    .insert({
                        user_id: this.state.session.user.id,
                        image_data: draft.image_data
                    });
                if (!error) synced++;
            } catch (e) {
                console.error('Sync draft failed:', e);
            }
        }

        if (synced > 0) {
            localStorage.setItem('kawaii-local-drafts', '[]');
            this.toast(`${synced} draft(s) synced to cloud! ☁️`, 'pink');
            this.loadHistory();
        }
    },

    async saveDraft(imageData) {
        // Always save locally first as a safety net
        if (!this.state.supabase || !this.state.session || !navigator.onLine) {
            this.saveLocalDraft(imageData);
            return;
        }
        try {
            const { error } = await this.state.supabase
                .from('drafts')
                .insert({
                    user_id: this.state.session.user.id,
                    image_data: imageData
                });

            if (error) throw error;
            this.toast('Sketch saved! ✨', 'pink');
            this.loadHistory(); // Refresh
        } catch (e) {
            console.error(e);
            // Fallback to local if remote fails
            this.saveLocalDraft(imageData);
        }
    },

    async deleteDraft(id) {
        this.confirmKawaii({
            title: "Discard Sketch? 🗑️",
            message: "Are you sure you want to throw this magic away?",
            okText: "Discard 👋",
            onConfirm: async () => {
                try {
                    const { error } = await this.state.supabase
                        .from('drafts')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;
                    this.toast('Sketch discarded into the skye 👋', 'blue');
                    this.loadHistory();
                } catch (e) {
                    console.error(e);
                    this.toast('Delete failed', 'blue');
                }
            }
        });
    },

    async testNotification() {
        const { LocalNotifications } = window.Capacitor.Plugins;
        if (!LocalNotifications) {
            this.toast('Not supported on web 💻', 'blue');
            return;
        }

        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title: "It Works! 🎉",
                    body: "This is what a Kawaii Notification looks like!",
                    id: 1,
                    schedule: { at: new Date(Date.now() + 1000) },
                    sound: null,
                    attachments: null,
                    actionTypeId: "",
                    extra: null
                }]
            });
            this.toast('Scheduled in 1s... close app to see! ⏱️', 'pink');
        } catch (e) {
            console.error("Test Notif Error:", e);
            this.toast('Failed to schedule: ' + e.message, 'blue');
        }
    },

    async requestPushPermission() {
        const { PushNotifications } = window.Capacitor.Plugins;
        if (!PushNotifications) return false;

        // FORCE native prompt first! 🚀
        let status = await PushNotifications.requestPermissions();

        if (status.receive === 'granted') {
            this.toast("Magic is active! 📡✨", "pink");
            this.state.notificationsEnabled = true;
            this.initPush();
            this.renderView();
            return true;
        } else {
            console.log("Magic blocked by OS or User.");
            this.toast("Please allow notifications in settings! 🥺", "blue");
            return false;
        }
    },

    enableFullscreenMode() {
        setTimeout(() => {
            try {
                const { StatusBar } = window.Capacitor.Plugins;
                if (StatusBar) StatusBar.hide();
                if (window.NavigationBar) window.NavigationBar.hide();
                console.log("✅ Fullscreen mode enabled");
            } catch (err) { console.log("Fullscreen error:", err); }
        }, 500);
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.setView(view);
                this.haptic('light');
            });
        });
    },

    finalizeInit() {
        try {
            console.log("Finalizing Init...");
            this.setupNavigation();
            if (window.lucide) lucide.createIcons();
            this.fixZoomedLayout();
        } catch (e) {
            console.error("Finalize Error:", e);
        }
    },

    // Elite Haptics Helper
    // navigator.vibrate is blocked until the user has interacted with the page.
    // We track the first gesture ourselves and gate all vibrate calls behind it.
    haptic(type = 'light') {
        if (!navigator.vibrate || !window._userHasGestured) return;
        if (type === 'success') navigator.vibrate(10);
        else if (type === 'medium') navigator.vibrate(20);
        else if (type === 'heavy') navigator.vibrate([30, 50, 30]);
    },

    // Fix for zoomed-in screens / high DPI
    fixZoomedLayout() {
        const resetScale = () => {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            }
        };
        window.addEventListener('resize', resetScale);
        resetScale();
    },

    confirmKawaii({ title, message, okText, onConfirm, cancelText, onCancel }) {
        const modal = document.getElementById('confirm-modal');
        if (!modal) return;

        document.getElementById('confirm-title').innerText = title || "Magic Request?";
        document.getElementById('confirm-message').innerText = message || "";
        const okBtn = document.getElementById('confirm-ok');
        okBtn.innerText = okText || "Yes! ✨";

        const cancelBtn = document.getElementById('confirm-cancel');
        if (cancelText && cancelBtn) cancelBtn.innerText = cancelText;

        modal.classList.remove('hidden');

        const close = () => modal.classList.add('hidden');

        okBtn.onclick = () => {
            close();
            if (onConfirm) onConfirm();
        };

        cancelBtn.onclick = () => {
            close();
            if (onCancel) onCancel();
        };
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toasts');
        const existing = container.querySelector('.toast-enter');

        // Smart Singleton: If same message, just pulse it!
        if (existing && existing.innerText.includes(message)) {
            existing.classList.remove('toast-pulse');
            void existing.offsetWidth; // Trigger reflow
            existing.classList.add('toast-pulse');

            // Extend life
            clearTimeout(existing.dismissTimeout);
            existing.dismissTimeout = setTimeout(() => {
                existing.style.opacity = '0';
                existing.style.transform = 'translateY(-10px) scale(0.95)';
                setTimeout(() => existing.remove(), 300);
            }, 2500);
            return;
        }

        // Remove old if different message
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const toast = document.createElement('div');
        // Pill shape, centered, subtle blur
        toast.className = `toast-enter px-6 py-3 rounded-full shadow-2xl mb-4 font-bold flex items-center gap-3 text-white z-[100] backdrop-blur-sm border border-white/20`;

        // Elite Color Palette (Vibrant & Clean)
        if (type === 'pink') {
            toast.classList.add('bg-pink-500/90');
            this.haptic('success');
        } else if (type === 'blue') {
            toast.classList.add('bg-indigo-500/90');
            this.haptic('medium');
        } else {
            toast.classList.add('bg-gray-800/90');
        }

        toast.innerHTML = `<i data-lucide="${type === 'pink' ? 'sparkles' : 'info'}" class="w-4 h-4 text-white/90"></i> <span class="tracking-wide text-sm">${message}</span>`;
        container.appendChild(toast);

        if (window.lucide) lucide.createIcons();

        toast.dismissTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px) scale(0.95)';
            toast.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
            setTimeout(() => {
                if (toast.parentNode === container) container.removeChild(toast);
            }, 400);
        }, 2500);
    },

    createSparkle(x, y) {
        const s = document.createElement('div');
        s.className = 'sparkle-particle';
        s.style.left = `${x - 7}px`;
        s.style.top = `${y - 7}px`;
        s.style.background = ['#FFD1DC', '#BDE0FE', '#FAFAD2', 'white'][Math.floor(Math.random() * 4)];
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 800);
    },

    async openFriendPicker(callback) {
        const modal = document.getElementById('recipient-modal');
        const list = document.getElementById('modal-friend-list');
        if (!modal || !list) return;

        if (window.Social) {
            // ALWAYS fetch fresh friends to check for 'accepted' updates
            await Social.loadFriends();
        }

        if (!window.Social || !Social.friends.length) {
            this.toast('Add some friends first! 👯‍♀️', 'blue');
            this.setView('friends');
            return;
        }

        // Render simple list
        list.innerHTML = Social.friends
            .filter(f => f.status === 'accepted' || f.id === 'kawaii-6789' || f.status === 'pending')
            .map(f => {
                const isPending = f.status === 'pending';
                const canSelect = !isPending || f.id === 'kawaii-6789';
                return `
                <button onclick="${canSelect ? `App.handlePickerSelect('${f.id}', '${f.username}')` : ''}"
                        class="flex items-center gap-4 w-full p-3 rounded-2xl border-2 border-transparent ${canSelect ? 'hover:border-pink-300 hover:bg-pink-50' : 'opacity-50 cursor-not-allowed bg-gray-50'} transition-all text-left">
                    <div class="w-10 h-10 ${canSelect ? 'bg-pink-100 text-pink-500' : 'bg-gray-200 text-gray-400'} rounded-full flex items-center justify-center overflow-hidden">
                        ${(() => {
                        const av = App.state.avatarCache ? App.state.avatarCache[f.id] : null;
                        return av ? `<img src="${av}" class="w-full h-full object-cover">` : `<i data-lucide="user" class="w-5 h-5"></i>`;
                    })()} 
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-gray-700">${f.username}</p>
                        <p class="text-[10px] ${canSelect ? 'text-pink-400' : 'text-gray-400'}">${f.id} ${isPending ? '(Pending ⏳)' : ''}</p>
                    </div>
                    ${canSelect ? `<i data-lucide="send" class="text-pink-300 w-5 h-5"></i>` : ''}
                </button>
    `}).join('');

        if (list.innerHTML === '') {
            list.innerHTML = `< p class="text-center text-gray-400 italic py-4" > No friends found... 🥺</p > `;
        }

        if (window.lucide) lucide.createIcons();

        // Store callback
        this.pickerCallback = callback;
        modal.classList.remove('hidden');
    },

    handlePickerSelect(id, username) {
        document.getElementById('recipient-modal').classList.add('hidden');

        // Multi-select support for legacy picker
        if (!this.state.activeRecipients.includes(id)) {
            this.state.activeRecipients.push(id);
        }

        this.toast(`Selected ${username} ! 🎯`, 'pink');
        // Update UI if needed
        if (window.Social) Social.renderRecipientBubbles();

        if (this.pickerCallback) {
            this.pickerCallback(id);
            this.pickerCallback = null;
        }
    }
};

window.App = App;

window.addEventListener('mousedown', (e) => App.createSparkle(e.clientX, e.clientY));
window.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    App.createSparkle(t.clientX, t.clientY);
});

window.handleSearchFriend = () => {
    App.toast('Starting search logic... 🧠', 'pink'); // Debug toast
    const input = document.getElementById('friend-id-input');
    if (!input) {
        App.toast('Input element missing! 😱', 'blue');
        return;
    }
    const val = input.value.trim();
    if (!val) {
        App.toast('Type an ID first! ✍️', 'blue');
        return;
    }

    if (window.Social) {
        Social.searchFriend(val);
    } else {
        App.toast('Social system offline! 🚫', 'blue');
    }
    input.value = '';
};

App.toggleReleaseNotes = () => {
    const modal = document.getElementById('release-notes-modal');
    if (modal) modal.classList.remove('hidden');
};

window.addEventListener('DOMContentLoaded', () => {
    try {
        App.init();
    } catch (e) {
        console.error("Fatal Init Error:", e);
        alert("Fatal Error: " + e.message);
    }

    // 🛑 FORCE UNREGISTER SERVICE WORKER TO FIX CACHE ISSUES
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                console.log('🗑️ Unregistering SW to force update:', registration);
                registration.unregister();
            }
        });
    }
});
