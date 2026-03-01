package com.kawaii.doodle.data.local.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.kawaii.doodle.data.local.entity.DraftEntity

@Dao
interface DraftDao {
    @Query("SELECT * FROM drafts WHERE userId = :userId ORDER BY createdAt DESC LIMIT :limit OFFSET :offset")
    suspend fun getDrafts(userId: String, offset: Int, limit: Int): List<DraftEntity>

    @Query("SELECT * FROM drafts WHERE syncPending = 1")
    suspend fun getPendingDrafts(): List<DraftEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(draft: DraftEntity): Long

    @Query("DELETE FROM drafts WHERE id = :draftId")
    suspend fun deleteById(draftId: String): Int

    @Query("UPDATE drafts SET syncPending = 0 WHERE id = :draftId")
    suspend fun markSynced(draftId: String): Int

    @Query("SELECT COUNT(*) FROM drafts WHERE userId = :userId")
    fun observeCount(userId: String): LiveData<Int>
}
