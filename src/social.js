/**
 * Kawaii Doodle - Social System Logic
 */

const Social = {
    friends: JSON.parse(localStorage.getItem('kawaii-friends')) || [
        { id: 'SparklyKitten-2024', username: 'Magic Kitten' },
        { id: 'BubblyCloud-9999', username: 'Cloudie' }
    ],

    init() {
        console.log("👯 Social System Ready!");
        this.renderFriendList();
    },

    async searchFriend(id) {
        if (!id) return;
        App.toast(`Searching for ID: ${id}...`, 'blue');

        const sb = App.state.supabase;
        if (!sb) {
            // Mock if no supabase
            setTimeout(() => {
                if (id.toLowerCase() === 'kawaii') {
                    App.toast('Found a friend! ✨', 'pink');
                    this.addFriend({ id: 'kawaii-6789', username: 'Magic Bunny' });
                } else {
                    App.toast('ID not found... Try "kawaii"! 🥺', 'blue');
                }
            }, 1000);
            return;
        }

        // Actual Supabase Search
        try {
            const { data, error } = await sb
                .from('profiles')
                .select('*')
                .eq('kawaii_id', id)
                .single();

            if (data) {
                App.toast(`Found ${data.username}! ✨`, 'pink');
                this.addFriend({ id: data.kawaii_id, username: data.username });
            } else {
                App.toast('ID not found in the cloud 🥺', 'blue');
            }
        } catch (e) {
            console.error(e);
            App.toast('Search failed... 😭', 'blue');
        }
    },

    addFriend(friend) {
        // Prevent duplicates
        if (this.friends.find(f => f.id === friend.id)) return;

        this.friends.push(friend);
        localStorage.setItem('kawaii-friends', JSON.stringify(this.friends));
        this.renderFriendList();
    },

    renderFriendList() {
        const list = document.getElementById('friend-list');
        if (!list) return;

        if (this.friends.length === 0) {
            list.innerHTML = `<p class="text-center text-sm text-gray-500 py-10 italic">Your friend list is empty... for now! 🥺</p>`;
            return;
        }

        list.innerHTML = this.friends.map(f => `
            <div class="bg-white/80 p-3 rounded-full shadow-sm flex items-center justify-between animate-float" style="animation-delay: ${Math.random()}s">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white">
                        <i data-lucide="user" class="w-5 h-5 text-pink-400"></i>
                    </div>
                    <div>
                        <p class="font-bold text-sm">${f.username}</p>
                        <p class="text-[10px] text-pink-300">ID: ${f.id}</p>
                    </div>
                </div>
                <button onclick="App.setView('draw')" class="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all">
                    <i data-lucide="pen-tool" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }
};

Social.init();
