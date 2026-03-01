package com.kawaii.doodle.data.remote

import com.kawaii.doodle.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface SupabaseApiService {

    // ── PROFILES ──────────────────────────────────────────────────────────────

    @GET("rest/v1/profiles")
    suspend fun getProfile(
        @Query("id") idFilter: String,       // eq.<uuid>
        @Query("select") select: String = "*",
        @Query("limit") limit: Int = 1
    ): Response<List<ProfileDto>>

    @GET("rest/v1/profiles")
    suspend fun searchByKawaiiId(
        @Query("kawaii_id") kawaiiIdFilter: String,  // ilike.<id>
        @Query("select") select: String = "*",
        @Query("limit") limit: Int = 1
    ): Response<List<ProfileDto>>

    @POST("rest/v1/profiles")
    suspend fun upsertProfile(
        @Header("Prefer") prefer: String = "resolution=merge-duplicates",
        @Body body: UpsertProfileRequest
    ): Response<Void>

    @PATCH("rest/v1/profiles")
    suspend fun updateFcmToken(
        @Query("id") idFilter: String,        // eq.<uuid>
        @Body body: UpdateFcmTokenRequest
    ): Response<Void>

    // ── DOODLES ───────────────────────────────────────────────────────────────

    @GET("rest/v1/doodles")
    suspend fun getHistory(
        @Query("or") orFilter: String,         // (sender_id.eq.X,receiver_id.eq.X)
        @Query("order") order: String = "created_at.desc",
        @Query("offset") offset: Int = 0,
        @Query("limit") limit: Int = 21        // fetch 21, hasMore if count > 20
    ): Response<List<DoodleDto>>

    @POST("rest/v1/doodles")
    @Headers("Prefer: return=representation")
    suspend fun insertDoodles(
        @Body doodles: List<InsertDoodleRequest>
    ): Response<List<DoodleDto>>

    @PATCH("rest/v1/doodles")
    suspend fun markAllRead(
        @Query("receiver_id") receiverIdFilter: String,  // eq.<uuid>
        @Query("is_read") isReadFilter: String = "eq.false",
        @Body body: MarkReadRequest = MarkReadRequest()
    ): Response<Void>

    @PATCH("rest/v1/doodles")
    suspend fun markWallpaperSet(
        @Query("id") idFilter: String,          // eq.<uuid>
        @Body body: WallpaperSetRequest
    ): Response<Void>

    // ── DRAFTS ────────────────────────────────────────────────────────────────

    @GET("rest/v1/drafts")
    suspend fun getDrafts(
        @Query("user_id") userIdFilter: String,   // eq.<uuid>
        @Query("order") order: String = "created_at.desc",
        @Query("offset") offset: Int = 0,
        @Query("limit") limit: Int = 6           // 6 to detect hasMore
    ): Response<List<DraftDto>>

    @POST("rest/v1/drafts")
    @Headers("Prefer: return=representation")
    suspend fun insertDraft(
        @Body draft: InsertDraftRequest
    ): Response<List<DraftDto>>

    @DELETE("rest/v1/drafts")
    suspend fun deleteDraft(
        @Query("id") idFilter: String            // eq.<uuid>
    ): Response<Void>

    // ── FRIENDS ───────────────────────────────────────────────────────────────

    @GET("rest/v1/friends")
    suspend fun getFriendRelations(
        @Query("or") orFilter: String,            // (user_id.eq.X,friend_id.eq.X)
        @Query("select") select: String = "id,status,user_id,friend_id"
    ): Response<List<FriendRelationDto>>

    @POST("rest/v1/friends")
    suspend fun sendFriendRequest(
        @Body body: InsertFriendRequest
    ): Response<Void>

    @PATCH("rest/v1/friends")
    suspend fun acceptFriendRequest(
        @Query("id") idFilter: String,            // eq.<uuid>
        @Body body: AcceptFriendRequest = AcceptFriendRequest()
    ): Response<Void>

    @DELETE("rest/v1/friends")
    suspend fun removeFriend(
        @Query("id") idFilter: String             // eq.<uuid>
    ): Response<Void>
}

interface SupabaseAuthService {

    @POST("auth/v1/token")
    suspend fun signInWithGoogle(
        @Query("grant_type") grantType: String = "id_token",
        @Body body: GoogleSignInRequest
    ): Response<AuthResponseDto>

    @POST("auth/v1/logout")
    suspend fun signOut(): Response<Void>
}

interface SupabaseFunctionService {

    @POST("functions/v1/push")
    suspend fun sendPush(
        @Body body: PushNotificationRequest
    ): Response<Void>
}

interface GithubApiService {

    @GET("repos/Anish01234/KawaiiDoodle/releases/latest")
    suspend fun getLatestRelease(): Response<GithubReleaseDto>
}

interface GithubRawService {

    @GET("Anish01234/KawaiiDoodle/main/status.json")
    suspend fun getAppStatus(): Response<AppStatusDto>
}
