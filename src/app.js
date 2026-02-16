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
        previousView: null
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

    async checkForUpdates() {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;

        try {
            console.log("🔄 Checking for updates...");
            // Use specific repo
            const response = await fetch('https://api.github.com/repos/Anish01234/KawaiiDoodle/releases/latest');
            if (!response.ok) return;

            const data = await response.json();
            const latestVersion = data.tag_name?.replace('v', '');
            const currentVersion = '2.9.17';
            console.log("🚀 Version 2.9.17: Safe Push Init");

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

            if (latestVersion && latestVersion !== currentVersion && isNewer(latestVersion, currentVersion)) {
                console.log(`Update available: ${latestVersion}`);
                this.confirmKawaii({
                    title: "New Magic Found! 🌟",
                    message: `A new version (${latestVersion}) is ready! Update to see the latest magic? ✨`,
                    okText: "Update Now 🚀",
                    onConfirm: () => this.downloadAndInstallUpdate(data.assets)
                });
            } else {
                console.log("✅ Custom check: App is up to date!");
            }
        } catch (e) {
            console.warn("Update check failed:", e);
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
        if (!apkAsset) return;

        this.toast("Downloading magic update... 📦", "pink");

        try {
            // Robust Plugin Access
            // We use the global Capacitor object to access plugins if imports fail
            const Filesystem = window.Capacitor.Plugins.Filesystem;

            if (!Filesystem) {
                // FALLBACK: If plugin is strictly missing, we MUST use browser
                console.warn("Filesystem plugin missing. Falling back to browser.");
                window.open(apkAsset.browser_download_url, '_system');
                return;
            }

            const path = `update.apk`;
            const url = apkAsset.browser_download_url;

            console.log(`⬇️ Downloading ${url} to ${path}...`);

            // 1. Download File
            // Using 'CACHE' directory is the standard reliable way
            const downloadResult = await Filesystem.downloadFile({
                path: path,
                directory: 'CACHE',
                url: url
            });

            console.log("✅ Download complete:", downloadResult);
            const fileUri = downloadResult.path;

            // 2. Open File
            this.toast("Installing... ✨", "pink");

            if (window.cordova && window.cordova.plugins && window.cordova.plugins.fileOpener2) {
                window.cordova.plugins.fileOpener2.open(
                    fileUri,
                    'application/vnd.android.package-archive', {
                    error: (e) => {
                        console.error('FileOpen Error:', e);
                        this.toast("Install failed 😭. Please update manually.", "blue");
                        // Last resort fallback
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
            this.toast("Update failed 😭", "blue");
            window.open(apkAsset.browser_download_url, '_system');
        }
    },

    async init() {
        this.enableDebugConsole();
        this.checkForUpdates();
        this.logBoot("✨ Kawaii App Initializing...");
        this.logBoot(`Capacitor: ${window.Capacitor ? 'LOADED' : 'MISSING'}`);
        if (window.Capacitor) {
            this.logBoot(`Platform: ${window.Capacitor.getPlatform()}`);
        }
        try {
            // Check for Force Offline
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('offline') === 'true') {
                this.logBoot("✈️ Force Offline Mode Active");
                this.toast('Offline Mode Active ✈️', 'blue');
                this.state.view = 'landing';
                this.renderView();
                this.finalizeInit();
                return;
            }

            // 00. Truly Fullscreen Mode for Android
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                this.enableFullscreenMode();
                this.enableFullscreenMode();
                window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) {
                        this.enableFullscreenMode();
                        // Redundant check for slower devices
                        setTimeout(() => this.enableFullscreenMode(), 1000);
                    }
                });
            }

            // 0. Handle Bridge Redirect for deep linking
            // If we are on the web version and have ?redirect_to_app=true, jump to native app
            if (urlParams.get('redirect_to_app') === 'true') {
                const nativeUrl = 'io.kawaii.doodle://' + window.location.hash;
                this.logBoot("🌉 Bridge Redirect: Attempting jump to native app...");
                // Force a manual click if auto-redirect is blocked, but let's try auto first
                window.location.href = nativeUrl;

                // Fallback UI if redirect doesn't happen automatically
                setTimeout(() => {
                    const content = document.getElementById('content');
                    if (content) {
                        content.innerHTML = `
                            <div class="p-8 text-center bg-white rounded-bubbly m-4 shadow-xl">
                                <h2 class="text-xl font-bold mb-4">Redirecting back... 🚀</h2>
                                <p class="mb-6">If the app didn't open automatically, tap the button below:</p>
                                <a href="${nativeUrl}" class="btn-primary btn-bubbly inline-block bg-pink-400 text-white border-0 py-4 px-8">Open App 📱</a>
                            </div>
                        `;
                    }
                }, 2000);
                return;
            }

            // 1. Initialize Capacitor App Plugin for Deep Links
            if (window.Capacitor && window.Capacitor.Plugins.App) {
                const { App: CapApp } = window.Capacitor.Plugins;

                CapApp.addListener('appUrlOpen', async (data) => {
                    console.log('🔗 Deep Link Received:', data.url);
                    // Handle Supabase OAuth redirection
                    const url = new URL(data.url);
                    const hash = url.hash;
                    if (hash && hash.includes('access_token')) {
                        console.log('🔑 OAuth fragment found in deep link, syncing session...');
                        const { data: authData, error } = await this.state.supabase.auth.setSession({
                            access_token: hash.split('access_token=')[1].split('&')[0],
                            refresh_token: hash.split('refresh_token=')[1].split('&')[0]
                        });
                        if (error) console.error("Session sync error:", error);
                        else window.location.reload();
                    }
                });
            }

            // 2. Initialize Supabase
            this.initSupabase();

            // Check for session
            if (this.state.supabase) {
                this.logBoot("☁️ Checking session...");
                // Timeout wrapper for getSession (3s)
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 3000));

                let sessionData = { data: { session: null }, error: null };

                try {
                    sessionData = await Promise.race([
                        this.state.supabase.auth.getSession(),
                        timeout
                    ]);
                } catch (e) {
                    console.warn("Session check failed or timed out:", e);
                    // Fallback to null session
                }

                const { data: { session }, error } = sessionData;

                if (error) throw error;

                this.state.session = session;

                // Resume Listener for Fullscreen Restoration
                if (window.Capacitor && window.Capacitor.Plugins.App) {
                    window.Capacitor.Plugins.App.addListener('resume', () => {
                        console.log("Create Resume: Restoring Fullscreen & Syncing...");
                        this.enableFullscreenMode();
                        this.loadHistory(); // Check for new doodles while away
                    });
                }

                if (session) {
                    // If logged in, fetch profile
                    const { data: profile } = await this.state.supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile && profile.username && profile.kawaii_id) {
                        this.state.user.username = profile.username;
                        this.state.user.kawaiiId = profile.kawaii_id;
                        this.state.user.avatarUrl = profile.avatar_url || localStorage.getItem('user-avatar') || '';

                        localStorage.setItem('user-name', profile.username);
                        localStorage.setItem('user-id', profile.kawaii_id);
                        if (this.state.user.avatarUrl) localStorage.setItem('user-avatar', this.state.user.avatarUrl);

                        this.loadAppData();
                    } else {
                        // Logged in but profile is missing or blank? Go to setup!
                        console.log("🍭 Profile missing or blank, heading to setup...");
                        this.setView('setup');
                        this.finalizeInit();
                        return;
                    }
                } else {
                    // Not logged in? Go to landing
                    this.setView('landing');
                    this.finalizeInit();
                    return;
                }
            }

            // Listen for URL params (e.g., ?view=widget)
            const params = new URLSearchParams(window.location.search);
            if (params.get('view') === 'widget') {
                this.setView('widget');
                this.finalizeInit();
                return;
            }

            this.renderView();
            this.finalizeInit();

            // 3. Initialize Push (FCM) & Google Auth
            if (window.Capacitor.isNativePlatform()) {
                setTimeout(() => {
                    try {
                        this.initPush();
                    } catch (e) { console.error("Push Init Failed:", e); }
                    // Pre-initialize Google Auth for snappier login
                    const { GoogleAuth } = window.Capacitor.Plugins;
                    if (GoogleAuth) {
                        GoogleAuth.initialize({
                            clientId: '338129743756-1u308evrhbor1sn79u8u7ceqlh8acvos.apps.googleusercontent.com',
                        }).catch(e => console.log("GoogleAuth Init deferred:", e));
                    }
                }, 2000);
            }

        } catch (e) {
            console.error("Critical Init Error:", e);
            this.toast('Magic startup failed... trying offline mode 🩹', 'blue');
            this.state.view = 'landing';
            this.renderView();
            this.finalizeInit();
        }
    },

    async checkIfPushEnabled() {
        const { PushNotifications } = window.Capacitor.Plugins;
        if (!PushNotifications) return false;
        try {
            const status = await PushNotifications.checkPermissions();
            this.state.notificationsEnabled = (status.receive === 'granted');
            return this.state.notificationsEnabled;
        } catch (e) { return false; }
    },

    async requestPushPermission() {
        const { PushNotifications, App: CapApp } = window.Capacitor.Plugins;
        if (!PushNotifications) return;

        let status = await PushNotifications.checkPermissions();

        if (status.receive === 'prompt') {
            status = await PushNotifications.requestPermissions();
        }

        if (status.receive !== 'granted') {
            // If explicitly denied, we must guide to settings
            this.confirmKawaii({
                title: "Magic Blocked! 🔕",
                message: "Notifications are blocked. Open settings to enable magic?",
                okText: "Open Settings ⚙️",
                onConfirm: async () => {
                    console.log("🚀 Magic Signal: Attempting to open app settings...");
                    try {
                        const Cap = window.Capacitor;
                        const appPlugin = Cap?.Plugins?.App;

                        // Try multiple method names for robustness
                        const opener = appPlugin?.openAppSettings || appPlugin?.openSettings;

                        if (typeof opener === 'function') {
                            await opener.call(appPlugin);
                        } else {
                            console.warn("⚠️ settings_method_missing");
                            this.showPermissionGuide();
                        }
                    } catch (e) {
                        console.error("❌ settings_fail:", e);
                        this.showPermissionGuide();
                    }
                }
            });
        } else if (status.receive === 'granted') {
            this.toast("Magic is already active! 📡✨", "pink");
            this.state.notificationsEnabled = true;
            this.renderView();
        }
        // If permission was granted (either initially or after prompt), proceed to initPush
        if (status.receive === 'granted') {
            this.initPush();
        }
    },

    showPermissionGuide() {
        this.confirmKawaii({
            title: "Magic Activation Guide 📡",
            message: "Automatic setup paused! ✨\n\nTo hear your friends' magic, please click 'Open Settings' and enable 'Notifications' for Kawaii Doodle.\n\nIt only takes 5 seconds! 🌸",
            okText: "Open Settings ⚙️",
            onConfirm: async () => {
                try {
                    const Cap = window.Capacitor;
                    const appPlugin = Cap?.Plugins?.App;
                    const opener = appPlugin?.openAppSettings || appPlugin?.openSettings;

                    if (typeof opener === 'function') {
                        await opener.call(appPlugin);
                    } else {
                        // Clear description for the user
                        this.toast("Please open Phone Settings > Apps > Kawaii Doodle > Notifications! 🎨", "blue");
                    }
                } catch (err) {
                    console.error("Settings Guide Fail:", err);
                    this.toast("Manual setting required! ⚙️", "blue");
                }
            }
        });
    },

    async requestAllPermissions() {
        this.toast('Syncing all magic realms... 🔮', 'pink');
        try {
            await this.requestPushPermission();
            // Trigger any other permission prompts if needed
            if (window.navigator.vibrate) window.navigator.vibrate(20);
            this.toast('All systems Kawaii! 🌈', 'pink');
        } catch (e) { console.error(e); }
    },

    async initPush() {
        const { PushNotifications } = window.Capacitor.Plugins;
        if (!PushNotifications) return;

        console.log("🔔 Initializing Push Notifications...");

        // Check & Update Status
        let status = await PushNotifications.checkPermissions();
        if (status.receive === 'prompt') {
            // Only auto-request if we are in a 'fresh' state where it's appropriate
            // For now, let's try to request, but it might resolve to prompt
            status = await PushNotifications.requestPermissions();
        }

        if (status.receive !== 'granted') {
            console.log("🔕 Push permission not granted");
            this.state.notificationsEnabled = false;
            // Render view to show the button
            if (this.state.view === 'home') this.renderView();
            return;
        }

        this.state.notificationsEnabled = true;

        // Register
        try {
            await PushNotifications.register();
        } catch (e) {
            console.error("Push Native Register Failed:", e);
            // Don't toast here as it might be a silent failure or race condition
        }

        // On success
        PushNotifications.addListener('registration', async (token) => {
            console.log('🔔 Push Token:', token.value);
            // Save to Supabase (User needs to add 'fcm_token' column!)
            if (this.state.session) {
                try {
                    await this.state.supabase
                        .from('profiles')
                        .update({ fcm_token: token.value })
                        .eq('id', this.state.session.user.id);
                    console.log("✅ FCM Token saved to profile");
                } catch (e) { console.warn("Failed to save FCM token (column missing?)", e); }
            }
        });

        // On error
        PushNotifications.addListener('registrationError', (error) => {
            console.error('Push registration error: ', error);
        });

        // On notification received (Foreground)
        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
            console.log('🔔 Push received:', notification);
            this.toast(`New magic in the air! ✨`, 'pink');

            // If the notification contains image data (data-only payload), we could set wallpaper here
            // But usually we just refresh history
            this.loadHistory();
        });

        // On notification tapped
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('🔔 Push tapped:', notification);
            this.setView('history');
        });
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

    finalizeInit() {
        this.setupNavigation();
        if (window.lucide) lucide.createIcons();
        this.fixZoomedLayout(); // Call the new layout fix
    },

    generateKawaiiId() {
        const adjectives = ['Sparkly', 'Bubbly', 'Sweet', 'Fluffy', 'Magic', 'Cuddly'];
        const nouns = ['Bunny', 'Kitten', 'Star', 'Cloud', 'Heart', 'Berry'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(1000 + Math.random() * 9000);
        const id = `${adj}${noun}-${num}`;
        this.state.user.kawaiiId = id;
        localStorage.setItem('user-id', id);
        return id;
    },

    async completeSetup(username) {
        if (!username || username.length < 2) {
            this.toast('Choose a longer name! 🌸', 'blue');
            return;
        }

        const id = this.generateKawaiiId();
        this.state.user.username = username;
        localStorage.setItem('user-name', username);

        if (this.state.supabase && this.state.session) {
            try {
                this.toast('Creating your magic identity... ✨', 'pink');
                const { error } = await this.state.supabase
                    .from('profiles')
                    .upsert({
                        id: this.state.session.user.id,
                        username: username,
                        kawaii_id: id
                    });

                if (error) throw error;
                this.setView('home');
            } catch (e) {
                console.error("Profile Setup Error:", e);
                this.toast(`Setup failed: ${e.message || 'Check your SQL Editor'} 😭`, 'blue');
            }
        } else {
            this.setView('home');
        }
    },

    initSupabase() {
        this.logBoot("🔌 Connecting to Cloud...");
        if (this.state.config.url && this.state.config.key && window.supabase) {
            try {
                this.state.supabase = supabase.createClient(this.state.config.url, this.state.config.key);
                this.logBoot("✅ Cloud Connected");
            } catch (e) {
                this.logBoot("❌ Cloud Connection Failed: " + e.message);
                console.error("Cloud Sync init failed:", e);
            }
        } else {
            this.logBoot("⚠️ Supabase Config Missing or SDK not loaded");
        }
    },

    async loadAppData() {
        if (!this.state.supabase || !this.state.session) return;

        this.subscribeToDoodles();
        this.syncProfile();

        if (window.Social) {
            Social.loadFriends();
            Social.listenToSocial();
        }
        this.loadHistory();

        // 🔄 Polling Fallback: Check for new magic every 30s
        // FIX: Only render if data actually changed to prevent blinking
        setInterval(async () => {
            // console.log("⏱️ Polling: Checking for new doodles..."); // Reduce log spam
            await this.loadHistory(true); // Pass 'silent' flag
        }, 30000);
    },

    async loadHistory(silent = false) {
        if (!this.state.supabase || !this.state.session) return;
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
                .limit(20); // Test: Increasing back to 20 with logging

            if (doodles) {
                const sizeBytes = JSON.stringify(doodles).length;
                console.log(`📦 History Packet Size: ${(sizeBytes / 1024).toFixed(2)} KB for ${doodles.length} items`);
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
                this.toast("Low memory mode active 💾", "blue");
            }

            // 2. Load Drafts (from Cloud)
            const { data: drafts, error: draftError } = await this.state.supabase
                .from('drafts')
                .select('*')
                .eq('user_id', this.state.session.user.id)
                .order('created_at', { ascending: false })
                .limit(5); // Optimization: Limit drafts to prevent OOM

            if (draftError) console.warn("Drafts load error:", draftError);
            this.state.drafts = drafts || [];

            // 3. Process Doodles (Group Sent & Cache Names)
            const userIds = new Set();
            doodles.forEach(d => {
                userIds.add(d.sender_id);
                userIds.add(d.receiver_id);
            });

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

            doodles.forEach(d => {
                const isSent = d.sender_id === this.state.session.user.id;

                if (isSent) {
                    // Unique identifier for the "batch" - using image_data length + hash or just image_data
                    // Since image_data is large, let's look for adjacent sends with same image
                    if (processedImages.has(d.image_data)) {
                        // Find the group and add recipient
                        const group = groupedHistory.find(g => g.isGroup && g.image_data === d.image_data);
                        if (group) {
                            group.recipients.push(d.receiver_id);
                        }
                    } else {
                        // Create new group
                        processedImages.add(d.image_data);
                        groupedHistory.push({
                            ...d,
                            isGroup: true,
                            recipients: [d.receiver_id]
                        });
                    }
                } else {
                    groupedHistory.push(d); // Received doodles are always unique events
                }
            });

            // CHECK FOR CHANGES TO PREVENT BLINKING
            const currentHash = JSON.stringify(this.state.history.map(h => h.id));
            const newHash = JSON.stringify(groupedHistory.map(h => h.id));

            // Also check unread count change
            const currentUnread = this.state.unreadCount;
            // Count doodles where I am receiver AND is_read is explicitly false
            const newUnread = doodles.filter(d =>
                d.receiver_id === this.state.session.user.id &&
                d.is_read === false
            ).length;

            if (silent && currentHash === newHash && currentUnread === newUnread) {
                // No changes, no blink!
                return;
            }

            this.state.history = groupedHistory;
            this.state.unreadCount = newUnread;

            // Update App Badge (Plugin)
            if (window.Capacitor && window.Capacitor.Plugins.Badge) {
                try {
                    await window.Capacitor.Plugins.Badge.set({ count: newUnread });
                } catch (e) { /* ignore badge error */ }
            }

            if (this.state.history.length > 0) {
                this.state.lastDoodle = doodles[0].image_data;
                this.setSmartWallpaper(doodles[0]);
            }
            if (this.state.view === 'home' || this.state.view === 'history') this.renderView();
        } catch (e) {
            console.error("History load failed:", e);
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
        try {
            // Fire and forget the remote sign out
            if (this.state.supabase) {
                this.state.supabase.auth.signOut();
            }

            // Clear all local session data immediately
            localStorage.removeItem('sb-access-token');
            localStorage.removeItem('sb-refresh-token');
            localStorage.removeItem('user-name');
            localStorage.removeItem('user-id');
            localStorage.removeItem('user-avatar');

            // Short delay to let the toast be seen before the hard reload
            setTimeout(() => {
                window.location.href = window.location.origin + window.location.pathname;
            }, 500);
        } catch (e) {
            console.error("Sign out error:", e);
            window.location.reload();
        }
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

    setView(viewName) {
        if (this.state.view === viewName) return; // Prevent reset if already on view
        this.state.view = viewName;
        this.renderView();

        // Handle widget mode UI (hide header/nav)
        const appShell = document.getElementById('app');
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');

        if (viewName === 'widget' || viewName === 'landing' || viewName === 'setup') {
            header.style.display = 'none';
            nav.style.display = 'none';
            if (viewName === 'widget') {
                document.body.classList.remove('bg-kawaii-pink');
                document.body.classList.add('bg-transparent');
            }
        } else {
            header.style.display = 'flex';
            nav.style.display = 'flex';
            document.body.classList.add('bg-kawaii-pink');
            document.body.classList.remove('bg-transparent');

            // Hide Nav for Draw Mode (User Request: "no home button needed")
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
                // Reset minimized state just in case
                nav.classList.remove('nav-minimized');
                if (nav.firstElementChild) nav.firstElementChild.style.display = 'flex';

                if (content && viewName !== 'landing') {
                    // Restore default content style
                    content.classList.add('p-4', 'items-center', 'overflow-y-auto');
                    content.classList.remove('h-full', 'w-full', 'p-0', 'overflow-hidden');
                }
            }
        }

        const currentView = this.state.view;
        setTimeout(() => {
            if (window.lucide) lucide.createIcons();
            // Populate dynamic lists
            if (viewName === 'friends') {
                if (window.Social) {
                    Social.loadFriends(); // Fetch fresh data
                    Social.renderFriendList();
                }
                // Explicitly bind search button
                const searchBtn = document.getElementById('btn-search-friend');
                if (searchBtn) {
                    searchBtn.onclick = () => {
                        App.toast('Button clicked! 🖱️', 'blue'); // Debug toast
                        window.handleSearchFriend();
                    };
                }
            }
            if (viewName === 'history') {
                this.loadHistory();
                this.markAllRead();
            }
        }, 0);
    },

    setupNavigation() {
        document.getElementById('nav-draw').addEventListener('click', () => this.setView('draw'));
        document.getElementById('nav-home').addEventListener('click', () => this.setView('home'));
        document.getElementById('header-home').addEventListener('click', () => this.setView('home'));
        document.getElementById('btn-friends').addEventListener('click', () => this.setView('friends'));
        document.getElementById('btn-profile').addEventListener('click', () => this.setView('profile'));

        // Magic Sequence Listener
        const title = document.querySelector('header h1');
        if (title) title.addEventListener('click', () => this.handleMagicSequence());
    },

    renderView() {
        const content = document.getElementById('content');
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');

        // Force Landing if no session
        if (!this.state.session && this.state.view !== 'landing' && this.state.view !== 'widget') {
            this.state.view = 'landing';
        }

        switch (this.state.view) {
            case 'landing':
                content.innerHTML = this.templates.landing();
                header.style.display = 'none';
                nav.style.display = 'none';
                break;
            case 'setup':
                content.innerHTML = this.templates.setup();
                header.style.display = 'none';
                nav.style.display = 'none';
                break;
            case 'home': content.innerHTML = this.templates.home(); break;
            case 'draw':
                content.innerHTML = this.templates.draw();
                // Delay canvas init to fix touch coordinates
                setTimeout(() => {
                    if (window.initCanvas) window.initCanvas();
                }, 100);
                // Ensure friends are loaded for recipient picker
                if (window.Social && (!Social.friends || Social.friends.length === 0)) {
                    Social.loadFriends().then(() => Social.renderRecipientBubbles());
                }
                break;
            case 'friends': content.innerHTML = this.templates.friends(); break;
            case 'profile': content.innerHTML = this.templates.profile(); break;
            case 'history': content.innerHTML = this.templates.history(); break;
            case 'widget': content.innerHTML = this.templates.widget(); break;
            default: content.innerHTML = `<div>404 - Kawaii Not Found 😭</div>`;
        }

        // Add animation class to new content
        // Add animation class to new content ONLY if view changed
        if (content.firstElementChild && this.state.view !== this.state.previousView) {
            content.firstElementChild.classList.add('animate-slide-up');
        }
        this.state.previousView = this.state.view;
        if (window.lucide) lucide.createIcons();
    },

    templates: {
        landing: () => `
            <div class="flex flex-col items-center justify-center min-h-screen gap-8 text-center animate-float p-4">
                <div class="relative">
                    <div class="w-48 h-48 bg-white/40 rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                        <img src="src/assets/logo.png" class="w-full h-full object-cover" alt="Kawaii Doodle Logo" />
                    </div>
                </div>
                <div>
                    <!-- Removed text title since logo has text -->
                    <p class="text-white font-bold drop-shadow-md italic mt-4 text-lg">Hand-drawn magic for friends ✨</p>
                </div>

                <!-- Google Sign In Button (Official Style) -->
                <button onclick="App.handleGoogleSignIn()" class="bg-white text-gray-700 px-6 py-3 rounded-full font-medium text-lg shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center gap-4 w-72 justify-center border border-gray-100 relative z-10">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Sign in with Google</span>
                </button>
                
                <!-- Release Notes Button -->
                <button onclick="App.toggleReleaseNotes()" class="absolute top-4 left-4 p-2 bg-white/80 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border-2 border-yellow-200 z-50">
                    <i data-lucide="sparkles" class="w-6 h-6 text-yellow-400"></i>
                </button>

                <div class="text-center">
                    <p class="text-white/90 font-bold drop-shadow-md text-xs max-w-[200px] mx-auto">By continuing, you agree to spread kawaii vibes only! 💖</p>
                    <p class="text-[10px] text-white/50 mt-2 font-mono">v2.9.11 (Build: ${new Date().toLocaleTimeString()})</p>
                    
                    <!-- Crash Log Tool -->
                    <button onclick="App.downloadCrashLogs()" class="mt-4 text-[10px] text-white/40 hover:text-white underline p-2">
                        🐞 Debug: Copy/Share Logs
                    </button>
                </div>
            </div>

            <!-- Hidden Release Notes Modal (MOVED OUTSIDE) -->
            <div id="release-notes-modal" class="hidden fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-8 backdrop-blur-md transition-all" onclick="this.classList.add('hidden')">
                <div class="bg-white w-full max-w-sm h-3/4 rounded-bubbly shadow-2xl relative flex flex-col transform rotate-1 border-4 border-pink-100" onclick="event.stopPropagation()">
                    
                    <!-- Header -->
                    <div class="p-6 border-b border-pink-50 bg-pink-50/50 rounded-t-bubbly">
                        <h3 class="font-bold text-xl text-pink-500 flex justify-between items-center">
                            <span>What's New? ✨</span>
                            <button onclick="document.getElementById('release-notes-modal').classList.add('hidden')" class="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow-sm">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </h3>
                        <p class="text-xs text-pink-300 font-bold mt-1">Version 2.6 - The Wallpaper Update! 🦄</p>
                    </div>

                    <!-- Scrollable Content -->
                    <div class="flex-1 p-6 overflow-y-auto text-left space-y-4">
                        
                        <div class="bg-pink-50 p-3 rounded-xl border border-pink-100">
                            <h4 class="font-bold text-pink-500 text-sm mb-1">🧼 Clean Start</h4>
        `,
        setup: () => `
            <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-fade-in">
                <div class="bg-white/80 p-8 rounded-bubbly shadow-2xl w-full max-w-sm flex flex-col gap-6 animate-float">
                    <div>
                        <h2 class="text-2xl font-black text-pink-500 mb-2">Welcome Home! 🏡</h2>
                        <p class="text-gray-500 text-sm italic">What should your friends call you?</p>
                    </div>
                    <div>
                        <input id="setup-name" type="text" placeholder="Your Sweet Name..." class="w-full bg-pink-50 px-6 py-4 rounded-full border-none focus:ring-4 focus:ring-pink-300 outline-none text-center font-bold text-pink-600 text-lg">
                    </div>
                    <button onclick="App.completeSetup(document.getElementById('setup-name').value)" class="bg-pink-500 text-white w-full py-4 rounded-full font-black text-lg shadow-lg hover:bg-pink-600 active:scale-95 transition-all">
                        Let's Go! 🚀
                    </button>
                </div>
            </div>
        `,
        home: () => `
            <div class="flex flex-col items-center gap-6 p-4 w-full max-w-md mx-auto animate-slide-up">
                <div class="w-64 h-64 bg-white/60 rounded-bubbly border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transform hover:scale-105 transition-transform duration-500">
                    ${App.state.lastDoodle ? `<img src="${App.state.lastDoodle}" class="w-full h-full object-contain opacity-0 transition-opacity duration-700" onload="this.classList.remove('opacity-0')" />` : `
                    <div class="text-center p-4">
                        <i data-lucide="image" class="w-12 h-12 mx-auto text-pink-300 mb-2"></i>
                        <p class="font-bold text-pink-400 text-sm">Waiting for a doodle...</p>
                    </div>`}
                </div>
                <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 rounded-full border-4 border-white/50 shadow-lg overflow-hidden bg-pink-100 flex-shrink-0">
                        ${App.state.user.avatarUrl ?
                `<img src="${App.state.user.avatarUrl}" class="w-full h-full object-cover" referrerpolicy="no-referrer" onerror="this.classList.add('hidden'); if(this.nextElementSibling) this.nextElementSibling.classList.remove('hidden');">` : ''
            }
                        <div class="w-full h-full flex items-center justify-center ${App.state.user.avatarUrl ? 'hidden' : ''}"><i data-lucide="user" class="w-8 h-8 text-pink-300"></i></div>
                    </div>
                    <div class="text-center">
                        <h2 class="text-2xl font-bold text-white drop-shadow-md">Stay Kawaii, ${App.state.user.username.split(' ')[0]}! ✨</h2>
                        <p class="text-[10px] text-white/70">ID: ${App.state.user.kawaiiId}</p>
                </div>
                <div class="flex gap-4 flex-wrap justify-center">
                    <button onclick="App.setView('draw')" class="btn-bubbly btn-primary hover:scale-105 active:scale-95 shrink-0">
                        <i data-lucide="palette"></i> Doodle! 🎨
                    </button>
                    <button onclick="App.setView('history')" class="btn-bubbly bg-blue-100 border-blue-200 text-blue-500 hover:scale-105 active:scale-95 shrink-0 relative">
                        <i data-lucide="history"></i> History 📜
                        ${App.state.unreadCount > 0 ? `
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                            ${App.state.unreadCount}
                        </span>` : ''}
                    </button>
                    ${!App.state.notificationsEnabled ? `
                    <!-- Unified Signal Activation -->
                    <button onclick="App.requestAllPermissions()" class="btn-bubbly bg-yellow-100 border-yellow-200 text-yellow-600 hover:scale-105 active:scale-95 shrink-0 text-xs py-2 px-4 shadow-sm">
                        <i data-lucide="radio" class="w-4 h-4"></i> Activate Notifications 📡
                    </button>
                    ` : ''}
                </div>
            </div>
    `,
        widget: () => `
            <div class="h-screen w-full flex items-center justify-center p-4">
                <div class="w-full aspect-square bg-white/40 backdrop-blur-md rounded-bubbly border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden animate-float">
                    ${App.state.lastDoodle ? `<img src="${App.state.lastDoodle}" class="w-full h-full object-contain p-2" />` : `
                    <div class="text-center p-4">
                        <i data-lucide="sparkles" class="w-12 h-12 mx-auto text-yellow-300 mb-2 animate-pulse"></i>
                        <p class="font-bold text-white text-sm drop-shadow-sm">Magic widget ready...</p>
                    </div>`}
                </div>
            </div>
    `,
        draw: () => `
            <div class="h-full w-full relative flex flex-col items-center animate-fade-in overflow-hidden">
                <!-- Canvas Area -->
                <div class="flex-1 w-full flex items-center justify-center p-6 min-h-0 relative">
                    <div class="relative w-full aspect-square max-w-md max-h-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white overflow-hidden">
                        <canvas id="drawing-canvas" class="w-full h-full touch-none"></canvas>
                    </div>
                </div>
                
                <!-- Controls Area -->
                <div class="w-full shrink-0 z-40 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                    <div class="bg-white/95 backdrop-blur-2xl p-4 rounded-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col gap-3 ring-8 ring-white/50 border border-pink-50">

            <!-- 1. Recipient Selection -->
            <div id="recipient-selection" class="flex items-center gap-2 overflow-x-auto px-4 py-2 border-b border-pink-100/50 no-scrollbar touch-pan-x">
                <span class="text-[10px] font-black text-pink-400 whitespace-nowrap tracking-wider">TO:</span>
                <div id="friend-bubbles" class="flex gap-2">
                    <p class="text-[10px] text-gray-400 font-bold">Loading...</p>
                </div>
            </div>

            <!-- 2. Tools Row -->
            <div class="flex items-center justify-between gap-2">
                <!-- Palette -->
                <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 flex-1 touch-pan-x">
                    <div id="palette-container" class="flex gap-2 shrink-0">
                        <!-- Injected -->
                    </div>
                </div>

                <div class="w-[2px] h-6 bg-gray-100 shrink-0 rounded-full"></div>

                <!-- Toggles -->
                <div class="flex gap-2 shrink-0">
                    <button id="btn-fill-tool" class="w-10 h-10 rounded-full bg-white border-2 border-gray-100 shadow-md flex items-center justify-center hover:scale-110 transition-transform active:bg-pink-50 group">
                        <i data-lucide="paint-bucket" class="w-5 h-5 text-gray-400 group-hover:text-pink-400 transition-colors"></i>
                    </button>
                    <button id="btn-custom-color" class="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 via-purple-400 to-indigo-400 border-2 border-white shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                        <i data-lucide="plus" class="w-5 h-5 text-white"></i>
                    </button>
                    <button onclick="document.getElementById('stamp-modal').classList.remove('hidden')" class="w-10 h-10 rounded-full bg-gradient-to-bl from-yellow-200 via-pink-200 to-purple-200 border-2 border-white shadow-md flex items-center justify-center hover:scale-110 transition-transform active:rotate-12">
                        <span class="text-xl filter drop-shadow-sm">🦄</span>
                    </button>
                </div>
            </div>

            <!-- 3. Sliders & edits -->
            <div class="flex items-center gap-3 bg-gray-50/60 p-2 rounded-xl border border-white/50">
                <i data-lucide="brush" class="w-4 h-4 text-pink-300 shrink-0"></i>
                <input id="brush-size" type="range" min="2" max="40" value="5" class="flex-1 accent-pink-500 h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer">

                    <div class="w-[1px] h-6 bg-gray-200 shrink-0"></div>

                    <div class="flex gap-1 shrink-0">
                        <button id="btn-undo" class="p-2 text-gray-400 hover:text-pink-500 hover:bg-white rounded-lg transition-all active:scale-90">
                            <i data-lucide="undo-2" class="w-5 h-5"></i>
                        </button>
                        <button id="btn-redo" class="p-2 text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg transition-all active:scale-90">
                            <i data-lucide="redo-2" class="w-5 h-5"></i>
                        </button>
                    </div>
            </div>

            <!-- 4. Actions Footer -->
            <div class="flex items-center gap-3 mt-1">
                <button id="clear-canvas" class="p-3 bg-red-50 text-red-400 rounded-full hover:bg-red-100 active:scale-90 transition-all shadow-sm group" title="Clear">
                    <i data-lucide="trash-2" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
                </button>
                <button id="save-draft" class="p-3 bg-blue-50 text-blue-400 rounded-full hover:bg-blue-100 active:scale-90 transition-all shadow-sm group" title="Save">
                    <i data-lucide="save" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
                </button>
                <button id="send-doodle" class="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-full font-black shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-base tracking-wide">
                    <span>SEND MAGIC</span> <i data-lucide="send" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- HIDDEN STAMP MODAL (Absolute Overlay) -->
            <div id="stamp-modal" class="hidden absolute inset-0 bg-white/95 backdrop-blur-md rounded-[2rem] z-50 flex flex-col p-4 animate-fade-in">
                <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <h3 class="font-bold text-gray-500 flex items-center gap-2">
                        <span class="text-xl">✨</span> Choose a Stamp
                    </h3>
                    <button onclick="document.getElementById('stamp-modal').classList.add('hidden')" class="bg-gray-100 text-gray-500 p-1.5 rounded-full hover:bg-gray-200 transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="grid grid-cols-5 gap-3 overflow-y-auto no-scrollbar pb-10 content-start">
                    ${['🦄', '💖', '⭐', '🌸', '🎀', '🐱', '🐰', '🍄', '🍭', '⚡', '🔥', '🌈', '🍕', '🎉', '🦋', '🌵', '🍩', '🚀', '👽', '💎', '🎨', '🧸', '🎵', '👻', '💩'].map(emoji => `
                                <button class="stamp-btn text-2xl hover:scale-125 active:scale-90 transition-transform p-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm aspect-square flex items-center justify-center" 
                                    data-stamp="${emoji}"
                                    onclick="document.getElementById('stamp-modal').classList.add('hidden')">
                                    ${emoji}
                                </button>
                            `).join('')}
                </div>
            </div>
        </div>
    </div>
`,
        friends: () => `
        <div class="w-full max-w-md flex flex-col gap-4 animate-slide-up">
                <div class="bg-white/60 p-4 rounded-bubbly shadow-sm">
                    <h3 class="font-bold mb-3 flex items-center gap-2">
                        <i data-lucide="search" class="w-4 h-4"></i> Find Friends
                    </h3>
                    <div class="flex gap-2">
                        <input id="friend-id-input" type="text" placeholder="Enter Kawaii ID..." class="flex-1 bg-white px-4 py-2 rounded-full border-none focus:ring-2 focus:ring-pink-300 outline-none">
                        <button id="btn-search-friend" class="bg-pink-400 text-white p-2 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all">
                            <i data-lucide="user-plus"></i>
                        </button>
                    </div>
                </div>
                <div id="friend-list" class="flex flex-col gap-2">
                    <!-- Loaded dynamically -->
                </div>
            </div>
`,
        profile: () => `
    <div class="flex flex-col items-center gap-6 w-full max-w-sm animate-slide-up">
                <div class="w-24 h-24 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                    ${App.state.user.avatarUrl ?
                `<img src="${App.state.user.avatarUrl}" class="w-full h-full object-cover" referrerpolicy="no-referrer" onerror="this.classList.add('hidden'); if(this.nextElementSibling) this.nextElementSibling.classList.remove('hidden');">` : ''
            }
                    <i data-lucide="user" class="w-12 h-12 text-gray-300 ${App.state.user.avatarUrl ? 'hidden' : ''}"></i>
                </div>
                <div class="text-center">
                    <p class="text-xl font-bold border-none outline-none py-1">${App.state.user.username}</p>
                    <div class="flex items-center justify-center gap-3 mt-2">
                        <p class="text-pink-500 font-bold text-sm tracking-wide bg-pink-50 px-3 py-1 rounded-lg border border-pink-100">${App.state.user.kawaiiId}</p>
                        <button onclick="navigator.clipboard.writeText('${App.state.user.kawaiiId}').then(() => App.toast('Copied! 📋', 'pink'))" class="p-2 bg-pink-100 rounded-full hover:bg-pink-200 active:scale-95 transition-all shadow-sm">
                            <i data-lucide="copy" class="w-4 h-4 text-pink-500"></i>
                        </button>
                    </div>
                </div>
                
                <div class="bg-white/60 p-4 rounded-bubbly w-full max-w-xs text-center flex flex-col gap-2">
                    <p class="text-[10px] font-medium mb-1">Signed in via Google ✨</p>
                    <button onclick="App.signOut()" class="bg-white border-2 border-red-100 text-red-400 px-6 py-2 rounded-full font-bold shadow-sm text-xs hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all w-full">
                        Sign Out
                    </button>
                </div>

                <!-- Hidden Technical Settings -->
                <div id="admin-settings" class="hidden bg-white/60 p-6 rounded-bubbly w-full shadow-sm flex flex-col gap-4">
                    <h3 class="font-bold text-sm text-gray-500 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <i data-lucide="settings" class="w-4 h-4"></i> Account Connection
                    </h3>
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 ml-2">CONNECTION URL</label>
                        <input id="sb-url" type="text" value="${App.state.config.url}" placeholder="https://xyz.supabase.co" class="w-full bg-white px-4 py-2 rounded-full border-none focus:ring-2 focus:ring-pink-300 outline-none text-sm mt-1">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 ml-2">ACCESS KEY</label>
                        <input id="sb-key" type="password" value="${App.state.config.key}" placeholder="eyJhbG..." class="w-full bg-white px-4 py-2 rounded-full border-none focus:ring-2 focus:ring-pink-300 outline-none text-sm mt-1">
                    </div>
                    <button onclick="App.handleSaveConfig()" class="bg-pink-400 text-white px-8 py-2 rounded-full font-bold shadow-md hover:bg-pink-500 active:scale-95 transition-all mt-2">
                        Save Setup
                    </button>
                </div>
            </div>
    `,
        history: () => `
    <div class="w-full max-w-md flex flex-col gap-4 animate-slide-up">
                <header class="text-center mb-2">
                    <h2 class="text-2xl font-black text-white drop-shadow-md">Magic History 📜</h2>
                    <p class="text-white/70 text-xs italic">All your sent and received doodles ✨</p>
                </header>
                <div class="flex flex-col gap-4">
                    <!-- Drafts Section -->
                    ${(() => {
                const drafts = App.state.drafts || [];
                if (drafts.length === 0) return '';
                return `
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
                            </div>
                        `;
            })()}

                    <!-- History List -->
                    ${App.state.history.length === 0 ? `<p class="text-center text-white/60 py-20">No magic found yet... 🥺</p>` :
                App.state.history.map(d => `
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
                        // The other person's ID (receiver if sent, sender if received)
                        const otherId = isSent ? d.receiver_id : d.sender_id;
                        // Use the new Cache first, then Friend list, then generic fallback
                        const cacheName = App.state.userCache ? App.state.userCache[otherId] : null;
                        const friend = (Social.friends || []).find(f => f.id === otherId);

                        let name = cacheName || (friend ? friend.username : 'Unknown');
                        if (name === 'Unknown' && otherId) name = otherId.substring(0, 6) + '...'; // Short ID fallback

                        // Multi-recipient formatting
                        if (isSent && d.recipients && d.recipients.length > 0) {
                            const names = d.recipients.map(rid => {
                                const cName = App.state.userCache ? App.state.userCache[rid] : null;
                                const f = (Social.friends || []).find(fr => fr.id === rid);
                                return cName || (f ? f.username : rid.substring(0, 5) + '..');
                            });
                            // Join all names
                            return `TO: ${names.join(', ')} 📤`;
                        }

                        return isSent ? `TO: ${name} 📤` : `
                                            <div class="flex items-center gap-1">
                                                <div class="w-4 h-4 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                                    ${(() => {
                                const av = App.state.avatarCache ? App.state.avatarCache[otherId] : null;
                                return av ? `<img src="${av}" class="w-full h-full object-cover">` : '<i data-lucide="user" class="w-3 h-3 m-auto mt-0.5 text-gray-400"></i>';
                            })()}
                                                </div>
                                                FROM: ${name} 📥
                                            </div>`;
                    })()}
                                </span>
                                <span class="text-gray-400">${new Date(d.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <!-- Spacer for floating nav -->
    <div class="h-32 w-full"></div>
        `
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

    async saveDraft(imageData) {
        if (!this.state.supabase || !this.state.session) {
            this.toast('Login to save drafts! ☁️', 'blue');
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
            if (error) throw error;
            this.toast('Sketch saved! ✨', 'pink');
            this.loadHistory(); // Refresh
        } catch (e) {
            console.error(e);
            this.toast('Failed to save sketch 😭', 'blue');
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

    confirmKawaii({ title, message, okText, onConfirm }) {
        const modal = document.getElementById('confirm-modal');
        if (!modal) return;

        document.getElementById('confirm-title').innerText = title || "Magic Request?";
        document.getElementById('confirm-message').innerText = message || "";
        const okBtn = document.getElementById('confirm-ok');
        okBtn.innerText = okText || "Yes! ✨";

        modal.classList.remove('hidden');

        const close = () => modal.classList.add('hidden');

        okBtn.onclick = () => {
            close();
            if (onConfirm) onConfirm();
        };

        document.getElementById('confirm-cancel').onclick = close;
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
    App.init();

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
