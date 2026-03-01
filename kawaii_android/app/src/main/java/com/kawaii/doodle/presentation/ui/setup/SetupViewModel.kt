package com.kawaii.doodle.presentation.ui.setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kawaii.doodle.domain.repository.AuthRepository
import com.kawaii.doodle.domain.repository.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SetupState {
    object Idle : SetupState()
    object Loading : SetupState()
    object Success : SetupState()
    data class Error(val message: String) : SetupState()
}

@HiltViewModel
class SetupViewModel @Inject constructor(
    private val authRepo: AuthRepository,
    private val profileRepo: ProfileRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<SetupState>(SetupState.Idle)
    val uiState: StateFlow<SetupState> = _uiState.asStateFlow()

    fun completeSetup(username: String) {
        if (username.length < 2) {
            _uiState.value = SetupState.Error("Choose a longer name! 🌸")
            return
        }
        viewModelScope.launch {
            _uiState.value = SetupState.Loading
            val userId = authRepo.getCurrentUserId() ?: run {
                _uiState.value = SetupState.Error("Not signed in!")
                return@launch
            }
            val kawaiiId = generateKawaiiId()
            try {
                profileRepo.upsertProfile(userId, username, kawaiiId)
                _uiState.value = SetupState.Success
            } catch (e: Exception) {
                _uiState.value = SetupState.Error(e.message ?: "Setup failed")
            }
        }
    }

    private fun generateKawaiiId(): String {
        val adj = listOf("Sparkly", "Bubbly", "Sweet", "Fluffy", "Magic", "Cuddly").random()
        val noun = listOf("Bunny", "Kitten", "Star", "Cloud", "Heart", "Berry").random()
        val num = (1000..9999).random()
        return "$adj$noun-$num"
    }

    fun clearError() { _uiState.value = SetupState.Idle }
}
