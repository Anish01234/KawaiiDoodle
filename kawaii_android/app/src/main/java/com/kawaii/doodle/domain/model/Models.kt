package com.kawaii.doodle.domain.model

data class User(
    val id: String,
    val username: String,
    val kawaiiId: String,
    val avatarUrl: String?,
    val fcmToken: String?
)

data class Doodle(
    val id: String,
    val senderId: String,
    val receiverId: String,
    val imageData: String,      // Base64 JPEG
    val isRead: Boolean,
    val createdAt: String,
    val wallpaperSetAt: String?,
    // Populated client-side after profile lookup
    val senderName: String? = null,
    val receiverName: String? = null,
    val senderAvatarUrl: String? = null
)

data class Draft(
    val id: String,
    val userId: String,
    val imageData: String,
    val createdAt: String,
    val syncPending: Boolean = false
)

data class Friend(
    val relId: String,
    val kawaiiId: String,
    val actualId: String,        // Supabase UUID
    val username: String,
    val avatarUrl: String?,
    val status: FriendStatus,
    val isRequester: Boolean     // true = I sent the request
)

enum class FriendStatus { PENDING, ACCEPTED }

data class UpdateInfo(
    val latestVersion: String,
    val releaseNotes: String,
    val hasApk: Boolean,
    val htmlUrl: String
)

sealed class AppHealthStatus {
    object Healthy : AppHealthStatus()
    data class Blocked(val message: String, val updateUrl: String) : AppHealthStatus()
}
