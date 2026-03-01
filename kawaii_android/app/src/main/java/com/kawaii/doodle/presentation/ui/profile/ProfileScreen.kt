package com.kawaii.doodle.presentation.ui.profile

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import coil.request.CachePolicy
import com.kawaii.doodle.BuildConfig
import com.kawaii.doodle.presentation.ui.auth.AuthState
import com.kawaii.doodle.presentation.ui.auth.AuthViewModel
import com.kawaii.doodle.presentation.ui.home.HomeViewModel
import com.kawaii.doodle.presentation.ui.shared.KawaiiConfirmDialog
import com.kawaii.doodle.presentation.ui.shared.KawaiiSnackbar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit,
    onSignedOut: () -> Unit,
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val authState by authViewModel.authState.collectAsState()
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    val homeVm: HomeViewModel = hiltViewModel()
    val homeState by homeVm.uiState.collectAsState()
    var showSignOut by remember { mutableStateOf(false) }
    var toast by remember { mutableStateOf<String?>(null) }
    val cs = MaterialTheme.colorScheme

    LaunchedEffect(authState) {
        if (authState is AuthState.SignedOut) onSignedOut()
    }

    // Avatar entrance animation
    var avatarVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { avatarVisible = true }
    val avatarScale by animateFloatAsState(
        targetValue = if (avatarVisible) 1f else 0.6f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "avatarIn"
    )

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Profile 🌸", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Rounded.ArrowBack, "Back")
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = cs.surface)
            )
        }
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Avatar with scale entrance
                Box(
                    modifier = Modifier
                        .scale(avatarScale)
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(cs.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    if (homeState.avatarUrl != null) {
                        AsyncImage(
                            model = ImageRequest.Builder(context)
                                .data(homeState.avatarUrl)
                                .crossfade(true)
                                .diskCachePolicy(CachePolicy.ENABLED)
                                .memoryCachePolicy(CachePolicy.ENABLED)
                                .build(),
                            contentDescription = "Avatar",
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Text(
                            homeState.username.firstOrNull()?.uppercase() ?: "✨",
                            fontSize = 40.sp,
                            fontWeight = FontWeight.Black,
                            color = cs.onPrimaryContainer
                        )
                    }
                }

                // Name + ID
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(homeState.username.ifEmpty { "—" }, style = MaterialTheme.typography.headlineSmall)
                    if (homeState.kawaiiId.isNotEmpty()) {
                        AssistChip(
                            onClick = {
                                clipboard.setText(AnnotatedString(homeState.kawaiiId))
                                toast = "Kawaii ID copied! 📋"
                            },
                            label = { Text(homeState.kawaiiId, style = MaterialTheme.typography.labelMedium) },
                            leadingIcon = { Icon(Icons.Rounded.ContentCopy, null, modifier = Modifier.size(16.dp)) }
                        )
                    }
                }

                Divider(color = cs.outlineVariant, thickness = 1.dp, modifier = Modifier.padding(vertical = 4.dp))

                // App version row
                ListItem(
                    headlineContent = { Text("App Version", style = MaterialTheme.typography.bodyMedium) },
                    trailingContent = {
                        Text("v${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.labelLarge, color = cs.primary)
                    },
                    colors = ListItemDefaults.colors(containerColor = cs.surface)
                )

                // GitHub releases
                Card(
                    onClick = {
                        context.startActivity(
                            Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/Anish01234/KawaiiDoodle/releases"))
                        )
                    },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = cs.secondaryContainer)
                ) {
                    ListItem(
                        headlineContent = { Text("View Release Notes", style = MaterialTheme.typography.bodyMedium) },
                        leadingContent = {
                            Icon(Icons.Rounded.OpenInBrowser, null, tint = cs.onSecondaryContainer)
                        },
                        trailingContent = {
                            Icon(Icons.Rounded.ArrowForwardIos, null, modifier = Modifier.size(14.dp), tint = cs.onSecondaryContainer)
                        },
                        colors = ListItemDefaults.colors(containerColor = cs.secondaryContainer)
                    )
                }

                Spacer(Modifier.weight(1f))

                // Sign Out
                OutlinedButton(
                    onClick = { showSignOut = true },
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = cs.error),
                    border = androidx.compose.foundation.BorderStroke(1.dp, cs.error),
                    modifier = Modifier.fillMaxWidth().height(52.dp)
                ) {
                    Icon(Icons.Rounded.Logout, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(10.dp))
                    Text("Sign Out", style = MaterialTheme.typography.labelLarge)
                }
            }

            toast?.let { msg ->
                KawaiiSnackbar(
                    message = msg,
                    onDismiss = { toast = null },
                    modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 24.dp, start = 16.dp, end = 16.dp)
                )
            }
        }
    }

    if (showSignOut) {
        KawaiiConfirmDialog(
            title = "Leaving? 🥺",
            message = "You'll need to sign in again to keep drawing!",
            confirmText = "Sign Out",
            cancelText = "Stay! 💖",
            onConfirm = { showSignOut = false; authViewModel.signOut() },
            onDismiss = { showSignOut = false }
        )
    }
}
