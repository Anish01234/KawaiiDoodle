package com.kawaii.doodle.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "doodles")
data class DoodleEntity(
    @PrimaryKey val id: String,
    val senderId: String,
    val receiverId: String,
    val imageData: String,
    val isRead: Boolean = false,
    val createdAt: String,
    val wallpaperSetAt: String? = null
)

@Entity(tableName = "drafts")
data class DraftEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val imageData: String,
    val createdAt: String,
    val syncPending: Boolean = false
)

@Entity(tableName = "friends")
data class FriendEntity(
    @PrimaryKey val relId: String,
    val kawaiiId: String,
    val actualId: String,
    val username: String,
    val avatarUrl: String?,
    val status: String,          // "pending" | "accepted"
    val isRequester: Boolean
)

@Entity(tableName = "profiles")
data class ProfileEntity(
    @PrimaryKey val id: String,
    val username: String,
    val kawaiiId: String,
    val avatarUrl: String?,
    val fcmToken: String?
)
