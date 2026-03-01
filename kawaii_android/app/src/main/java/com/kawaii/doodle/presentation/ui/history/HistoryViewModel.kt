package com.kawaii.doodle.presentation.ui.history

import android.app.WallpaperManager
import android.content.Context
import android.util.Base64
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kawaii.doodle.domain.model.Doodle
import com.kawaii.doodle.domain.model.Draft
import com.kawaii.doodle.domain.repository.AuthRepository
import com.kawaii.doodle.domain.repository.DoodleRepository
import com.kawaii.doodle.domain.repository.DraftRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HistoryUiState(
    val isLoading: Boolean = false,
    val doodles: List<Doodle> = emptyList(),
    val drafts: List<Draft> = emptyList(),
    val hasMoreDoodles: Boolean = false,
    val hasMoreDrafts: Boolean = false,
    val toast: String? = null
)

private const val PAGE = 20
private const val DRAFT_PAGE = 5

@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val authRepo: AuthRepository,
    private val doodleRepo: DoodleRepository,
    private val draftRepo: DraftRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    private var doodleOffset = 0
    private var draftOffset = 0

    init { refresh() }

    fun refresh() {
        doodleOffset = 0
        draftOffset = 0
        _uiState.update { it.copy(isLoading = true, doodles = emptyList(), drafts = emptyList()) }
        loadDoodles()
        loadDrafts()
        markAllRead()
    }

    private fun loadDoodles(append: Boolean = false) {
        viewModelScope.launch {
            val userId = authRepo.getCurrentUserId() ?: return@launch
            try {
                val list = doodleRepo.getHistory(userId, doodleOffset, PAGE + 1)
                val hasMore = list.size > PAGE
                val trimmed = list.take(PAGE)
                _uiState.update { it.copy(
                    isLoading = false,
                    doodles = if (append) it.doodles + trimmed else trimmed,
                    hasMoreDoodles = hasMore
                )}
            } catch (_: Exception) {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    private fun loadDrafts(append: Boolean = false) {
        viewModelScope.launch {
            val userId = authRepo.getCurrentUserId() ?: return@launch
            try {
                val list = draftRepo.getDrafts(userId, draftOffset, DRAFT_PAGE + 1)
                val hasMore = list.size > DRAFT_PAGE
                val trimmed = list.take(DRAFT_PAGE)
                _uiState.update { it.copy(
                    drafts = if (append) it.drafts + trimmed else trimmed,
                    hasMoreDrafts = hasMore
                )}
            } catch (_: Exception) {}
        }
    }

    fun loadMoreDoodles() {
        if (_uiState.value.hasMoreDoodles) {
            doodleOffset += PAGE
            loadDoodles(append = true)
        }
    }

    fun loadMoreDrafts() {
        if (_uiState.value.hasMoreDrafts) {
            draftOffset += DRAFT_PAGE
            loadDrafts(append = true)
        }
    }

    private fun markAllRead() {
        viewModelScope.launch {
            authRepo.getCurrentUserId()?.let { doodleRepo.markAllRead(it) }
        }
    }

    fun setWallpaper(imageData: String) {
        viewModelScope.launch {
            try {
                val bytes = if (imageData.contains(",")) {
                    Base64.decode(imageData.substringAfter(","), Base64.DEFAULT)
                } else {
                    Base64.decode(imageData, Base64.DEFAULT)
                }
                val bm = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                val wm = WallpaperManager.getInstance(context)
                wm.setBitmap(bm)
                _uiState.update { it.copy(toast = "Lock screen updated! ✨") }
            } catch (e: Exception) {
                _uiState.update { it.copy(toast = "Failed to set wallpaper 😭") }
            }
        }
    }

    fun deleteDraft(draftId: String) {
        viewModelScope.launch {
            try {
                draftRepo.deleteDraft(draftId)
                _uiState.update { it.copy(
                    drafts = it.drafts.filter { d -> d.id != draftId },
                    toast = "Draft deleted! 🗑️"
                )}
            } catch (_: Exception) {}
        }
    }

    fun clearToast() { _uiState.update { it.copy(toast = null) } }
}
