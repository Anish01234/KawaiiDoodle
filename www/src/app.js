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
                if (window.initCanvas) window.initCanvas();
                break;
            case 'friends': content.innerHTML = this.templates.friends(); break;
            case 'profile': content.innerHTML = this.templates.profile(); break;
            case 'history': content.innerHTML = this.templates.history(); break;
            case 'widget': content.innerHTML = this.templates.widget(); break;
            default: content.innerHTML = `<div>404 - Kawaii Not Found 😭</div>`;
        }
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
                    <p class="text-white/80 font-medium italic mt-4">Hand-drawn magic for friends ✨ (v2.1)</p>
                </div>
                
                <!-- Release Notes Button -->
                <button onclick="App.toggleReleaseNotes()" class="absolute top-4 left-4 p-2 bg-white/80 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border-2 border-yellow-200 z-50">
                    <i data-lucide="sparkles" class="w-6 h-6 text-yellow-400"></i>
                </button>

                <!-- Hidden Release Notes Modal -->
                <div id="release-notes-modal" class="hidden absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-8 backdrop-blur-sm" onclick="this.classList.add('hidden')">
                    <div class="bg-white w-full max-w-sm h-3/4 rounded-bubbly shadow-2xl relative flex flex-col transform rotate-1 border-4 border-pink-100" onclick="event.stopPropagation()">
                        
                        <!-- Header -->
                        <div class="p-6 border-b border-pink-50 bg-pink-50/50 rounded-t-bubbly">
                            <h3 class="font-bold text-xl text-pink-500 flex justify-between items-center">
                                <span>What's New? ✨</span>
                                <button onclick="document.getElementById('release-notes-modal').classList.add('hidden')" class="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow-sm">
                                    <i data-lucide="x" class="w-5 h-5"></i>
                                </button>
                            </h3>
                            <p class="text-xs text-pink-300 font-bold mt-1">Version 2.4 - The Polish Update!</p>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 p-6 overflow-y-auto text-left space-y-4">
                            
                            <div class="bg-pink-50 p-3 rounded-xl border border-pink-100">
                                <h4 class="font-bold text-pink-500 text-sm mb-1">🚫 No More "Syncing..."</h4>
                                <p class="text-xs text-gray-500">Removed the annoying cloud message on login. It's smoother now!</p>
                            </div>

                            <div class="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <h4 class="font-bold text-blue-500 text-sm mb-1">🎨 Safer Doodling</h4>
                                <p class="text-xs text-gray-500">Clicking the "Doodle" tab won't reset your canvas anymore.</p>
                            </div>

                            <div class="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                                <h4 class="font-bold text-yellow-500 text-sm mb-1">👯 Better Friend List</h4>
                                <p class="text-xs text-gray-500">Selection circles are fully visible, and you can now <b>Copy IDs</b> in your profile!</p>
                            </div>
                            
                            <div class="bg-green-50 p-3 rounded-xl border border-green-100">
                                <h4 class="font-bold text-green-500 text-sm mb-1">🚀 Smart Sending</h4>
                                <p class="text-xs text-gray-500">Sending to multiple friends is faster and shows just one success message.</p>
                            </div>

                             <p class="text-[10px] text-center text-gray-300 italic pt-4">Thanks for being a tester! 💖</p>
                        </div>
                    </div>
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
                
                <div class="text-center">
                    <p class="text-white/50 text-[10px] max-w-[200px] mx-auto">By continuing, you agree to spread kawaii vibes only! 💖</p>
                    <p class="text-white/30 text-[8px] mt-2 font-mono">Build: ${new Date().toLocaleTimeString()} (v2.4)</p>
                </div>
            </div>
        `,
        setup: () => `
            <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
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
            <div class="flex flex-col items-center gap-6 animate-float">
                <div class="w-64 h-64 bg-white/60 rounded-bubbly border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                    ${App.state.lastDoodle ? `<img src="${App.state.lastDoodle}" class="w-full h-full object-contain" />` : `
                    <div class="text-center p-4">
                        <i data-lucide="image" class="w-12 h-12 mx-auto text-pink-300 mb-2"></i>
                        <p class="font-bold text-pink-400 text-sm">Waiting for a doodle...</p>
                    </div>`}
                </div>
                <div class="text-center">
                    <h2 class="text-2xl font-bold text-white drop-shadow-md">Stay Kawaii, ${App.state.user.username.split(' ')[0]}! ✨</h2>
                    <p class="text-[10px] text-white/70">ID: ${App.state.user.kawaiiId}</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="App.setView('draw')" class="btn-bubbly btn-primary hover:scale-105">
                        <i data-lucide="palette"></i> Doodle! 🎨
                    </button>
                    <button onclick="App.setView('history')" class="btn-bubbly bg-blue-100 border-blue-200 text-blue-500 hover:scale-105">
                        <i data-lucide="history"></i> History 📜
                    </button>
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
            <div class="w-full h-full flex flex-col gap-4">
                <canvas id="drawing-canvas" class="flex-1 bg-white rounded-bubbly border-4 border-pink-200 shadow-inner w-full touch-none"></canvas>
                
                <div class="flex flex-col gap-3 bg-white/60 p-4 rounded-bubbly shadow-sm">
                    <!-- Recipient Selection Bar -->
                    <div id="recipient-selection" class="flex items-center gap-2 overflow-x-auto py-4 px-2 border-b border-pink-100 mb-1 no-scrollbar">
                        <span class="text-[10px] font-bold text-pink-400 whitespace-nowrap">SEND TO:</span>
                        <div id="friend-bubbles" class="flex gap-2">
                           <p class="text-[10px] text-gray-400">Loading friends...</p>
                        </div>
                    </div>

                    <!-- Enhanced Color Palette -->
                    <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                         <div id="palette-container" class="flex gap-2">
                            <!-- Injected by initCanvas -->
                         </div>
                         <div class="w-[2px] h-6 bg-gray-200 mx-1"></div>
                         <button id="btn-custom-color" class="relative hover:scale-110 transition-transform">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 border-2 border-white shadow-sm flex items-center justify-center">
                                <i data-lucide="plus" class="w-4 h-4 text-white"></i>
                            </div>
                         </button>
                    </div>

                    <div class="flex justify-between items-center gap-2">
                        <!-- Undo/Redo -->
                        <div class="flex gap-1 bg-gray-100 p-1 rounded-full">
                            <button id="btn-undo" class="w-8 h-8 rounded-full bg-white text-gray-400 shadow-sm flex items-center justify-center hover:text-pink-500 disabled:opacity-50">
                                <i data-lucide="undo-2" class="w-4 h-4"></i>
                            </button>
                            <button id="btn-redo" class="w-8 h-8 rounded-full bg-white text-gray-400 shadow-sm flex items-center justify-center hover:text-pink-500 disabled:opacity-50">
                                <i data-lucide="redo-2" class="w-4 h-4"></i>
                            </button>
                        </div>

                        <!-- Stamps -->
                        <div class="flex gap-2 bg-pink-50 p-1 rounded-full px-3">
                            <button class="stamp-btn text-xl hover:scale-125 transition-transform" data-stamp="💖">💖</button>
                            <button class="stamp-btn text-xl hover:scale-125 transition-transform" data-stamp="🍭">🍭</button>
                            <button class="stamp-btn text-xl hover:scale-125 transition-transform" data-stamp="⭐">⭐</button>
                            <button class="stamp-btn text-xl hover:scale-125 transition-transform" data-stamp="🎀">🎀</button>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-3 border-t border-pink-100 pt-3">
                        <i data-lucide="brush" class="w-4 h-4 text-gray-400"></i>
                        <input id="brush-size" type="range" min="2" max="40" value="5" class="flex-1 accent-pink-400">
                        <button id="clear-canvas" class="p-2 hover:bg-red-50 text-red-400 rounded-full transition-colors" title="Clear All">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                        <button id="send-doodle" class="bg-pink-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-pink-600 active:scale-95 transition-all flex items-center gap-2">
                            <span>Send</span> <i data-lucide="send" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `,
        friends: () => `
            <div class="w-full max-w-md flex flex-col gap-4">
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
            <div class="flex flex-col items-center gap-6 w-full max-w-sm">
                <div class="w-24 h-24 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                    <i data-lucide="user" class="w-12 h-12 text-gray-300"></i>
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
                    <button onclick="App.state.supabase.auth.signOut().then(() => location.reload())" class="bg-gray-100 text-gray-500 px-6 py-2 rounded-full font-bold shadow-sm text-xs hover:bg-gray-200 active:scale-95 transition-all">
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
            <div class="w-full max-w-md flex flex-col gap-4">
                <header class="text-center mb-2">
                    <h2 class="text-2xl font-black text-white drop-shadow-md">Magic History 📜</h2>
                    <p class="text-white/70 text-xs italic">All your sent and received doodles ✨</p>
                </header>
                <div class="flex flex-col gap-4">
                    ${App.state.history.length === 0 ? `<p class="text-center text-white/60 py-20">No magic found yet... 🥺</p>` :
                App.state.history.map(d => `
                        <div class="bg-white/80 p-4 rounded-bubbly shadow-lg animate-float">
                            <img src="${d.image_data}" class="w-full aspect-square object-contain rounded-xl mb-3 bg-white shadow-inner" />
                            <div class="flex justify-between items-center text-[10px] font-bold text-pink-400">
                                <span>${d.sender_id === App.state.session.user.id ? 'SENT 📤' : 'RECEIVED 📥'}</span>
                                <span class="text-gray-400">${new Date(d.created_at).toLocaleDateString()}</span>
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
        // Pill shape, centered, backdrop blur
        toast.className = `toast-enter glass px-6 py-3 rounded-full shadow-2xl mb-4 font-bold flex items-center gap-3 text-white z-[100] backdrop-blur-md border border-white/20`;

        // Elite Color Palette (Vibrant & Clean)
        if (type === 'pink') {
            toast.classList.add('bg-gradient-to-r', 'from-pink-500', 'to-rose-500');
            this.haptic('success');
        } else if (type === 'blue') {
            toast.classList.add('bg-gradient-to-r', 'from-blue-400', 'to-indigo-500');
            this.haptic('medium');
        } else {
            toast.classList.add('bg-gray-800');
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
