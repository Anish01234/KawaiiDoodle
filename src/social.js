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
                App.toast('ID not found in the cloud 🥺', 'blue');
            }
        } catch (e) {
            console.error(e);
            App.toast('Search failed... 😭', 'blue');
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

        list.innerHTML = this.friends.map(f => `
            <div class="bg-white/80 p-3 rounded-[2rem] shadow-sm flex items-center justify-between animate-float" style="animation-delay: ${Math.random()}s">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white">
                        <i data-lucide="user" class="w-5 h-5 text-pink-400"></i>
                    </div>
                    <div>
                        <p class="font-bold text-sm">${f.username}</p>
                        <p class="text-[10px] text-pink-300">ID: ${f.id} ${f.status === 'pending' ? '(Pending 💌)' : ''}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    ${f.status === 'pending' && !f.isRequester ? `
                        <button onclick="Social.acceptFriendRequest('${f.relId}', {username: '${f.username}'})" class="w-8 h-8 bg-green-400 text-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all">
                            <i data-lucide="check" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                    ${f.status === 'accepted' || f.id === 'kawaii-6789' ? `
                        <button onclick="App.setView('draw')" class="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all">
                            <i data-lucide="pen-tool" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }
};

Social.init();
