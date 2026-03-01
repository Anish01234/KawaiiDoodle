package com.kawaii.doodle.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.kawaii.doodle.data.local.dao.ProfileDao
import com.kawaii.doodle.data.local.entity.ProfileEntity
import com.kawaii.doodle.data.remote.SupabaseApiService
import com.kawaii.doodle.data.remote.SupabaseAuthService
import com.kawaii.doodle.data.remote.dto.GoogleSignInRequest
import com.kawaii.doodle.data.remote.dto.UpdateFcmTokenRequest
import com.kawaii.doodle.data.remote.dto.UpsertProfileRequest
import com.kawaii.doodle.domain.model.User
import com.kawaii.doodle.domain.repository.AuthRepository
import com.kawaii.doodle.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

object PrefsKeys {
    val ACCESS_TOKEN = stringPreferencesKey("access_token")
    val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
    val USER_ID = stringPreferencesKey("user_id")
    val USER_NAME = stringPreferencesKey("user_name")
    val KAWAII_ID = stringPreferencesKey("kawaii_id")
    val AVATAR_URL = stringPreferencesKey("avatar_url")
    val LAST_WALLPAPER_ID = stringPreferencesKey("last_wallpaper_id")
    val FCM_TOKEN = stringPreferencesKey("fcm_token")
}

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val authApi: SupabaseAuthService,
    private val dataStore: DataStore<Preferences>
) : AuthRepository {

    @Volatile private var cachedUser: User? = null

    override suspend fun getCurrentUser(): User? = cachedUser

    override suspend fun signInWithGoogle(idToken: String): User {
        val response = authApi.signInWithGoogle(body = GoogleSignInRequest(idToken = idToken))
        val body = response.body() ?: throw Exception("SignIn failed")
        val metadata = body.user.metadata ?: emptyMap()
        val user = User(
            id = body.user.id,
            username = metadata["full_name"] as? String ?: "",
            kawaiiId = "", // KawaiiID is usually not in google payload, must be set later
            avatarUrl = metadata["avatar_url"] as? String ?: "",
            fcmToken = null
        )
        // Store session
        dataStore.edit { prefs ->
            prefs[PrefsKeys.ACCESS_TOKEN] = body.accessToken
            prefs[PrefsKeys.REFRESH_TOKEN] = body.refreshToken
            prefs[PrefsKeys.USER_ID] = user.id
            prefs[PrefsKeys.USER_NAME] = user.username
            user.avatarUrl?.let { prefs[PrefsKeys.AVATAR_URL] = it }
        }
        cachedUser = user
        return user
    }

    override suspend fun signOut() {
        try {
            authApi.signOut()
        } catch (e: Exception) {
            // Ignore network errors on sign out
        }
        dataStore.edit { prefs ->
            prefs.remove(PrefsKeys.ACCESS_TOKEN)
            prefs.remove(PrefsKeys.REFRESH_TOKEN)
            prefs.remove(PrefsKeys.USER_ID)
            prefs.remove(PrefsKeys.KAWAII_ID)
            prefs.remove(PrefsKeys.USER_NAME)
            prefs.remove(PrefsKeys.AVATAR_URL)
        }
        cachedUser = null
    }

    override suspend fun getCurrentUserId(): String? = cachedUser?.id

    override suspend fun isSignedIn(): Boolean = cachedUser != null
}

@Singleton
class ProfileRepositoryImpl @Inject constructor(
    private val api: SupabaseApiService,
    private val profileDao: ProfileDao,
    private val dataStore: DataStore<Preferences>
) : ProfileRepository {
    @Volatile private var cachedCurrentUser: User? = null

    override suspend fun getProfile(userId: String): User {
        return try {
            val response = api.getProfile(idFilter = "eq.$userId")
            val profiles = response.body() ?: emptyList()
            val dto = profiles.firstOrNull() ?: throw Exception("Profile not found")
            val user = dto.toDomain()
            profileDao.insert(dto.toEntity())
            dataStore.edit { prefs ->
                prefs[PrefsKeys.USER_NAME] = dto.username ?: ""
                prefs[PrefsKeys.KAWAII_ID] = dto.kawaiiId ?: ""
                dto.avatarUrl?.let { prefs[PrefsKeys.AVATAR_URL] = it }
            }
            cachedCurrentUser = cachedCurrentUser?.copy(
                username = dto.username ?: cachedCurrentUser?.username ?: "",
                kawaiiId = dto.kawaiiId ?: cachedCurrentUser?.kawaiiId ?: "",
                avatarUrl = dto.avatarUrl
            )
            user
        } catch (e: Exception) {
            // Offline fallback
            val cached = profileDao.getById(userId)
            cached?.toDomain() ?: throw e
        }
    }

    override suspend fun upsertProfile(userId: String, username: String, kawaiiId: String): User {
        api.upsertProfile(body = UpsertProfileRequest(id = userId, username = username, kawaiiId = kawaiiId))
        val user = User(id = userId, username = username, kawaiiId = kawaiiId, avatarUrl = null, fcmToken = null)
        profileDao.insert(ProfileEntity(id = userId, username = username, kawaiiId = kawaiiId, avatarUrl = null, fcmToken = null))
        dataStore.edit { prefs ->
            prefs[PrefsKeys.USER_NAME] = username
            prefs[PrefsKeys.KAWAII_ID] = kawaiiId
        }
        cachedCurrentUser = cachedCurrentUser?.copy(username = username, kawaiiId = kawaiiId)
        return user
    }

    override suspend fun syncProfile(userId: String): User = getProfile(userId)

    override suspend fun updateFcmToken(userId: String, token: String) {
        api.updateFcmToken(idFilter = "eq.$userId", body = UpdateFcmTokenRequest(fcmToken = token))
        dataStore.edit { it[PrefsKeys.FCM_TOKEN] = token }
    }

    override suspend fun searchByKawaiiId(kawaiiId: String): User {
        val response = api.searchByKawaiiId(kawaiiIdFilter = "ilike.$kawaiiId")
        val dto = response.body()?.firstOrNull() ?: throw Exception("User not found")
        return dto.toDomain()
    }
}

private fun com.kawaii.doodle.data.remote.dto.ProfileDto.toDomain() = User(
    id = id, username = username ?: "", kawaiiId = kawaiiId ?: "",
    avatarUrl = avatarUrl, fcmToken = fcmToken
)

private fun com.kawaii.doodle.data.remote.dto.ProfileDto.toEntity() = ProfileEntity(
    id = id, username = username ?: "", kawaiiId = kawaiiId ?: "",
    avatarUrl = avatarUrl, fcmToken = fcmToken
)

private fun ProfileEntity.toDomain() = User(
    id = id, username = username, kawaiiId = kawaiiId,
    avatarUrl = avatarUrl, fcmToken = fcmToken
)
