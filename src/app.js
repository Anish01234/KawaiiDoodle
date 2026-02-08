/**
 * Kawaii Doodle - App Controller
 */

const App = {
    state: {
        view: 'home',
        user: {
            username: localStorage.getItem('user-name') || '',
            kawaiiId: localStorage.getItem('user-id') || ''
        },
        session: null,
        lastDoodle: null,
        history: [],
        activeRecipients: [],
        supabase: null,
        config: {
            url: window.CONFIG?.SUPABASE_URL || localStorage.getItem('sb-url') || '',
            key: window.CONFIG?.SUPABASE_KEY || localStorage.getItem('sb-key') || ''
        },
        magicClickCount: 0,
        bootLogs: []
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

    async init() {
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
                        localStorage.setItem('user-name', profile.username);
                        localStorage.setItem('user-id', profile.kawaii_id);
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

        } catch (e) {
            console.error("Critical Init Error:", e);
            this.toast('Magic startup failed... trying offline mode 🩹', 'blue');
            this.state.view = 'landing';
            this.renderView();
            this.finalizeInit();
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

    finalizeInit() {
        this.setupNavigation();
        if (window.lucide) lucide.createIcons();
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
    },

    async loadHistory() {
        if (!this.state.supabase || !this.state.session) return;
        try {
            const { data, error } = await this.state.supabase
                .from('doodles')
                .select('*')
                .or(`sender_id.eq.${this.state.session.user.id},receiver_id.eq.${this.state.session.user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.state.history = data;
            if (data.length > 0) {
                this.state.lastDoodle = data[0].image_data;
                // Auto-set wallpaper if it's for me and new!
                this.setSmartWallpaper(data[0]);
            }
            if (this.state.view === 'home' || this.state.view === 'history') this.renderView();
        } catch (e) {
            console.error("History load failed:", e);
        }
    },

    async setSmartWallpaper(doodle) {
        if (!doodle || !doodle.image_data) return;

        // Only set wallpaper if *I* am the receiver
        if (doodle.receiver_id !== this.state.session.user.id) return;

        // Check if we already set this one to avoid spamming toast/plugin calls
        const lastSetId = localStorage.getItem('last-wallpaper-id');
        if (doodle.id === lastSetId) {
            console.log("Wallpaper already set for doodle:", doodle.id);
            return;
        }

        if (window.plugins && window.plugins.wallpaper) {
            console.log("🖼️ Setting Smart Wallpaper for:", doodle.id);
            this.toast('Updating lock screen... 📱', 'blue');

            window.plugins.wallpaper.setImageBase64(
                doodle.image_data,
                () => {
                    console.log("Wallpaper set successfully!");
                    this.toast('Lock screen updated! ✨', 'pink');
                    localStorage.setItem('last-wallpaper-id', doodle.id);
                },
                (err) => {
                    console.error("Wallpaper error:", err);
                    this.toast('Failed to set wallpaper 🥺', 'blue');
                },
                'lock'
            );
        }
    },


    async syncProfile() {
        if (!this.state.supabase || !this.state.user.username || !this.state.user.kawaiiId) return;
        try {
            const user = (await this.state.supabase.auth.getUser()).data.user;
            if (!user) return;

            const { error } = await this.state.supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: this.state.user.username,
                    kawaii_id: this.state.user.kawaiiId
                });

            if (error) console.log("Profile sync failed:", error.message);
            else console.log("✨ Profile synced!");
        } catch (e) { console.log("Sync error:", e); }
    },

    subscribeToDoodles() {
        if (!this.state.supabase) return;

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

        console.log("📡 Listening for forest magic...");
    },

    async handleGoogleSignIn() {
        if (!this.state.supabase) {
            this.toast('Login is currently unavailable! 🥺', 'blue');
            return;
        }

        // Native Google Sign-In (No Browser)
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            try {
                this.toast('Opening native Google login... 📱', 'blue');
                const { GoogleAuth } = window.Capacitor.Plugins;
                if (!GoogleAuth) throw new Error("GoogleAuth plugin not found");

                // Initialize GoogleAuth first
                try {
                    await GoogleAuth.initialize();
                } catch (initError) {
                    console.log("GoogleAuth already initialized or init not needed:", initError);
                }

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
                    this.toast('Login Successful! 🎉', 'pink');
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
            if (viewName === 'history') this.loadHistory();
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
        if (!this.state.session && this.state.view !== 'landing' && this.state.view !== 'widget' && this.state.view !== 'setup') {
            this.state.view = 'landing';
        }

        // Toggle Header/Nav based on view
        const hideNav = ['landing', 'setup', 'widget'].includes(this.state.view);
        if (header) header.style.display = hideNav ? 'none' : 'flex';
        if (nav) nav.style.display = hideNav ? 'none' : 'flex';

        // Get Template
        let html = '';
        if (this.templates[this.state.view]) {
            html = this.templates[this.state.view]();
        } else {
            html = `<div class="flex-center" style="height: 100vh;">404 - Kawaii Not Found 😭</div>`;
        }

        // Render with Global Transition
        content.innerHTML = `<div class="view-transition" style="width: 100%; height: 100%;">${html}</div>`;

        // Post-Render Effects
        if (window.lucide) lucide.createIcons();

        // Specific View Logic
        if (this.state.view === 'draw') {
            if (window.initCanvas) {
                // slight delay to ensure DOM is ready and layout is settled
                requestAnimationFrame(() => window.initCanvas());
            }
        }

        if (this.state.view === 'friends' && window.Social) {
            Social.renderFriendsList();
        }
    },

    templates: {
        landing: () => `
            <div class="layout-container flex-center" style="background: var(--primary-gradient)">
                <div class="card-premium flex-center flex-col gap-8 animate-float" style="background: rgba(255,255,255,0.9); padding: 40px; margin: 20px;">
                    <img src="src/assets/logo.png" style="width: 120px; height: 120px; border-radius: 30px; box-shadow: 0 10px 30px rgba(255,105,180,0.3);" />
                    
                    <div class="text-center">
                        <h1 style="font-size: 24px; font-weight: 800; color: #333; margin-bottom: 8px;">Kawaii Doodle</h1>
                        <p style="color: #666; font-size: 14px;">Hand-drawn magic for friends ✨</p>
                    </div>

                    <button onclick="App.handleGoogleSignIn()" class="btn-premium" style="width: 100%; justify-content: center;">
                        <span style="font-size: 16px;">Sign in with Google</span>
                        <i data-lucide="arrow-right" style="width: 18px;"></i>
                    </button>
                    
                    <button onclick="App.toggleReleaseNotes()" class="btn-icon" style="position: absolute; top: 20px; right: 20px;">
                        <i data-lucide="sparkles" style="color: #FFD700;"></i>
                    </button>
                    
                    <div style="font-size: 10px; color: #999; margin-top: 20px;">
                        v2.5 • Billion Dollar Polish
                    </div>
                </div>
                 
                 <div id="release-notes-modal" class="hidden absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex-center" onclick="this.classList.add('hidden')">
                    <div class="card-premium" style="width: 80%; max-width: 320px;" onclick="event.stopPropagation()">
                        <h3 style="font-weight: 800; margin-bottom: 16px; color: #333; display: flex; justify-content: space-between;">
                            What's New ✨
                            <button onclick="document.getElementById('release-notes-modal').classList.add('hidden')"><i data-lucide="x" style="width:16px"></i></button>
                        </h3>
                        <div style="font-size: 13px; color: #555; line-height: 1.6;">
                            <p style="margin-bottom:8px">• <b>Fluid Motion</b>: Everything feels alive.</p>
                            <p style="margin-bottom:8px">• <b>Smart Toasts</b>: Notifications never stack.</p>
                            <p>• <b>Zero Clipping</b>: Pixel perfect layout.</p>
                        </div>
                    </div>
                 </div>
            </div>
        `,
        setup: () => `
            <div class="layout-container flex-center">
                <div class="card-premium flex-center flex-col gap-6" style="width: 100%; max-width: 340px;">
                    <div class="text-center">
                        <h2 style="font-size: 24px; font-weight: 800; color: #333; margin-bottom: 8px;">Welcome Home! 🏡</h2>
                        <p style="color: #666; font-size: 14px;">What should your friends call you?</p>
                    </div>
                    
                    <input id="setup-name" type="text" placeholder="Your Sweet Name..." style="width: 100%; padding: 16px; border-radius: 16px; border: 1px solid #eee; background: #f9f9f9; text-align: center; font-size: 18px; font-weight: bold; outline: none; color: #d05e94;">
                    
                    <button onclick="App.completeSetup(document.getElementById('setup-name').value)" class="btn-premium" style="width: 100%; justify-content: center;">
                        Let's Go! 🚀
                    </button>
                </div>
            </div>
        `,
        home: () => `
            <div class="layout-container" style="justify-content: center; gap: 24px;">
                <div class="card-premium flex-center" style="height: 320px; position: relative; overflow: hidden; padding: 0;">
                     ${App.state.lastDoodle ?
                `<img src="${App.state.lastDoodle}" style="width: 100%; height: 100%; object-fit: contain;" />` :
                `<div class="text-center" style="opacity: 0.5;">
                            <i data-lucide="image" style="width: 48px; height: 48px; margin-bottom: 12px; color: #ccc"></i>
                            <p style="color: #ccc">No doodles yet...</p>
                         </div>`
            }
                </div>
                
                <div class="text-center">
                    <h2 style="font-size: 28px; font-weight: 800; color: #333;">Hello, ${App.state.user.username.split(' ')[0]}</h2>
                    <p style="color: #888; font-size: 13px; margin-top: 4px; font-family: monospace;">ID: ${App.state.user.kawaiiId}</p>
                </div>

                <div class="flex-center" style="gap: 16px;">
                    <button onclick="App.setView('draw')" class="btn-premium" style="flex: 1; height: 56px;">
                        <i data-lucide="palette"></i> Doodle
                    </button>
                    <button onclick="App.setView('history')" class="btn-premium" style="flex: 1; height: 56px; background: white; color: #333; border: 1px solid #eee; box-shadow: none;">
                        <i data-lucide="history"></i> History
                    </button>
                </div>
            </div>
        `,
        widget: () => `
             <div class="layout-container flex-center">
                <div class="card-premium flex-center" style="width: 100%; aspect-ratio: 1;">
                    ${App.state.lastDoodle ? `<img src="${App.state.lastDoodle}" style="width: 100%; height: 100%; object-fit: contain;" />` : `
                    <div class="text-center">
                        <i data-lucide="sparkles" style="width: 48px; height: 48px; color: #FFD700; margin-bottom: 8px;" class="pulse-animation"></i>
                        <p style="font-weight: bold; color: #888;">Widget Ready</p>
                    </div>`}
                </div>
            </div>
        `,
        draw: () => `
            <div class="layout-container" style="padding: 16px; gap: 16px;">
                <!-- Canvas Area -->
                <div style="flex: 1; position: relative; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background: white;">
                    <canvas id="drawing-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
                </div>

                <!-- Tools Card -->
                <div class="card-premium" style="display: flex; flex-direction: column; gap: 16px;">
                    
                    <!-- Recipients (Horizontal Scroll) -->
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                         <span style="font-size: 10px; font-weight: 800; color: #d05e94; letter-spacing: 1px;">SEND TO</span>
                         <div style="display: flex; gap: 8px; overflow-x: auto; max-width: 70%;" class="no-scrollbar" id="friend-bubbles">
                             <div style="font-size: 10px; color: #ccc;">Loading...</div>
                         </div>
                    </div>

                    <!-- Actions Row -->
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; gap: 8px;">
                            <button id="btn-undo" class="btn-icon"><i data-lucide="undo-2" style="width: 18px;"></i></button>
                            <button id="clear-canvas" class="btn-icon" style="color: #FF6B6B;"><i data-lucide="trash-2" style="width: 18px;"></i></button>
                        </div>
                        
                        <div style="display: flex; gap: 8px;" id="palette-container">
                            <!-- Colors injected here -->
                        </div>

                        <button id="send-doodle" class="btn-premium" style="padding: 10px 20px; border-radius: 16px; font-size: 14px;">
                            Send <i data-lucide="send" style="width: 14px;"></i>
                        </button>
                    </div>
                    
                    <!-- Hidden Brushes / Stamps (Simplified for now) -->
                     <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px;"> 
                        <div style="display: flex; gap: 12px;">
                            <button class="stamp-btn" data-stamp="💖" style="font-size: 20px;">💖</button>
                            <button class="stamp-btn" data-stamp="⭐" style="font-size: 20px;">⭐</button>
                        </div>
                        <input id="brush-size" type="range" min="2" max="40" value="5" style="width: 100px; accent-color: #d05e94;">
                     </div>
                </div>
            </div>
        `,
        friends: () => `
             <div class="layout-container">
                <div class="card-premium" style="margin-bottom: 24px;">
                    <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #333;">Find Friends</h2>
                    <div style="display: flex; gap: 8px;">
                        <input id="friend-id-input" type="text" placeholder="Enter Kawaii ID..." style="flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #eee; outline: none;">
                        <button id="btn-search-friend" class="btn-premium" style="padding: 0 16px; width: 48px; border-radius: 12px;"><i data-lucide="search" style="width: 20px;"></i></button>
                    </div>
                </div>
                <!-- Dynamic List Container -->
                <div id="friend-list" style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding-bottom: 100px;">
                    <!-- Friend items will render here with card-premium style -->
                </div>
             </div>
        `,
        profile: () => `
            <div class="layout-container flex-center">
                <div class="card-premium" style="width: 100%; max-width: 320px; text-align: center;">
                    <div style="width: 80px; height: 80px; background: #fff; border: 2px solid #eee; border-radius: 50%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                         <i data-lucide="user" style="width: 32px; color: #ccc;"></i>
                    </div>
                    <h2 style="font-size: 20px; font-weight: 700; color: #333;">${App.state.user.username}</h2>
                    
                    <div style="background: #f9f9f9; padding: 12px; border-radius: 12px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eee;">
                        <span style="font-family: monospace; font-size: 14px; color: #555;">${App.state.user.kawaiiId}</span>
                        <button onclick="navigator.clipboard.writeText('${App.state.user.kawaiiId}').then(() => App.toast('Copied! 📋', 'pink'))" class="btn-icon" style="width: 32px; height: 32px;">
                            <i data-lucide="copy" style="width: 14px; color: #888;"></i>
                        </button>
                    </div>

                    <button onclick="App.state.supabase.auth.signOut().then(() => location.reload())" class="btn-premium" style="background: #eee; color: #555; width: 100%; margin-top: 8px; box-shadow: none;">
                        Sign Out
                    </button>
                    
                     <!-- Hidden Admin Settings -->
                    <div id="admin-settings" class="hidden" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                        <input id="sb-url" type="text" placeholder="URL" value="${App.state.config.url}" style="width: 100%; margin-bottom: 8px; padding: 8px; border: 1px solid #eee; border-radius: 8px;">
                        <input id="sb-key" type="password" placeholder="Key" value="${App.state.config.key}" style="width: 100%; margin-bottom: 8px; padding: 8px; border: 1px solid #eee; border-radius: 8px;">
                        <button onclick="App.handleSaveConfig()" class="btn-premium" style="font-size: 12px; padding: 8px;">Save Connections</button>
                    </div>
                </div>
            </div>
        `,
        history: () => `
            <div class="layout-container">
                <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 16px; padding-left: 8px; color: #333;">History</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; overflow-y: auto; padding-bottom: 20px;">
                    ${App.state.history.length === 0 ? `<p style="grid-column: span 2; text-align: center; color: #999; margin-top: 40px;">No magic yet...</p>` :
                App.state.history.map(d => `
                        <div class="card-premium" style="padding: 8px; border-radius: 16px; display: flex; flex-direction: column;">
                            <img src="${d.image_data}" style="width: 100%; aspect-ratio: 1; object-fit: contain; background: white; border-radius: 12px; margin-bottom: 8px; border: 1px solid #eee;" />
                            <div style="font-size: 10px; color: #888; text-align: right; margin-top: auto;">
                                ${new Date(d.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
    },

    // Elite Haptics Helper
    haptic(type = 'light') {
        if (!navigator.vibrate) return;
        if (type === 'success') navigator.vibrate(10); // Tiny tick
        if (type === 'medium') navigator.vibrate(20);
        if (type === 'heavy') navigator.vibrate([30, 50, 30]); // Error/Destructive
    },

    // --- Elite Tier Singleton Toast ---
    toast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const existing = container.querySelector('.toast-pill');

        // Pulse logic for Singleton
        if (existing) {
            const textSpan = existing.querySelector('span');
            if (textSpan) textSpan.innerText = message;

            // Trigger reflow for pulse animation
            existing.classList.remove('pulse-animation');
            void existing.offsetWidth; // Force reflow
            existing.classList.add('pulse-animation');

            // Reset timeout
            clearTimeout(existing.dismissTimeout);
            existing.dismissTimeout = setTimeout(() => {
                existing.style.opacity = '0';
                existing.style.transform = 'translateY(-20px)';
                setTimeout(() => existing.remove(), 300);
            }, 3000);
            return;
        }

        // Create new Pill
        const toast = document.createElement('div');
        toast.className = 'toast-pill';

        // Icon based on type
        const iconName = type === 'pink' || type === 'success' ? 'sparkles' : 'info';
        const iconColor = type === 'pink' ? '#FF69B4' : '#4A90E2';

        toast.innerHTML = `
            <i data-lucide="${iconName}" style="color: ${iconColor}; width: 18px; height: 18px;"></i>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        toast.dismissTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    createSparkle(x, y) {
        // High-end particle logic could go here, keeping simple for now to focus on UI
        const s = document.createElement('div');
        s.style.position = 'fixed';
        s.style.left = x + 'px';
        s.style.top = y + 'px';
        s.style.width = '6px';
        s.style.height = '6px';
        s.style.backgroundColor = '#FFD1DC';
        s.style.borderRadius = '50%';
        s.style.pointerEvents = 'none';
        s.className = 'view-transition'; // Reuse fade animation
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 500);
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
                <div class="w-10 h-10 ${canSelect ? 'bg-pink-100 text-pink-500' : 'bg-gray-200 text-gray-400'} rounded-full flex items-center justify-center">
                    <i data-lucide="user" class="w-5 h-5"></i>
                </div>
                <div class="flex-1">
                    <p class="font-bold text-gray-700">${f.username}</p>
                    <p class="text-[10px] ${canSelect ? 'text-pink-400' : 'text-gray-400'}">${f.id} ${isPending ? '(Pending ⏳)' : ''}</p>
                </div>
                ${canSelect ? `<i data-lucide="send" class="text-pink-300 w-5 h-5"></i>` : ''}
            </button>
        `}).join('');

        if (list.innerHTML === '') {
            list.innerHTML = `<p class="text-center text-gray-400 italic py-4">No friends found... 🥺</p>`;
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

        this.toast(`Selected ${username}! 🎯`, 'pink');
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
