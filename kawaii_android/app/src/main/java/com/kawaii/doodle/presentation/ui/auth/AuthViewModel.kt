package com.kawaii.doodle.presentation.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kawaii.doodle.domain.repository.AuthRepository
import com.kawaii.doodle.domain.repository.ProfileRepository
import com.kawaii.doodle.presentation.navigation.Route
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepo: AuthRepository,
    private val profileRepo: ProfileRepository
) : ViewModel() {

    private val _startDestination = MutableStateFlow(Route.Landing.path)
    val startDestination: StateFlow<String> = _startDestination.asStateFlow()

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkSession()
    }

    private fun checkSession() {
        viewModelScope.launch {
            if (authRepo.isSignedIn()) {
                val userId = authRepo.getCurrentUserId() ?: return@launch
                val hasProfile = try {
                    profileRepo.getProfile(userId)
                    true
                } catch (_: Exception) {
                    false
                }
                _startDestination.value = if (hasProfile) Route.Home.path else Route.Setup.path
            } else {
                _startDestination.value = Route.Landing.path
            }
        }
    }

    fun signInWithGoogle(idToken: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                authRepo.signInWithGoogle(idToken)
                val userId = authRepo.getCurrentUserId() ?: return@launch
                val hasProfile = try {
                    profileRepo.getProfile(userId)
                    true
                } catch (_: Exception) {
                    false
                }
                _authState.value = if (hasProfile) AuthState.SignedInWithProfile else AuthState.NeedsSetup
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "Sign-in failed")
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepo.signOut()
            _authState.value = AuthState.SignedOut
        }
    }
}

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object SignedInWithProfile : AuthState()
    object NeedsSetup : AuthState()
    object SignedOut : AuthState()
    data class Error(val message: String) : AuthState()
}
