/**
 * Kawaii Doodle - Social System Logic
 */

const Social = {
    friends: JSON.parse(localStorage.getItem('kawaii-friends')) || [],

    init() {
        console.log("👯 Social System Ready!");
        this.renderFriendList();
    },

    async searchFriend(id) {
        if (!id) return;

        // --- EASTER EGG TRIGGER ---
        const eggTerm = id.toLowerCase().trim();
        if (eggTerm === 'disco' || eggTerm === 'gravity' || eggTerm === 'chaos') {
            App.triggerEasterEgg(eggTerm);
            return;
        }

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
        App.confirmKawaii({
            title: "Fairwell Friend? 🥺",
            message: `Are you sure you want to remove ${username}?`,
            okText: "Yes, remove 👋",
            onConfirm: async () => {
                const sb = App.state.supabase;
                if (!sb) return;

                // Optimistic UI Update
                const previousFriends = [...this.friends];
                this.friends = this.friends.filter(f => f.relId !== relId);
                this.renderFriendList();

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
            }
        });
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
            if (!user) {
                console.warn("👯 Social: No user found for loadFriends");
                return;
            }

            console.log("👯 Social: Loading friends for", user.id);

            // Get all relationship rows
            const { data: relations, error: relError } = await sb
                .from('friends')
                .select(`id, status, user_id, friend_id`)
                .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

            if (relError) throw relError;

            console.log(`👯 Social: Found ${relations.length} relationship rows in DB`);

            if (relations.length === 0) {
                this.friends = [];
                this.renderFriendList();
                return;
            }

            // 1. Identify all unique friend IDs
            const friendIdMap = new Map(); // otherId -> relRow
            const allOtherIds = new Set();

            relations.forEach(rel => {
                const otherId = rel.user_id === user.id ? rel.friend_id : rel.user_id;
                allOtherIds.add(otherId);

                // If we have multiple rows for the same friend (shouldn't happen with unique constraints but safe to handle)
                // We prefer 'accepted' status if it exists
                const existing = friendIdMap.get(otherId);
                if (!existing || (rel.status === 'accepted' && existing.status !== 'accepted')) {
                    friendIdMap.set(otherId, rel);
                }
            });

            console.log(`👯 Social: Fetching profiles for ${allOtherIds.size} unique IDs...`);

            // 2. Fetch all profiles in ONE query
            const { data: profiles, error: profError } = await sb
                .from('profiles')
                .select('*')
                .in('id', Array.from(allOtherIds));

            if (profError) throw profError;

            console.log(`👯 Social: Successfully fetched ${profiles.length} profiles`);

            // 3. Merge profiles with relationship data
            const mergedFriends = [];
            profiles.forEach(profile => {
                const rel = friendIdMap.get(profile.id);
                if (rel) {
                    mergedFriends.push({
                        id: profile.kawaii_id,
                        actualId: profile.id, // Supabase UUID
                        username: profile.username,
                        avatar_url: profile.avatar_url,
                        status: rel.status,
                        relId: rel.id,
                        isRequester: rel.user_id === user.id
                    });
                }
            });

            this.friends = mergedFriends;
            console.log(`👯 Social: Final friends list size: ${this.friends.length}`);
            this.renderFriendList();

            // Critical check for the user's report
            if (relations.length > 0 && profiles.length === 0) {
                console.error("👯 Social CRITICAL: Found relationship rows but COULD NOT fetch profiles! Check RLS policies on 'profiles' table.");
                App.toast("Profile access issue detected! 🔐", "blue");
            }

        } catch (e) {
            console.error("👯 Social: Load friends failed:", e);
            App.toast("Failed to load friends 🥺", "blue");
        }
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
            list.innerHTML = `
                <div class="flex flex-col items-center gap-4 py-10 px-6 text-center animate-fade-in">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <i data-lucide="user-plus" class="w-8 h-8 text-gray-300"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-500">Your social life is empty! 🥺</p>
                        <p class="text-[10px] text-gray-400 mt-1">Since your profile is new, you need to re-add your besties using their Kawaii ID!</p>
                    </div>
                    <button onclick="document.getElementById('friend-id-input').focus()" class="text-xs font-black text-pink-500 bg-pink-50 px-4 py-2 rounded-full border border-pink-100">
                        FIND FRIENDS NOW
                    </button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        list.innerHTML = this.friends.map(f => {
            return `
                <div id="friend-row-${f.id}" class="bg-white/80 p-3 rounded-[2rem] shadow-sm flex items-center justify-between border-2 border-transparent animate-float" style="animation-delay: ${Math.random()}s">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white transition-colors overflow-hidden shrink-0">
                            ${f.avatar_url ? `<img src="${f.avatar_url}" 
                                class="w-full h-full object-cover" 
                                referrerpolicy="no-referrer"
                                onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.classList.remove('hidden');">` : ''}
                            <div class="${f.avatar_url ? 'hidden' : ''} w-full h-full flex items-center justify-center">
                                <i data-lucide="user" class="w-5 h-5 text-pink-400"></i>
                            </div>
                        </div>
                        <div>
                            <p class="font-bold text-sm text-gray-700">${f.username}</p>
                            <p class="text-[10px] text-pink-300">ID: ${f.id} ${f.status === 'pending' ? '(Pending 💌)' : ''}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        ${f.status === 'pending' && !f.isRequester ? `
                            <button onclick="Social.acceptFriendRequest('${f.relId}', {username: '${f.username}'})" class="w-8 h-8 bg-green-400 text-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all">
                                <i data-lucide="check" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                        ${f.status === 'accepted' ? `
                            <button onclick="Social.removeFriend('${f.relId}', '${f.username}')" class="w-8 h-8 bg-red-50 text-red-400 rounded-full flex items-center justify-center shadow-sm hover:bg-red-100 active:scale-95 transition-all">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

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
            container.innerHTML = `
                <div class="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-full border border-gray-100 animate-pulse">
                    <i data-lucide="help-circle" class="w-3 h-3 text-gray-400"></i>
                    <p class="text-[9px] text-gray-400 font-bold whitespace-nowrap">Add friends in the Social tab to send magic! ✨</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        container.innerHTML = onlineFriends.map(f => {
            const isActive = App.state.activeRecipients.includes(f.id);
            return `
                <button onclick="Social.toggleRecipient('${f.id}')" 
                        class="flex flex-col items-center gap-1 transition-all ${isActive ? 'scale-110' : 'opacity-100'}"
                        style="${isActive ? '' : 'filter: grayscale(0.5) opacity(0.7);'}">
                    <div class="relative flex flex-col items-center">
                    <div class="w-10 h-10 rounded-full border-2 ${isActive ? 'border-pink-500 bg-pink-100' : 'border-gray-200 bg-white'} flex items-center justify-center overflow-hidden shadow-sm">
                        ${f.avatar_url ?
                    `<img src="${f.avatar_url}" class="w-full h-full object-cover" referrerpolicy="no-referrer" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.classList.remove('hidden');">
                     <span class="text-xs font-bold ${isActive ? 'text-pink-500' : 'text-gray-400'} hidden">${f.username[0].toUpperCase()}</span>` :
                    `<span class="text-xs font-bold ${isActive ? 'text-pink-500' : 'text-gray-400'}">${f.username[0].toUpperCase()}</span>`
                }
                    </div>
                    <span class="text-[8px] font-bold ${isActive ? 'text-pink-500' : 'text-gray-400'} max-w-[40px] truncate">${f.username.split(' ')[0]}</span>
                </button>
            `;
        }).join('');
    }
};

window.Social = Social;
