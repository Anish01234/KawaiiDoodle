package com.kawaii.doodle.data.local.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.kawaii.doodle.data.local.entity.DoodleEntity

@Dao
interface DoodleDao {
    @Query("SELECT * FROM doodles WHERE senderId = :userId OR receiverId = :userId ORDER BY createdAt DESC LIMIT :limit OFFSET :offset")
    suspend fun getHistory(userId: String, offset: Int, limit: Int): List<DoodleEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(doodles: List<DoodleEntity>): List<Long>

    @Query("UPDATE doodles SET isRead = 1 WHERE receiverId = :userId AND isRead = 0")
    suspend fun markAllRead(userId: String)

    @Query("UPDATE doodles SET wallpaperSetAt = :timestamp WHERE id = :doodleId")
    suspend fun markWallpaperSet(doodleId: String, timestamp: String)

    @Query("SELECT * FROM doodles WHERE (senderId = :userId OR receiverId = :userId) ORDER BY createdAt DESC LIMIT 1")
    fun observeLatest(userId: String): LiveData<DoodleEntity>

    @Query("SELECT COUNT(*) FROM doodles WHERE receiverId = :userId AND isRead = 0")
    fun observeUnreadCount(userId: String): LiveData<Int>
}
