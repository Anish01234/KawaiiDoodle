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
            const logEl = document.getElementById('boot-log-content');
            if (logEl) {
                logEl.innerHTML += `<div class="text-[10px] ${type === 'error' ? 'text-red-400' : 'text-green-300'} font-mono mb-1 border-b border-white/5 pb-1">> ${msg}</div>`;
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
        const log = document.getElementById('boot-log-content');
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
            // 1. Fetch Status from GitHub (Use raw content)
            // Replace with your actual username/repo
            const statusUrl = 'https://raw.githubusercontent.com/Anish01234/KawaiiDoodle/main/status.json';
            // Add cache busting
            const response = await fetch(`${statusUrl}?t=${Date.now()}`);
            if (!response.ok) return;

            const status = await response.json();

            // 2. Get Current Version
            let currentVersion = '0.0.0';
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                const info = await window.Capacitor.Plugins.App.getInfo();
                currentVersion = info.version;
            } else {
                return; // Don't block web/dev functionality
            }

            // 3. Check for Broken Version or Deprecation
            const isBroken = (status.broken_versions || []).includes(currentVersion);

            // Semver check for min version
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
                // BLOCKING UI
                console.error("CRITICAL: App version blocked.", { currentVersion, status });
                document.body.innerHTML = `
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:#fff0f5; z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem; text-align:center;">
                    <h1 style="font-size:2rem; color:#db2777; margin-bottom:1rem;">⚠️ Update Required</h1>
                    <p style="font-size:1.1rem; color:#4b5563; margin-bottom:2rem;">${status.critical_message || "This version of the app is no longer supported. Please update to continue sending magic!"}</p>
                    <button onclick="window.open('${status.force_update_url || 'https://github.com/Anish01234/KawaiiDoodle/releases'}', '_system')"
                        style="background:#db2777; color:white; padding:1rem 2rem; border-radius:99px; font-weight:bold; font-size:1.2rem; border:none; box-shadow:0 4px 15px rgba(219, 39, 119, 0.3);">
                        Download Fix 🚀
                    </button>
                    <p style="margin-top:2rem; font-size:0.8rem; color:#9ca3af;">Installed: v${currentVersion}</p>
                </div>
                `;
            }

        } catch (e) {
            console.warn("Safety net check failed (offline?):", e);
        }
    },

    // Panic Button: Triple Tap Version
    versionTaps: 0,
    versionTapTimer: null,
    handleVersionTap() {
        this.versionTaps++;
        if (this.versionTapTimer) clearTimeout(this.versionTapTimer);

        this.versionTapTimer = setTimeout(() => {
            this.versionTaps = 0;
        }, 1000); // Reset after 1 second of inactivity

        if (this.versionTaps >= 3) {
            // Trigger Panic Mode
            this.toast('🚑 Panic Link Activated!', 'pink');
            window.open('https://github.com/Anish01234/KawaiiDoodle/releases', '_system');
            this.versionTaps = 0;
        }
    },

    async checkForUpdates(retryCount = 0) {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;

        try {
            console.log(`🔄 Checking for updates... (attempt ${retryCount + 1})`);

            // Get current version dynamically
            let currentVersion = '0.0.0';
            try {
                const { App: CapApp } = window.Capacitor.Plugins;
                const info = await CapApp.getInfo();
                currentVersion = info.version;
            } catch (e) { console.warn("Could not get native version", e); }

            // Robust Semver Comparison
            const isNewer = (v1, v2) => {
                const parts1 = v1.split('.').map(Number);
                const parts2 = v2.split('.').map(Number);
                for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                    const n1 = parts1[i] || 0;
                    const n2 = parts2[i] || 0;
                    if (n1 > n2) return true;
                    if (n1 < n2) return false;
                }
                return false;
            };

            // Try fetching from GitHub API
            let data = null;
            try {
                const response = await fetch('https://api.github.com/repos/Anish01234/KawaiiDoodle/releases/latest');
                if (response.ok) {
                    data = await response.json();
                    // Cache the release data for reliability
                    localStorage.setItem('cached-update-data', JSON.stringify({
                        tag_name: data.tag_name,
                        body: data.body,
                        assets: data.assets,
                        cachedAt: Date.now()
                    }));
                } else {
                    console.warn(`⚠️ Update check HTTP ${response.status} — using cache`);
                }
            } catch (fetchErr) {
                console.warn('⚠️ Update fetch failed:', fetchErr.message);
            }

            // Fallback to cache if fetch failed
            if (!data) {
                try {
                    const cached = JSON.parse(localStorage.getItem('cached-update-data'));
                    if (cached && cached.tag_name) {
                        // Only use cache if it's less than 24 hours old
                        if (Date.now() - cached.cachedAt < 24 * 60 * 60 * 1000) {
                            data = cached;
                            console.log('📦 Using cached update data');
                        }
                    }
                } catch (e) { /* cache parse error, ignore */ }
            }

            // If still no data, retry once after 5s
            if (!data && retryCount < 1) {
                console.log('🔁 Will retry update check in 5s...');
                setTimeout(() => this.checkForUpdates(retryCount + 1), 5000);
                return;
            }

            if (!data) {
                console.warn('❌ Update check: no data available after retries');
                return;
            }

            const latestVersion = data.tag_name?.replace('v', '');
            console.log(`🚀 Checking updates: Installed=${currentVersion}, Remote=${latestVersion}`);

            // Ensure there is an APK to download!
            const hasApk = data.assets && data.assets.some(a => a.name.endsWith('.apk'));

            if (latestVersion && latestVersion !== currentVersion && isNewer(latestVersion, currentVersion)) {
                if (!hasApk) {
                    console.warn(`Update v${latestVersion} found but has no APK asset. Skipping.`);
                    return;
                }
                console.log(`Update available: ${latestVersion}`);
                this.state.updateAvailable = true;
                this.state.latestRelease = data;
                this.renderView();
                this.toast(`New Magic Available: v${latestVersion}! 🚀`, 'pink');
                this.showUpdateModal();
            } else {
                console.log("✅ Custom check: App is up to date!");
            }
        } catch (e) {
            console.warn("Update check failed:", e);
            // Retry once on unexpected errors
            if (retryCount < 1) {
                setTimeout(() => this.checkForUpdates(retryCount + 1), 5000);
            }
        }
    },

    async getAppVersion() {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return 'Web Dev Mode';
        try {
            // Retrieve info using Capacitor App Plugin
            const { App: CapApp } = window.Capacitor.Plugins;
            const info = await CapApp.getInfo();
            // Format: v2.9.22 (Build: 31)
            return `v${info.version} (Build: ${info.build})`;
        } catch (e) {
            console.error("Version check failed", e);
            return 'v?.?.? (Unknown)';
        }
    },

    async downloadCrashLogs() {
        // Prefer persistent logs if available, fallback to memory
        let logs = App.state.bootLogs.join('\n');
        try {
            const saved = localStorage.getItem('kawaii_crash_logs');
            if (saved) logs = JSON.parse(saved).join('\n');
        } catch (e) { console.warn("Failed to read saved logs", e); }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `kawaii-crash-logs-${timestamp}.txt`;

        this.toast('Preparing persistent logs... 🐞', 'blue');

        // 1. Try Native Share (Best for Android)
        if (window.Capacitor && window.Capacitor.Plugins.Share) {
            try {
                // Determine directory - Cache is reliable
                const Filesystem = window.Capacitor.Plugins.Filesystem;
                const path = `logs/${filename}`;

                // Write file first
                await Filesystem.writeFile({
                    path: path,
                    data: logs,
                    directory: 'CACHE',
                    encoding: 'utf8'
                });

                // Get URI
                const uriResult = await Filesystem.getUri({
                    path: path,
                    directory: 'CACHE'
                });

                await window.Capacitor.Plugins.Share.share({
                    title: 'Kawaii Doodle Logs',
                    text: 'Here are my crash logs! 🐞',
                    url: uriResult.uri,
                    dialogTitle: 'Share Logs'
                });
                return;
            } catch (e) {
                console.error("Share failed:", e);
                // Fallthrough to clipboard
            }
        }

        // 2. Fallback: Clipboard (Universal)
        try {
            await navigator.clipboard.writeText(logs);
            this.toast('Logs copied to clipboard! 📋', 'pink');
            alert("Logs copied to clipboard! You can paste them now.");
        } catch (e) {
            this.toast('Could not copy logs 😭', 'blue');
            console.error(e);
        }
    },

    async downloadAndInstallUpdate(assets) {
        if (!assets || !assets.length) return;
        const apkAsset = assets.find(a => a.name.endsWith('.apk'));

        if (!apkAsset) {
            this.toast('No APK found in this release! 🥺', 'blue');
            console.error("Update failed: Release has no .apk asset");
            return;
        }

        this.toast("Downloading magic update... 📦", "pink");
        // ... (rest of download logic) ...
        try {
            // Robust Plugin Access
            const Filesystem = window.Capacitor.Plugins.Filesystem;

            if (!Filesystem) {
                console.warn("Filesystem plugin missing. Falling back to browser.");
                window.open(apkAsset.browser_download_url, '_system');
                return;
            }

            const path = `update.apk`;
            const url = apkAsset.browser_download_url;

            console.log(`⬇️ Downloading ${url} to ${path}...`);

            const downloadResult = await Filesystem.downloadFile({
                path: path,
                directory: 'CACHE',
                url: url
            });

            console.log("✅ Download complete:", downloadResult);
            const fileUri = downloadResult.path;

            this.toast("Installing... ✨", "pink");

            if (window.cordova && window.cordova.plugins && window.cordova.plugins.fileOpener2) {
                window.cordova.plugins.fileOpener2.open(
                    fileUri,
                    'application/vnd.android.package-archive', {
                    error: (e) => {
                        console.error('FileOpen Error:', e);
                        this.toast("Install failed 😭. Please update manually.", "blue");
                        setTimeout(() => window.open(url, '_system'), 2000);
                    },
                    success: () => console.log('Installer opened!')
                }
                );
            } else {
                console.warn("FileOpener2 not found");
                this.toast("Installer plugin missing! 😭", "blue");
                window.open(url, '_system');
            }

        } catch (e) {
            console.error("Update download failed:", e);
            this.confirmKawaii({
                title: "Update Failed 🥺",
                message: "The auto-update magic fizzled out (network error). Want to download it manually?",
                okText: "Yes, Open Browser 🌐",
                onConfirm: () => window.open(apkAsset.browser_download_url, '_system')
            });
        }
    },

    showUpdateModal() {
        if (!this.state.latestRelease) return;
        const release = this.state.latestRelease;
        const version = release.tag_name;
        const body = release.body || "A shiny new version is ready for you!";

        // Create Modal
        const modalId = 'update-modal-overlay';
        if (document.getElementById(modalId)) return; // Already showing

        const div = document.createElement('div');
        div.id = modalId;
        div.className = "fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in";
        div.innerHTML = `
            <div class="bg-white w-full max-w-sm rounded-bubbly shadow-2xl p-6 relative flex flex-col gap-4 animate-float border-4 border-pink-200">
                <div class="text-center">
                    <div class="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <i data-lucide="sparkles" class="w-8 h-8 text-pink-500"></i>
                    </div>
                    <h3 class="text-2xl font-black text-pink-500">New Magic! ✨</h3>
                    <p class="text-gray-400 font-bold text-sm">${version}</p>
                </div>
                
                <!-- Notes Removed per user request -->

                <div class="flex flex-col gap-3 mt-2">
                    <button id="btn-update-confirm" class="bg-pink-500 text-white py-3 rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2">
                        <i data-lucide="download"></i> Update Now
                    </button>
                    <button id="btn-update-later" onclick="document.getElementById('${modalId}').remove()" class="text-gray-400 text-sm font-bold hover:text-gray-600 py-2">
                        Maybe Later 🐢
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        if (window.lucide) lucide.createIcons();

        // Bind download
        const btn = document.getElementById('btn-update-confirm');
        const laterBtn = document.getElementById('btn-update-later'); // Need to ID this

        btn.onclick = async () => {
            // UI Loading State
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Downloading...`;
            btn.classList.add('opacity-75', 'cursor-not-allowed');
            if (laterBtn) laterBtn.remove(); // Can't cancel once started to avoid currupted files

            // Start Download
            await this.downloadAndInstallUpdate(release.assets);

            // Only close on error (download function handles installs/redirects)
            // If we are here, it might have failed or is installing. 
            // We can leave the modal for a moment or let the installer take over.
            document.getElementById(modalId).remove();
        };
    },

    openLatestRelease() {
        window.open('https://github.com/Anish01234/KawaiiDoodle/releases', '_system');
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
        this.enableDebugConsole();
        this.checkCriticalHealth();
        this.logBoot("✨ Kawaii App Initializing...");

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
    haptic(type = 'light') {
        if (!navigator.vibrate) return;
        if (type === 'success') navigator.vibrate(10); // Tiny tick
        if (type === 'medium') navigator.vibrate(20);
        if (type === 'heavy') navigator.vibrate([30, 50, 30]); // Error/Destructive
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
