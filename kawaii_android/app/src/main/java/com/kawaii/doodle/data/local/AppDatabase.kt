package com.kawaii.doodle.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.kawaii.doodle.data.local.dao.DoodleDao
import com.kawaii.doodle.data.local.dao.DraftDao
import com.kawaii.doodle.data.local.dao.FriendDao
import com.kawaii.doodle.data.local.dao.ProfileDao
import com.kawaii.doodle.data.local.entity.DoodleEntity
import com.kawaii.doodle.data.local.entity.DraftEntity
import com.kawaii.doodle.data.local.entity.FriendEntity
import com.kawaii.doodle.data.local.entity.ProfileEntity

@Database(
    entities = [DoodleEntity::class, DraftEntity::class, FriendEntity::class, ProfileEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun doodleDao(): DoodleDao
    abstract fun draftDao(): DraftDao
    abstract fun friendDao(): FriendDao
    abstract fun profileDao(): ProfileDao
}
