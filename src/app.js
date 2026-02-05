/**
 * Kawaii Doodle - App Controller
 */

const App = {
    state: {
        view: 'home',
        user: {
            username: localStorage.getItem('user-name') || 'Lucky Bunny',
            kawaiiId: localStorage.getItem('user-id') || ''
        },
        lastDoodle: null,
        supabase: null,
        config: {
            url: window.CONFIG?.SUPABASE_URL || localStorage.getItem('sb-url') || '',
            key: window.CONFIG?.SUPABASE_KEY || localStorage.getItem('sb-key') || ''
        },
        magicClickCount: 0
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

    init() {
        console.log("✨ Kawaii App Initializing...");
        if (!this.state.user.kawaiiId) this.generateKawaiiId();
        this.initSupabase();

        // Listen for URL params (e.g., ?view=widget)
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'widget') this.setView('widget');
        else this.renderView();

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

    updateUsername(newName) {
        if (!newName) return;
        this.state.user.username = newName;
        localStorage.setItem('user-name', newName);
        this.toast('Kawaii name updated! ✨', 'pink');
        this.renderView();
    },

    initSupabase() {
        if (this.state.config.url && this.state.config.key && window.supabase) {
            try {
                this.state.supabase = supabase.createClient(this.state.config.url, this.state.config.key);
                console.log("⚡ Cloud Sync Connected!");
                this.subscribeToDoodles();
                this.syncProfile();
                if (window.Social) {
                    Social.loadFriends();
                    Social.listenToSocial();
                }
            } catch (e) {
                console.error("Cloud Sync init failed:", e);
            }
        }
    },


    async syncProfile() {
        if (!this.state.supabase) return;
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
                    redirectTo: window.location.origin + window.location.pathname
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

        if (viewName === 'widget') {
            header.style.display = 'none';
            nav.style.display = 'none';
            document.body.classList.remove('bg-kawaii-pink');
            document.body.classList.add('bg-transparent'); // For widget feel
        } else {
            header.style.display = 'flex';
            nav.style.display = 'flex';
            document.body.classList.add('bg-kawaii-pink');
            document.body.classList.remove('bg-transparent');
        }

        setTimeout(() => {
            if (window.lucide) lucide.createIcons();
        }, 0);
    },

    setupNavigation() {
        document.getElementById('nav-draw').addEventListener('click', () => this.setView('draw'));
        document.getElementById('nav-home').addEventListener('click', () => this.setView('home'));
        document.getElementById('btn-friends').addEventListener('click', () => this.setView('friends'));
        document.getElementById('btn-profile').addEventListener('click', () => this.setView('profile'));

        // Magic Sequence Listener
        const title = document.querySelector('header h1');
        if (title) title.addEventListener('click', () => this.handleMagicSequence());
    },

    renderView() {
        const content = document.getElementById('content');
        switch (this.state.view) {
            case 'home': content.innerHTML = this.templates.home(); break;
            case 'draw':
                content.innerHTML = this.templates.draw();
                if (window.initCanvas) window.initCanvas();
                break;
            case 'friends': content.innerHTML = this.templates.friends(); break;
            case 'profile': content.innerHTML = this.templates.profile(); break;
            case 'widget': content.innerHTML = this.templates.widget(); break;
            default: content.innerHTML = `<div>404 - Kawaii Not Found 😭</div>`;
        }
    },

    templates: {
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
                <button onclick="App.setView('draw')" class="btn-bubbly btn-primary mt-4">
                    Send a Doodle 🎨
                </button>
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
                        <button onclick="window.handleSearchFriend()" class="bg-pink-400 text-white p-2 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all">
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
                    <input id="user-name-input" type="text" value="${App.state.user.username}" onchange="App.updateUsername(this.value)" class="bg-transparent text-center text-xl font-bold border-none outline-none focus:ring-2 focus:ring-pink-200 rounded-lg py-1">
                    <p class="text-pink-500 font-bold">ID: ${App.state.user.kawaiiId}</p>
                </div>
                
                <div class="bg-white/60 p-4 rounded-bubbly w-full max-w-xs text-center flex flex-col gap-2">
                    <p class="text-[10px] font-medium mb-1">Sign in to save your doodles and find friends!</p>
                    <button onclick="App.handleGoogleSignIn()" class="bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-md text-xs hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <i data-lucide="log-in" class="w-3 h-3"></i> Use Google Account
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
    }
};

window.addEventListener('mousedown', (e) => App.createSparkle(e.clientX, e.clientY));
window.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    App.createSparkle(t.clientX, t.clientY);
});

window.handleSearchFriend = () => {
    const input = document.getElementById('friend-id-input');
    if (window.Social) Social.searchFriend(input.value);
    input.value = '';
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('✨ Service Worker Registered!', reg))
            .catch(err => console.log('😭 Service Worker Failed!', err));
    }
});
