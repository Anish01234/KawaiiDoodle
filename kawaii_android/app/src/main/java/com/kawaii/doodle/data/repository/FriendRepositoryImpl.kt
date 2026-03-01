package com.kawaii.doodle.data.repository

import com.kawaii.doodle.data.local.dao.FriendDao
import com.kawaii.doodle.data.local.dao.ProfileDao
import com.kawaii.doodle.data.local.entity.FriendEntity
import com.kawaii.doodle.data.remote.SupabaseApiService
import com.kawaii.doodle.data.remote.dto.InsertFriendRequest
import com.kawaii.doodle.domain.model.Friend
import com.kawaii.doodle.domain.model.FriendStatus
import com.kawaii.doodle.domain.repository.FriendRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FriendRepositoryImpl @Inject constructor(
    private val api: SupabaseApiService,
    private val friendDao: FriendDao,
    private val profileDao: ProfileDao
) : FriendRepository {

    override suspend fun getFriends(userId: String): List<Friend> {
        return try {
            val orFilter = "(user_id.eq.$userId,friend_id.eq.$userId)"
            val response = api.getFriendRelations(orFilter = orFilter)
            val relations = response.body() ?: emptyList()

            if (relations.isEmpty()) {
                friendDao.deleteAll()
                return emptyList()
            }

            // Collect all other-party IDs
            val otherIds = relations.map { rel ->
                if (rel.userId == userId) rel.friendId else rel.userId
            }.distinct()

            // Fetch profiles
            val profiles = otherIds.chunked(50).flatMap { chunk ->
                val inFilter = "in.(${chunk.joinToString(",")})"
                val profileResponse = api.getProfile(idFilter = inFilter, limit = chunk.size)
                profileResponse.body() ?: emptyList()
            }

            val profileMap = profiles.associateBy { it.id }

            val friends = relations.mapNotNull { rel ->
                val otherId = if (rel.userId == userId) rel.friendId else rel.userId
                val profile = profileMap[otherId] ?: return@mapNotNull null
                Friend(
                    relId = rel.id,
                    kawaiiId = profile.kawaiiId ?: "",
                    actualId = profile.id,
                    username = profile.username ?: "",
                    avatarUrl = profile.avatarUrl,
                    status = if (rel.status == "accepted") FriendStatus.ACCEPTED else FriendStatus.PENDING,
                    isRequester = rel.userId == userId
                )
            }

            // Update local cache
            friendDao.deleteAll()
            friendDao.insertAll(friends.map { it.toEntity() })

            friends
        } catch (e: Exception) {
            // Offline fallback
            val cached = friendDao.getFriends()
            if (cached.isNotEmpty()) {
                cached.map { it.toDomain() }
            } else {
                throw e
            }
        }
    }

    override suspend fun sendRequest(fromUserId: String, toUserId: String) {
        api.sendFriendRequest(InsertFriendRequest(userId = fromUserId, friendId = toUserId))
    }

    override suspend fun acceptRequest(relId: String) {
        api.acceptFriendRequest(idFilter = "eq.$relId")
        friendDao.markAccepted(relId)
    }

    override suspend fun removeFriend(relId: String) {
        try {
            api.removeFriend(idFilter = "eq.$relId")
        } finally {
            friendDao.deleteByRelId(relId)
        }
    }
}

private fun Friend.toEntity() = FriendEntity(
    relId = relId, kawaiiId = kawaiiId, actualId = actualId,
    username = username, avatarUrl = avatarUrl,
    status = if (status == FriendStatus.ACCEPTED) "accepted" else "pending",
    isRequester = isRequester
)

private fun FriendEntity.toDomain() = Friend(
    relId = relId, kawaiiId = kawaiiId, actualId = actualId,
    username = username, avatarUrl = avatarUrl,
    status = if (status == "accepted") FriendStatus.ACCEPTED else FriendStatus.PENDING,
    isRequester = isRequester
)
