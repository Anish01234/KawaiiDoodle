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
        activeRecipient: null,
        supabase: null,
        config: {
            url: window.CONFIG?.SUPABASE_URL || localStorage.getItem('sb-url') || '',
            key: window.CONFIG?.SUPABASE_KEY || localStorage.getItem('sb-key') || ''
        },
        magicClickCount: 0
    },

    logBoot(msg) {
        console.log(msg);
        const log = document.getElementById('boot-log');
        if (log) {
            log.innerHTML += `> ${msg}<br>`;
            log.scrollTop = log.scrollHeight;
        }
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
            if (data.length > 0) this.state.lastDoodle = data[0].image_data;
            if (this.state.view === 'home' || this.state.view === 'history') this.renderView();
        } catch (e) {
            console.error("History load failed:", e);
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
                if (this.state.view === 'home' || this.state.view === 'widget') this.renderView();
            })
            .subscribe();

        console.log("📡 Listening for forest magic...");
    },

    async handleGoogleSignIn() {
        if (!this.state.supabase) {
            this.toast('Login is currently unavailable! 🥺', 'blue');
            console.error("Owner: Please set your SUPABASE_URL and KEY in src/config.js to enable login.");
            return;
        }

        try {
            App.toast('Opening Google login...', 'blue');
            const { error } = await this.state.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.href.split('#')[0].split('?')[0]
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
            <div class="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center animate-float">
                <div class="relative">
                    <div class="w-40 h-40 bg-white/40 rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                        <i data-lucide="sparkles" class="w-20 h-20 text-yellow-300 animate-pulse"></i>
                    </div>
                    <div class="absolute -top-4 -right-4 bg-pink-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg rotate-12">KAWAII!</div>
                </div>
                <div>
                    <h1 class="text-4xl font-extrabold text-white drop-shadow-lg mb-2">Kawaii Doodle</h1>
                    <p class="text-white/80 font-medium italic">Hand-drawn magic for friends ✨</p>
                </div>
                <button onclick="App.handleGoogleSignIn()" class="bg-white text-pink-500 px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                    <i data-lucide="log-in" class="w-6 h-6"></i> Enter the Magic
                </button>
                <p class="text-white/50 text-[10px] max-w-[200px]">Sign in with your Google account to start doodling!</p>
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
                    <button onclick="App.setView('draw')" class="btn-bubbly btn-primary">
                        Doodle! 🎨
                    </button>
                    <button onclick="App.setView('history')" class="btn-bubbly bg-blue-100 border-blue-200 text-blue-500">
                        History 📜
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
                    <div id="recipient-selection" class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-pink-100 mb-1 no-scrollbar">
                        <span class="text-[10px] font-bold text-pink-400 whitespace-nowrap">SEND TO:</span>
                        <div id="friend-bubbles" class="flex gap-2">
                           <!-- Injected by initCanvas -->
                           <p class="text-[10px] text-gray-400">Loading friends...</p>
                        </div>
                    </div>

                    <div class="flex justify-between items-center gap-4">
                        <div class="flex gap-2">
                            <button class="color-btn w-6 h-6 rounded-full bg-pink-400 border-2 border-white" data-color="#FFD1DC" title="Soft Pink"></button>
                            <button class="color-btn w-6 h-6 rounded-full bg-blue-400 border-2 border-white" data-color="#BDE0FE" title="Sky Blue"></button>
                            <button class="color-btn w-6 h-6 rounded-full bg-yellow-400 border-2 border-white" data-color="#FAFAD2" title="Lemon"></button>
                            <button class="color-btn w-6 h-6 rounded-full bg-green-400 border-2 border-white" data-color="#C1F0C1" title="Mint"></button>
                        </div>
                        <div class="flex gap-2">
                            <button class="stamp-btn text-xl hover:scale-125 transition-transform" data-stamp="💖">💖</button>
                            <button class="stamp-btn text-xl hover:scale-125 transition-transform" data-stamp="🍭">🍭</button>
                            <button class="stamp-btn text-xl hover:scale-125 transition-transform" data-stamp="⭐">⭐</button>
                            <button class="stamp-btn text-xl hover:scale-125 transition-transform" data-stamp="🎀">🎀</button>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <i data-lucide="brush" class="w-4 h-4 text-gray-400"></i>
                        <input id="brush-size" type="range" min="2" max="30" value="5" class="flex-1 accent-pink-400">
                        <button id="clear-canvas" class="p-2 hover:bg-red-50 text-red-400 rounded-full transition-colors">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                        <button id="send-doodle" class="bg-pink-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-pink-600 active:scale-95 transition-all">
                            Send! 🚀
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
                    <p class="text-pink-500 font-bold text-xs">ID: ${App.state.user.kawaiiId}</p>
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
                
                <p class="text-center text-[10px] text-green-500 font-bold ${App.state.supabase ? 'opacity-100' : 'opacity-0'}">✓ Multi-device sync active</p>
                
                <a href="?view=widget" target="_blank" class="w-full bg-blue-100/50 p-4 rounded-bubbly flex items-center justify-between hover:bg-blue-200/50 transition-colors">
                    <div class="flex items-center gap-3">
                        <i data-lucide="layout" class="text-blue-500"></i>
                        <div class="text-left">
                            <p class="font-bold text-sm text-blue-600">Widget Mode</p>
                            <p class="text-[10px] text-blue-400">Perfect for Home Screen!</p>
                        </div>
                    </div>
                    <i data-lucide="chevron-right" class="text-blue-400"></i>
                </a>
                <p class="text-center text-[10px] text-gray-500">Your data is stored safely in the cloud.</p>
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

    toast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-enter glass px-6 py-3 rounded-full shadow-lg mb-2 font-bold flex items-center gap-2 text-white z-[100]`;
        if (type === 'pink') toast.classList.add('bg-pink-500');
        else if (type === 'blue') toast.classList.add('bg-blue-500');
        else toast.classList.add('bg-gray-800');
        toast.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4"></i> ${message}`;
        const container = document.getElementById('toasts');
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            toast.style.transition = 'all 0.5s ease-out';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
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

        if (window.Social && !Social.friends.length) {
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
        this.state.activeRecipient = id;
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
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('✨ Service Worker Registered!', reg);
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            App.toast('New magic found! Updating... 🔄', 'pink');
                        }
                    });
                });
            })
            .catch(err => console.log('😭 Service Worker Failed!', err));

        // Auto-reload when new SW takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 New Service Worker took control, reloading...');
            window.location.reload();
        });
    }
});
