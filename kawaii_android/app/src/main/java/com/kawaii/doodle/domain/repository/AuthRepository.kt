package com.kawaii.doodle.domain.repository

import com.kawaii.doodle.domain.model.User

interface AuthRepository {
    suspend fun getCurrentUser(): User?
    suspend fun signInWithGoogle(idToken: String): User
    suspend fun signOut()
    suspend fun isSignedIn(): Boolean
    suspend fun getCurrentUserId(): String?
}
