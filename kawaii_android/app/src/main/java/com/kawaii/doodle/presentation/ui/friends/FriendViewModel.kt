package com.kawaii.doodle.presentation.ui.friends

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kawaii.doodle.domain.model.Friend
import com.kawaii.doodle.domain.model.User
import com.kawaii.doodle.domain.repository.AuthRepository
import com.kawaii.doodle.domain.repository.FriendRepository
import com.kawaii.doodle.domain.repository.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FriendUiState(
    val friends: List<Friend> = emptyList(),
    val searchResult: User? = null,
    val isSearching: Boolean = false,
    val isLoading: Boolean = false,
    val toast: String? = null,
    val error: String? = null
)

@HiltViewModel
class FriendViewModel @Inject constructor(
    private val authRepo: AuthRepository,
    private val friendRepo: FriendRepository,
    private val profileRepo: ProfileRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(FriendUiState())
    val uiState: StateFlow<FriendUiState> = _uiState.asStateFlow()

    init { loadFriends() }

    fun loadFriends() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val userId = authRepo.getCurrentUserId() ?: run {
                _uiState.update { it.copy(isLoading = false) }
                return@launch
            }
            try {
                val friends = friendRepo.getFriends(userId)
                _uiState.update { it.copy(friends = friends, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun searchFriend(kawaiiId: String) {
        val trimmed = kawaiiId.trim()
        if (trimmed.isEmpty()) {
            _uiState.update { it.copy(error = "Enter a Kawaii ID to search!") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isSearching = true, searchResult = null, error = null) }
            val myId = authRepo.getCurrentUserId()
            try {
                val user = profileRepo.searchByKawaiiId(trimmed)
                if (user.id == myId) {
                    _uiState.update { it.copy(isSearching = false, error = "That's you! 😅") }
                } else {
                    _uiState.update { it.copy(isSearching = false, searchResult = user) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isSearching = false, error = "User not found! 🔍") }
            }
        }
    }

    fun sendRequest(toUser: User) {
        viewModelScope.launch {
            val myId = authRepo.getCurrentUserId() ?: return@launch
            val already = _uiState.value.friends.any { it.actualId == toUser.id }
            if (already) {
                _uiState.update { it.copy(toast = "Already friends! 💫") }
                return@launch
            }
            try {
                friendRepo.sendRequest(myId, toUser.id)
                _uiState.update { it.copy(toast = "Request sent to ${toUser.username}! 💌", searchResult = null) }
                loadFriends()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to send request 😭") }
            }
        }
    }

    fun acceptRequest(relId: String, username: String) {
        viewModelScope.launch {
            try {
                friendRepo.acceptRequest(relId)
                _uiState.update { it.copy(toast = "Now friends with $username! 🎉") }
                loadFriends()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to accept 😭") }
            }
        }
    }

    fun removeFriend(relId: String) {
        viewModelScope.launch {
            try {
                friendRepo.removeFriend(relId)
                _uiState.update { state ->
                    state.copy(
                        toast = "Removed! 👋",
                        friends = state.friends.filter { f -> f.relId != relId }
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to remove 😭") }
            }
        }
    }

    fun clearToast() { _uiState.update { it.copy(toast = null) } }
    fun clearError() { _uiState.update { it.copy(error = null) } }
    fun clearSearch() { _uiState.update { it.copy(searchResult = null) } }
}
