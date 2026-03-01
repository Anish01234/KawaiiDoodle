package com.kawaii.doodle.data.local.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.kawaii.doodle.data.local.entity.FriendEntity
import com.kawaii.doodle.data.local.entity.ProfileEntity

@Dao
interface FriendDao {
    @Query("SELECT * FROM friends ORDER BY username ASC")
    fun observeFriends(): LiveData<List<FriendEntity>>

    @Query("SELECT * FROM friends ORDER BY username ASC")
    suspend fun getFriends(): List<FriendEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(friends: List<FriendEntity>): List<Long>

    @Query("DELETE FROM friends WHERE relId = :relId")
    suspend fun deleteByRelId(relId: String): Int

    @Query("DELETE FROM friends")
    suspend fun deleteAll(): Int

    @Query("UPDATE friends SET status = 'accepted' WHERE relId = :relId")
    suspend fun markAccepted(relId: String): Int
}

@Dao
interface ProfileDao {
    @Query("SELECT * FROM profiles WHERE id = :userId LIMIT 1")
    suspend fun getById(userId: String): ProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(profile: ProfileEntity): Long

    @Query("DELETE FROM profiles")
    suspend fun deleteAll(): Int
}
