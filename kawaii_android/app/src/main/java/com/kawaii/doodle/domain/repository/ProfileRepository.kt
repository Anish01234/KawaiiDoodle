package com.kawaii.doodle.domain.repository

import com.kawaii.doodle.domain.model.User

interface ProfileRepository {
    suspend fun getProfile(userId: String): User
    suspend fun upsertProfile(userId: String, username: String, kawaiiId: String): User
    suspend fun syncProfile(userId: String): User
    suspend fun updateFcmToken(userId: String, token: String)
    suspend fun searchByKawaiiId(kawaiiId: String): User
}
