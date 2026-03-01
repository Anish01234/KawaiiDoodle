package com.kawaii.doodle.domain.repository

import com.kawaii.doodle.domain.model.Friend

interface FriendRepository {
    suspend fun getFriends(userId: String): List<Friend>
    suspend fun sendRequest(fromUserId: String, toUserId: String)
    suspend fun acceptRequest(relId: String)
    suspend fun removeFriend(relId: String)
}
