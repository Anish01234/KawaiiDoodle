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

        // Check local state first to prevent conflicts/confusion
        const existing = this.friends.find(f => f.id.toLowerCase() === id.toLowerCase());
        if (existing) {
            if (existing.status === 'accepted') {
                App.toast(`You are already friends with ${existing.username}! 👯‍♀️`, 'pink');
            } else if (existing.isRequester) {
                App.toast('You sent a request! Wait for them... 💌', 'blue');
            } else {
                App.toast(`They added YOU! Click the checkmark below! 👇`, 'pink');
                // Highlight the row?
                const row = document.getElementById(`friend-row-${existing.id}`);
                if (row) row.classList.add('animate-bounce');
            }
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
                .ilike('kawaii_id', id)
                .single();

            if (data) {
                App.toast(`Found ${data.username}! ✨`, 'pink');
                this.sendFriendRequest(data);
            } else {
                App.toast(`ID "${id}" not found... 🥺`, 'blue');
            }
        } catch (e) {
            console.error(e);
            App.toast('Search failed or ID not found... 😭', 'blue');
        }
    },

    async removeFriend(relId, username) {
        if (!confirm(`Are you sure you want to remove ${username}? 🥺`)) return;

        const sb = App.state.supabase;
        if (!sb) return;

        // Optimistic UI Update
        const previousFriends = [...this.friends];
        this.friends = this.friends.filter(f => f.relId !== relId);
        this.renderFriendList();

        // Also remove from active selection if present
        // We need lookup by Kawaii ID usually, but here we have relId.
        // Let find the ID first? Or just rely on re-render.
        // Actually renderRecipientBubbles uses this.friends, so it will update.
        this.renderRecipientBubbles();

        try {
            const { error } = await sb
                .from('friends')
                .delete()
                .eq('id', relId);

            if (error) throw error;
            App.toast('Friend removed 👋', 'pink');
        } catch (e) {
            console.error(e);
            App.toast('Failed to remove friend 😭', 'blue');
            this.friends = previousFriends; // Revert
            this.renderFriendList();
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

        // Optimistic UI Update: Hide button immediately ⚡
        const localFriend = this.friends.find(f => f.relId === requestId);
        if (localFriend) {
            localFriend.status = 'accepted';
            this.renderFriendList();
        }

        try {
            const { error } = await sb
                .from('friends')
                .update({ status: 'accepted' })
                .eq('id', requestId);

            if (error) {
                // Revert if failed
                if (localFriend) {
                    localFriend.status = 'pending';
                    this.renderFriendList();
                }
                throw error;
            }

            App.toast(`Now friends with ${requesterProfile.username}! 🎉`, 'pink');
            await this.loadFriends(); // Sync with source of truth
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
            // Deduplicate friends: If A->B and B->A both exist, merge them.
            const friendMap = new Map();

            for (const rel of data) {
                const otherId = rel.user_id === user.id ? rel.friend_id : rel.user_id;

                // If we already processed this friend...
                if (friendMap.has(otherId)) {
                    const existing = friendMap.get(otherId);
                    // If this new row is ACCEPTED, upgrade the existing one
                    if (rel.status === 'accepted') {
                        existing.status = 'accepted';
                        existing.relId = rel.id; // Point to the accepted row
                        existing.isRequester = rel.user_id === user.id;
                    }
                    continue; // Skip re-fetching profile
                }

                const { data: profile } = await sb
                    .from('profiles')
                    .select('kawaii_id, username')
                    .eq('id', otherId)
                    .single();

                if (profile) {
                    friendMap.set(otherId, {
                        id: profile.kawaii_id,
                        username: profile.username,
                        status: rel.status,
                        relId: rel.id,
                        isRequester: rel.user_id === user.id
                    });
                }
            }

            this.friends = Array.from(friendMap.values());
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
            list.innerHTML = `<div class="text-center" style="padding: 40px; color: #999; font-style: italic;">No friends yet... Time to be social! 👯‍♀️</div>`;
            return;
        }

        list.innerHTML = this.friends.map((f, i) => `
            <div id="friend-row-${f.id}" class="card-premium" style="padding: 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; animation: fadeScale 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; animation-delay: ${i * 0.1}s; opacity: 0; transform: scale(0.9);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: #FFF0F5; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #FFB6C1;">
                        <i data-lucide="user" style="width: 20px; color: #FF69B4;"></i>
                    </div>
                    <div>
                        <p style="font-weight: 700; color: #333; margin-bottom: 2px;">${f.username}</p>
                        <p style="font-size: 10px; color: #999;">ID: ${f.id} ${f.status === 'pending' ? '(Pending 💌)' : ''}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    ${f.status === 'pending' && !f.isRequester ? `
                        <button onclick="Social.acceptFriendRequest('${f.relId}', {username: '${f.username}'})" class="btn-icon" style="width: 32px; height: 32px; background: #d1fae5; color: #10b981;">
                            <i data-lucide="check" style="width: 16px;"></i>
                        </button>
                    ` : ''}
                    <button onclick="Social.removeFriend('${f.relId}', '${f.username}')" class="btn-icon" style="width: 32px; height: 32px; color: #FF6B6B; background: #FFF;">
                        <i data-lucide="trash-2" style="width: 16px;"></i>
                    </button>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    },

    toggleRecipient(id) {
        const index = App.state.activeRecipients.indexOf(id);
        if (index === -1) {
            App.state.activeRecipients.push(id);
            // App.toast('Friend selected! 🎯', 'pink'); // Too spammy for multi-select
        } else {
            App.state.activeRecipients.splice(index, 1);
        }
        this.renderRecipientBubbles();
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
            const isActive = App.state.activeRecipients.includes(f.id);
            return `
                <button onclick="Social.toggleRecipient('${f.id}')" 
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

window.Social = Social;
