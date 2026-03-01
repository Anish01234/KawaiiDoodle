package com.kawaii.doodle.presentation.ui.landing

import android.app.Activity
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.kawaii.doodle.BuildConfig
import com.kawaii.doodle.presentation.ui.auth.AuthState
import com.kawaii.doodle.presentation.ui.auth.AuthViewModel
import com.kawaii.doodle.presentation.ui.shared.KawaiiSnackbar
import kotlinx.coroutines.launch

@Composable
fun LandingScreen(
    onSignInSuccess: () -> Unit,
    onNeedsSetup: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val authState by viewModel.authState.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var errorMsg by remember { mutableStateOf<String?>(null) }
    val isLoading = authState is AuthState.Loading

    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.SignedInWithProfile -> onSignInSuccess()
            is AuthState.NeedsSetup -> onNeedsSetup()
            is AuthState.Error -> errorMsg = (authState as AuthState.Error).message
            else -> {}
        }
    }

    // Logo floating animation
    val infiniteTransition = rememberInfiniteTransition(label = "float")
    val offsetY by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -14f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logoFloat"
    )

    // Logo breathing scale
    val logoScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logoScale"
    )

    // Button press scale
    val btnScale by animateFloatAsState(
        targetValue = if (isLoading) 0.96f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "btnScale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFFFFB7D5),
                        Color(0xFFFF6B9D),
                        Color(0xFFE91E8C),
                        Color(0xFFAD1457)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(28.dp),
            modifier = Modifier.padding(40.dp)
        ) {
            // ── Animated Logo ──
            Box(
                modifier = Modifier
                    .offset(y = offsetY.dp)
                    .scale(logoScale)
                    .size(180.dp)
                    .background(Color.White.copy(alpha = 0.20f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(150.dp)
                        .background(Color.White.copy(alpha = 0.25f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text("🎨", fontSize = 72.sp)
                }
            }

            // ── Headline ──
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Kawaii Doodle",
                    fontSize = 42.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    letterSpacing = (-1).sp
                )
                Text(
                    text = "Hand-drawn magic for friends ✨",
                    fontSize = 15.sp,
                    color = Color.White.copy(alpha = 0.88f),
                    textAlign = TextAlign.Center,
                    fontStyle = FontStyle.Italic
                )
            }

            // ── Sign-In Button ──
            Surface(
                onClick = {
                    if (!isLoading) scope.launch {
                        try {
                            val credentialManager = CredentialManager.create(context)
                            val googleIdOption = GetGoogleIdOption.Builder()
                                .setFilterByAuthorizedAccounts(false)
                                .setServerClientId(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                                .build()
                            val request = GetCredentialRequest.Builder()
                                .addCredentialOption(googleIdOption)
                                .build()
                            val result = credentialManager.getCredential(context as Activity, request)
                            val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
                            viewModel.signInWithGoogle(credential.idToken)
                        } catch (e: Exception) {
                            errorMsg = e.localizedMessage ?: "Sign-in failed"
                        }
                    }
                },
                modifier = Modifier
                    .scale(btnScale)
                    .widthIn(min = 280.dp)
                    .height(60.dp),
                shape = CircleShape,
                color = Color.White,
                shadowElevation = 8.dp,
                tonalElevation = 0.dp
            ) {
                Row(
                    modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = Color(0xFFE91E8C),
                            modifier = Modifier.size(22.dp),
                            strokeWidth = 2.5.dp
                        )
                    } else {
                        // G logo
                        Surface(shape = CircleShape, color = Color(0xFF4285F4), modifier = Modifier.size(26.dp)) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                Text("G", color = Color.White, fontWeight = FontWeight.Black, fontSize = 14.sp)
                            }
                        }
                        Spacer(Modifier.width(14.dp))
                        Text(
                            "Sign in with Google",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = Color(0xFF3C4043)
                        )
                    }
                }
            }

            Text(
                text = "By continuing, you agree to spread kawaii vibes only! 💖",
                fontSize = 11.sp,
                color = Color.White.copy(alpha = 0.75f),
                textAlign = TextAlign.Center,
                modifier = Modifier.widthIn(max = 240.dp)
            )
        }

        // ── Error snackbar ──
        errorMsg?.let { msg ->
            KawaiiSnackbar(
                message = msg,
                onDismiss = { errorMsg = null },
                isError = true,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 48.dp, start = 16.dp, end = 16.dp)
            )
        }
    }
}
