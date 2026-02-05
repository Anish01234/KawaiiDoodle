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
        if (id === App.state.user.kawaiiId) {
            App.toast("You can't add yourself! 😹", 'blue');
            return;
        }

        App.toast(`Searching for ID: ${id}...`, 'blue');

        const sb = App.state.supabase;
        if (!sb) {
            // Mock logic
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

        try {
            const { data, error } = await sb
                .from('profiles')
                .select('*')
                .eq('kawaii_id', id)
                .single();

            if (data) {
                App.toast(`Found ${data.username}! ✨`, 'pink');
                this.sendFriendRequest(data);
            } else {
                App.toast('ID not found... Double check it! 🥺', 'blue');
            }
        } catch (e) {
            console.error(e);
            App.toast('ID not found or magic failed... 😭', 'blue');
        }
    },

    async sendFriendRequest(targetProfile) {
        const sb = App.state.supabase;
        if (!sb) return;

        try {
            const user = (await sb.auth.getUser()).data.user;
            if (!user) return;

            const { error } = await sb
                .from('friends')
                .insert({
                    user_id: user.id,
                    friend_id: targetProfile.id,
                    status: 'pending'
                });

            if (error) {
                if (error.code === '23505') App.toast('Already sent! 💌', 'blue');
                else throw error;
            } else {
                App.toast(`Request sent to ${targetProfile.username}! 🌸`, 'pink');
            }
        } catch (e) {
            console.error(e);
            App.toast('Failed to send request 🥺', 'blue');
        }
    },

    async acceptFriendRequest(requestId, requesterProfile) {
        const sb = App.state.supabase;
        if (!sb) return;

        try {
            const { error } = await sb
                .from('friends')
                .update({ status: 'accepted' })
                .eq('id', requestId);

            if (error) throw error;

            App.toast(`Now friends with ${requesterProfile.username}! 🎉`, 'pink');
            this.loadFriends();
        } catch (e) {
            console.error(e);
            App.toast('Failed to accept 😭', 'blue');
        }
    },

    async loadFriends() {
        const sb = App.state.supabase;
        if (!sb) return;

        try {
            const user = (await sb.auth.getUser()).data.user;
            if (!user) return;

            // Get accepted friends
            const { data, error } = await sb
                .from('friends')
                .select(`
                    id,
                    status,
                    user_id,
                    friend_id
                `)
                .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

            if (error) throw error;

            // Fetch profiles for those friends manually to be safe
            const friendsList = [];
            for (const rel of data) {
                const otherId = rel.user_id === user.id ? rel.friend_id : rel.user_id;
                const { data: profile } = await sb
                    .from('profiles')
                    .select('kawaii_id, username')
                    .eq('id', otherId)
                    .single();

                if (profile) {
                    friendsList.push({
                        id: profile.kawaii_id,
                        username: profile.username,
                        status: rel.status,
                        relId: rel.id,
                        isRequester: rel.user_id === user.id
                    });
                }
            }

            this.friends = friendsList;
            this.renderFriendList();
        } catch (e) { console.error("Load friends failed:", e); }
    },

    listenToSocial() {
        const sb = App.state.supabase;
        if (!sb) return;

        sb.channel('social_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friends' }, payload => {
                this.loadFriends();
                App.toast('New friend request! 🌸', 'pink');
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'friends' }, payload => {
                this.loadFriends();
                if (payload.new.status === 'accepted') App.toast('Friend request accepted! ✨', 'pink');
            })
            .subscribe();
    },

    addFriend(friend) {
        if (this.friends.find(f => f.id === friend.id)) return;
        this.friends.push(friend);
        localStorage.setItem('kawaii-friends', JSON.stringify(this.friends));
        this.renderFriendList();
    },

    renderFriendList() {
        const list = document.getElementById('friend-list');
        if (!list) return;

        if (this.friends.length === 0) {
            list.innerHTML = `<p class="text-center text-sm text-gray-500 py-10 italic">Your list is cozy and empty... for now! 🥺</p>`;
            return;
        }

        list.innerHTML = this.friends.map(f => {
            const isActive = App.state.activeRecipient === f.id;
            return `
                <div class="bg-white/80 p-3 rounded-[2rem] shadow-sm flex items-center justify-between border-2 ${isActive ? 'border-pink-400 bg-pink-50' : 'border-transparent'} animate-float" style="animation-delay: ${Math.random()}s">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 ${isActive ? 'bg-pink-400' : 'bg-pink-100'} rounded-full flex items-center justify-center border-2 border-white transition-colors">
                            <i data-lucide="user" class="w-5 h-5 ${isActive ? 'text-white' : 'text-pink-400'}"></i>
                        </div>
                        <div>
                            <p class="font-bold text-sm ${isActive ? 'text-pink-600' : ''}">${f.username}</p>
                            <p class="text-[10px] ${isActive ? 'text-pink-400' : 'text-pink-300'}">ID: ${f.id} ${f.status === 'pending' ? '(Pending 💌)' : ''}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        ${f.status === 'pending' && !f.isRequester ? `
                            <button onclick="Social.acceptFriendRequest('${f.relId}', {username: '${f.username}'})" class="w-8 h-8 bg-green-400 text-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all">
                                <i data-lucide="check" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                        ${f.status === 'accepted' || f.id === 'kawaii-6789' ? `
                            <button onclick="Social.setActiveRecipient('${f.id}')" class="px-3 py-1 ${isActive ? 'bg-pink-500' : 'bg-blue-400'} text-white rounded-full text-[10px] font-black shadow-sm hover:scale-105 active:scale-95 transition-all">
                                ${isActive ? 'SELECTED 💖' : 'SELECT 🎨'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    setActiveRecipient(id) {
        App.state.activeRecipient = id;
        App.toast('New recipient set! 🎯', 'pink');
        this.renderFriendList();
        if (App.state.view === 'draw') this.renderRecipientBubbles();
    },

    renderRecipientBubbles() {
        const container = document.getElementById('friend-bubbles');
        if (!container) return;

        const onlineFriends = this.friends.filter(f => f.status === 'accepted' || f.id === 'kawaii-6789');

        if (onlineFriends.length === 0) {
            container.innerHTML = `<p class="text-[10px] text-gray-400 italic">Add friends to send doodles! 🥺</p>`;
            return;
        }

        container.innerHTML = onlineFriends.map(f => {
            const isActive = App.state.activeRecipient === f.id;
            return `
                <button onclick="Social.setActiveRecipient('${f.id}')" 
                        class="flex flex-col items-center gap-1 transition-all ${isActive ? 'scale-110' : 'opacity-60 scale-90'}">
                    <div class="w-10 h-10 rounded-full border-2 ${isActive ? 'border-pink-500 bg-pink-100' : 'border-gray-200 bg-white'} flex items-center justify-center overflow-hidden">
                        <span class="text-xs font-bold ${isActive ? 'text-pink-500' : 'text-gray-400'}">${f.username[0].toUpperCase()}</span>
                    </div>
                    <span class="text-[8px] font-bold ${isActive ? 'text-pink-500' : 'text-gray-400'} max-w-[40px] truncate">${f.username}</span>
                </button>
            `;
        }).join('');
    }
};

Social.init();
