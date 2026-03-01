package com.kawaii.doodle.domain.repository

import com.kawaii.doodle.domain.model.Draft

interface DraftRepository {
    suspend fun getDrafts(userId: String, offset: Int, limit: Int): List<Draft>
    suspend fun saveDraft(userId: String, imageData: String): Draft
    suspend fun deleteDraft(draftId: String)
    suspend fun syncPendingDrafts(userId: String)
}
