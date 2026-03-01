package com.kawaii.doodle.presentation.ui.home

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.material3.windowsizeclass.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.kawaii.doodle.presentation.ui.shared.KawaiiSnackbar
import com.kawaii.doodle.presentation.ui.shared.ShimmerCard
import com.kawaii.doodle.presentation.ui.shared.convertBase64ToBitmap

@Composable
fun HomeScreen(
    onNavigateToDraw: () -> Unit,
    onNavigateToHistory: () -> Unit,
    onNavigateToFriends: () -> Unit,
    onNavigateToProfile: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val colorScheme = MaterialTheme.colorScheme
    var toastMsg by remember { mutableStateOf<String?>(null) }

    // Doodle card entrance animation
    val cardAlpha by animateFloatAsState(
        targetValue = if (state.isLoading) 0f else 1f,
        animationSpec = tween(600),
        label = "cardAlpha"
    )
    val cardScale by animateFloatAsState(
        targetValue = if (state.isLoading) 0.92f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMedium),
        label = "cardScale"
    )

    Scaffold(
        containerColor = colorScheme.background
    ) { padding ->
        Box(modifier = Modifier
            .fillMaxSize()
            .padding(bottom = padding.calculateBottomPadding())
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // ── Glassmorphic Top Bar ──
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    colorScheme.primaryContainer.copy(alpha = 0.7f),
                                    colorScheme.background.copy(alpha = 0f)
                                )
                            )
                        )
                        .windowInsetsPadding(WindowInsets.statusBars)
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                ) {
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = if (state.username.isNotEmpty()) "Hey ${state.username}! 👋" else "Kawaii Doodle 🎨",
                                style = MaterialTheme.typography.headlineSmall,
                                color = colorScheme.onBackground
                            )
                            if (state.kawaiiId.isNotEmpty()) {
                                Text(
                                    text = state.kawaiiId,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = colorScheme.primary
                                )
                            }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            SmallIconBtn(
                                icon = Icons.Rounded.Group,
                                badge = 0,
                                onClick = onNavigateToFriends,
                                tint = colorScheme.onSurfaceVariant
                            )
                            SmallIconBtn(
                                icon = Icons.Rounded.Person,
                                badge = 0,
                                onClick = onNavigateToProfile,
                                tint = colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(Modifier.height(8.dp))

                // ── Main doodle card ──
                Box(
                    modifier = Modifier
                        .padding(horizontal = 24.dp)
                        .fillMaxWidth()
                        .aspectRatio(1f)
                        .scale(cardScale)
                        .graphicsLayer { alpha = cardAlpha }
                        .clip(RoundedCornerShape(32.dp))
                        .background(colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    if (state.isLoading) {
                        ShimmerCard(modifier = Modifier.fillMaxSize())
                    } else if (state.latestDoodle != null) {
                        AsyncImage(
                            model = convertBase64ToBitmap(state.latestDoodle!!.imageData),
                            contentDescription = "Latest doodle",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text("🎭", fontSize = 56.sp)
                            Spacer(Modifier.height(12.dp))
                            Text(
                                "No doodles yet!\nDraw your first one ✨",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )
                        }
                    }

                    // Unread badge (animated)
                    if (state.unreadCount > 0) {
                        val pulseScale by rememberInfiniteTransition(label = "pulse").animateFloat(
                            initialValue = 1f, targetValue = 1.1f,
                            animationSpec = infiniteRepeatable(tween(800), RepeatMode.Reverse),
                            label = "badgePulse"
                        )
                        Badge(
                            containerColor = colorScheme.primary,
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(12.dp)
                                .scale(pulseScale)
                        ) {
                            Text(
                                "${state.unreadCount} new 💌",
                                style = MaterialTheme.typography.labelSmall,
                                color = colorScheme.onPrimary,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(28.dp))

                // ── Action buttons ──
                Row(
                    modifier = Modifier.padding(horizontal = 24.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // History
                    OutlinedButton(
                        onClick = onNavigateToHistory,
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.weight(1f).height(52.dp)
                    ) {
                        Icon(Icons.Rounded.History, null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("History", style = MaterialTheme.typography.labelLarge)
                    }

                    // Draw (primary)
                    Button(
                        onClick = onNavigateToDraw,
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.weight(1f).height(52.dp),
                        elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
                    ) {
                        Icon(Icons.Rounded.Edit, null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Draw! ✨", style = MaterialTheme.typography.labelLarge)
                    }
                }
            }

            // Toast
            toastMsg?.let { msg ->
                KawaiiSnackbar(
                    message = msg,
                    onDismiss = { toastMsg = null },
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 24.dp, start = 16.dp, end = 16.dp)
                )
            }
        }
    }
}

@Composable
private fun SmallIconBtn(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    badge: Int,
    onClick: () -> Unit,
    tint: Color
) {
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.88f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "iconScale"
    )
    BadgedBox(badge = {
        if (badge > 0) Badge { Text("$badge") }
    }) {
        IconButton(
            onClick = onClick,
            modifier = Modifier.scale(scale)
        ) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(24.dp))
        }
    }
}
