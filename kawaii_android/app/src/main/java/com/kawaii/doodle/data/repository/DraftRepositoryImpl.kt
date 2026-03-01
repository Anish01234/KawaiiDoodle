package com.kawaii.doodle.data.repository

import com.kawaii.doodle.data.local.dao.DraftDao
import com.kawaii.doodle.data.local.entity.DraftEntity
import com.kawaii.doodle.data.remote.SupabaseApiService
import com.kawaii.doodle.data.remote.dto.InsertDraftRequest
import com.kawaii.doodle.domain.model.Draft
import com.kawaii.doodle.domain.repository.DraftRepository
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DraftRepositoryImpl @Inject constructor(
    private val api: SupabaseApiService,
    private val dao: DraftDao
) : DraftRepository {

    override suspend fun getDrafts(userId: String, offset: Int, limit: Int): List<Draft> {
        return try {
            val response = api.getDrafts(
                userIdFilter = "eq.$userId",
                offset = offset,
                limit = limit
            )
            val remote = response.body() ?: emptyList()
            // Cache in Room
            val entities = remote.map { dto ->
                DraftEntity(
                    id = dto.id,
                    userId = dto.userId,
                    imageData = dto.imageData,
                    createdAt = dto.createdAt,
                    syncPending = false
                )
            }
            dao.getDrafts(userId, 0, Int.MAX_VALUE) // clear old cache entries? Simpler: just insert
            entities.forEach { dao.insert(it) }
            remote.map { it.toDomain() }
        } catch (e: Exception) {
            // Fallback to local cache (offline support)
            val cached = dao.getDrafts(userId, offset, limit)
            if (cached.isNotEmpty()) {
                cached.map { it.toDomain() }
            } else {
                throw e
            }
        }
    }

    override suspend fun saveDraft(userId: String, imageData: String): Draft {
        return try {
            val response = api.insertDraft(InsertDraftRequest(userId = userId, imageData = imageData))
            val dto = response.body()?.firstOrNull() ?: throw Exception("Empty response from server")
            val entity = DraftEntity(
                id = dto.id, userId = dto.userId,
                imageData = dto.imageData, createdAt = dto.createdAt
            )
            dao.insert(entity)
            dto.toDomain()
        } catch (e: Exception) {
            // Save locally as pending sync
            val localDraft = DraftEntity(
                id = UUID.randomUUID().toString(),
                userId = userId,
                imageData = imageData,
                createdAt = java.time.Instant.now().toString(),
                syncPending = true
            )
            dao.insert(localDraft)
            localDraft.toDomain()
        }
    }

    override suspend fun deleteDraft(draftId: String) {
        try {
            api.deleteDraft(idFilter = "eq.$draftId")
        } finally {
            dao.deleteById(draftId)
        }
    }

    override suspend fun syncPendingDrafts(userId: String) {
        val pending = dao.getPendingDrafts()
        pending.forEach { entity ->
            val response = api.insertDraft(
                InsertDraftRequest(userId = entity.userId, imageData = entity.imageData)
            )
            val body = response.body() ?: emptyList()
            if (body.isNotEmpty()) {
                dao.deleteById(entity.id)
                dao.insert(entity.copy(syncPending = false, id = body.first().id))
                dao.markSynced(entity.id)
            }
        }
    }
}

private fun com.kawaii.doodle.data.remote.dto.DraftDto.toDomain() = Draft(
    id = id, userId = userId, imageData = imageData, createdAt = createdAt
)

private fun DraftEntity.toDomain() = Draft(
    id = id, userId = userId, imageData = imageData,
    createdAt = createdAt, syncPending = syncPending
)
