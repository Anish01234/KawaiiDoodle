package com.kawaii.doodle.data.repository

import com.kawaii.doodle.data.local.dao.DoodleDao
import com.kawaii.doodle.data.local.entity.DoodleEntity
import com.kawaii.doodle.data.remote.SupabaseApiService
import com.kawaii.doodle.data.remote.SupabaseFunctionService
import com.kawaii.doodle.data.remote.dto.InsertDoodleRequest
import com.kawaii.doodle.data.remote.dto.PushNotificationRequest
import com.kawaii.doodle.data.remote.dto.WallpaperSetRequest
import com.kawaii.doodle.domain.model.Doodle
import com.kawaii.doodle.domain.repository.DoodleRepository
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DoodleRepositoryImpl @Inject constructor(
    private val api: SupabaseApiService,
    private val functionApi: SupabaseFunctionService,
    private val dao: DoodleDao
) : DoodleRepository {

    override suspend fun getHistory(userId: String, offset: Int, limit: Int): List<Doodle> {
        return try {
            val orFilter = "(sender_id.eq.$userId,receiver_id.eq.$userId)"
            val response = api.getHistory(orFilter = orFilter, offset = offset, limit = limit + 1)
            val dtos = response.body() ?: emptyList()
            val entities = dtos.map { it.toEntity() }
            dao.insertAll(entities)
            dtos.take(limit).map { it.toDomain() }
        } catch (e: Exception) {
            // Offline fallback
            val cached = dao.getHistory(userId, offset, limit)
            if (cached.isNotEmpty()) {
                cached.map { it.toDomain() }
            } else {
                throw e
            }
        }
    }

    override suspend fun sendDoodle(
        senderId: String,
        receiverIds: List<String>,
        imageData: String
    ): List<Doodle> {
        val requests = receiverIds.map { receiverId ->
            InsertDoodleRequest(senderId = senderId, receiverId = receiverId, imageData = imageData)
        }
        val response = api.insertDoodles(requests)
        val inserted = response.body() ?: emptyList()
        dao.insertAll(inserted.map { it.toEntity() })
        return inserted.map { it.toDomain() }
    }

    override suspend fun markAllRead(userId: String) {
        api.markAllRead(receiverIdFilter = "eq.$userId")
        dao.markAllRead(userId)
    }

    override suspend fun markWallpaperSet(doodleId: String) {
        api.markWallpaperSet(
            idFilter = "eq.$doodleId",
            body = WallpaperSetRequest(wallpaperSetAt = Instant.now().toString())
        )
        dao.markWallpaperSet(doodleId, Instant.now().toString())
    }
}

private fun com.kawaii.doodle.data.remote.dto.DoodleDto.toDomain() = Doodle(
    id = id, senderId = senderId, receiverId = receiverId,
    imageData = imageData, isRead = isRead,
    createdAt = createdAt, wallpaperSetAt = wallpaperSetAt
)

private fun com.kawaii.doodle.data.remote.dto.DoodleDto.toEntity() = DoodleEntity(
    id = id, senderId = senderId, receiverId = receiverId,
    imageData = imageData, isRead = isRead,
    createdAt = createdAt, wallpaperSetAt = wallpaperSetAt
)

private fun DoodleEntity.toDomain() = Doodle(
    id = id, senderId = senderId, receiverId = receiverId,
    imageData = imageData, isRead = isRead,
    createdAt = createdAt, wallpaperSetAt = wallpaperSetAt
)
