package com.kawaii.doodle.presentation.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kawaii.doodle.domain.model.Doodle
import com.kawaii.doodle.domain.model.UpdateInfo
import com.kawaii.doodle.domain.repository.AuthRepository
import com.kawaii.doodle.domain.repository.DoodleRepository
import com.kawaii.doodle.domain.repository.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val isLoading: Boolean = false,
    val latestDoodle: Doodle? = null,
    val unreadCount: Int = 0,
    val username: String = "",
    val kawaiiId: String = "",
    val avatarUrl: String? = null,
    val updateInfo: UpdateInfo? = null,
    val error: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepo: AuthRepository,
    private val profileRepo: ProfileRepository,
    private val doodleRepo: DoodleRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
        startPolling()
    }

    fun loadHomeData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val userId = authRepo.getCurrentUserId() ?: run {
                _uiState.update { it.copy(isLoading = false) }
                return@launch
            }

            try {
                val user = profileRepo.getProfile(userId)
                _uiState.update { it.copy(username = user.username, kawaiiId = user.kawaiiId, avatarUrl = user.avatarUrl) }
            } catch (_: Exception) {}

            try {
                val doodles = doodleRepo.getHistory(userId = userId, offset = 0, limit = 20)
                val unread = doodles.count { it.receiverId == userId && !it.isRead }
                val latest = doodles.firstOrNull()
                _uiState.update { it.copy(latestDoodle = latest, unreadCount = unread, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    private fun startPolling() {
        viewModelScope.launch {
            while (true) {
                delay(30_000) // 30s poll
                val userId = authRepo.getCurrentUserId() ?: continue
                try {
                    val doodles = doodleRepo.getHistory(userId, 0, 20)
                    val unread = doodles.count { it.receiverId == userId && !it.isRead }
                    val latest = doodles.firstOrNull()
                    _uiState.update { it.copy(latestDoodle = latest, unreadCount = unread) }
                } catch (_: Exception) {}
            }
        }
    }

    fun dismissUpdate() {
        _uiState.update { it.copy(updateInfo = null) }
    }

    fun showUpdate(info: UpdateInfo) {
        _uiState.update { it.copy(updateInfo = info) }
    }
}
