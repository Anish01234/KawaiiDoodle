package com.kawaii.doodle.domain.repository

import com.kawaii.doodle.domain.model.Doodle

interface DoodleRepository {
    suspend fun getHistory(userId: String, offset: Int, limit: Int): List<Doodle>
    suspend fun sendDoodle(senderId: String, receiverIds: List<String>, imageData: String): List<Doodle>
    suspend fun markAllRead(userId: String)
    suspend fun markWallpaperSet(doodleId: String)
}
