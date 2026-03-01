package com.kawaii.doodle.data.remote.dto

import com.google.gson.annotations.SerializedName

// Supabase profile row
data class ProfileDto(
    @SerializedName("id") val id: String,
    @SerializedName("username") val username: String?,
    @SerializedName("kawaii_id") val kawaiiId: String?,
    @SerializedName("avatar_url") val avatarUrl: String?,
    @SerializedName("fcm_token") val fcmToken: String?
)

// Supabase doodle row
data class DoodleDto(
    @SerializedName("id") val id: String,
    @SerializedName("sender_id") val senderId: String,
    @SerializedName("receiver_id") val receiverId: String,
    @SerializedName("image_data") val imageData: String,
    @SerializedName("is_read") val isRead: Boolean = false,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("wallpaper_set_at") val wallpaperSetAt: String? = null
)

// Supabase draft row
data class DraftDto(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("image_data") val imageData: String,
    @SerializedName("created_at") val createdAt: String
)

// Supabase friend/relation row
data class FriendRelationDto(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("friend_id") val friendId: String,
    @SerializedName("status") val status: String
)

// Supabase auth token response
data class AuthResponseDto(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String,
    @SerializedName("expires_in") val expiresIn: Int,
    @SerializedName("refresh_token") val refreshToken: String,
    @SerializedName("user") val user: AuthUserDto
)

data class AuthUserDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String?,
    @SerializedName("user_metadata") val metadata: Map<String, Any>?
)

// GitHub release API response
data class GithubReleaseDto(
    @SerializedName("tag_name") val tagName: String,
    @SerializedName("body") val body: String?,
    @SerializedName("html_url") val htmlUrl: String,
    @SerializedName("assets") val assets: List<GithubAssetDto>
)

data class GithubAssetDto(
    @SerializedName("name") val name: String,
    @SerializedName("browser_download_url") val downloadUrl: String
)

// Status check JSON
data class AppStatusDto(
    @SerializedName("min_supported_version") val minSupportedVersion: String?,
    @SerializedName("broken_versions") val brokenVersions: List<String>?,
    @SerializedName("critical_message") val criticalMessage: String?,
    @SerializedName("force_update_url") val forceUpdateUrl: String?
)

// Request bodies
data class UpsertProfileRequest(
    @SerializedName("id") val id: String,
    @SerializedName("username") val username: String,
    @SerializedName("kawaii_id") val kawaiiId: String
)

data class UpdateFcmTokenRequest(
    @SerializedName("fcm_token") val fcmToken: String
)

data class InsertDoodleRequest(
    @SerializedName("sender_id") val senderId: String,
    @SerializedName("receiver_id") val receiverId: String,
    @SerializedName("image_data") val imageData: String
)

data class InsertDraftRequest(
    @SerializedName("user_id") val userId: String,
    @SerializedName("image_data") val imageData: String
)

data class InsertFriendRequest(
    @SerializedName("user_id") val userId: String,
    @SerializedName("friend_id") val friendId: String,
    @SerializedName("status") val status: String = "pending"
)

data class MarkReadRequest(
    @SerializedName("is_read") val isRead: Boolean = true
)

data class WallpaperSetRequest(
    @SerializedName("wallpaper_set_at") val wallpaperSetAt: String
)

data class AcceptFriendRequest(
    @SerializedName("status") val status: String = "accepted"
)

data class PushNotificationRequest(
    @SerializedName("to") val to: String,
    @SerializedName("title") val title: String,
    @SerializedName("body") val body: String,
    @SerializedName("data") val data: Map<String, String>
)

data class GoogleSignInRequest(
    @SerializedName("id_token") val idToken: String,
    @SerializedName("provider") val provider: String = "google",
    @SerializedName("access_token") val accessToken: String? = null
)
