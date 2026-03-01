package com.kawaii.doodle.presentation.ui.history

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.kawaii.doodle.domain.model.Doodle
import com.kawaii.doodle.domain.model.Draft
import com.kawaii.doodle.presentation.ui.shared.KawaiiConfirmDialog
import com.kawaii.doodle.presentation.ui.shared.KawaiiSnackbar
import com.kawaii.doodle.presentation.ui.shared.ShimmerCard
import com.kawaii.doodle.presentation.ui.shared.convertBase64ToBitmap
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    onNavigateBack: () -> Unit,
    onEditDoodle: (String) -> Unit,
    viewModel: HistoryViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()
    var wallpaperTarget by remember { mutableStateOf<String?>(null) }

    // Infinite scroll trigger
    LaunchedEffect(listState) {
        snapshotFlow { listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index }
            .distinctUntilChanged()
            .collect { last ->
                if (last != null && last >= state.doodles.size - 3) viewModel.loadMoreDoodles()
            }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Magic History ✨", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Rounded.ArrowBack, "Back")
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        // PullToRefreshBox wraps the scrollable content and manages the refresh logic/UI
        PullToRefreshBox(
            isRefreshing = state.isLoading && state.doodles.isNotEmpty(),
            onRefresh = { viewModel.refresh() },
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            LazyColumn(
                state = listState,
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                // Drafts
                if (state.drafts.isNotEmpty()) {
                    item {
                        DraftsSection(
                            drafts = state.drafts,
                            hasMore = state.hasMoreDrafts,
                            onEdit = onEditDoodle,
                            onDelete = { viewModel.deleteDraft(it) },
                            onLoadMore = { viewModel.loadMoreDrafts() }
                        )
                    }
                }

                // Loading shimmer for initial load
                if (state.isLoading && state.doodles.isEmpty()) {
                    items(3) { ShimmerCard(modifier = Modifier.fillMaxWidth().aspectRatio(1f)) }
                } else if (state.doodles.isEmpty()) {
                    item {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("🥺", fontSize = 56.sp)
                            Spacer(Modifier.height(12.dp))
                            Text(
                                "No magic found yet…",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                } else {
                    itemsIndexed(state.doodles, key = { _, d -> d.id }) { idx, doodle ->
                        AnimatedDoodleCard(
                            index = idx,
                            doodle = doodle,
                            onEdit = { onEditDoodle(doodle.imageData) },
                            onSetWallpaper = { wallpaperTarget = doodle.imageData }
                        )
                    }
                    if (state.hasMoreDoodles) {
                        item {
                            Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        }
                    } else {
                        item {
                            Text(
                                "You've seen it all ✨",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth().padding(16.dp)
                            )
                        }
                    }
                }
            }

            state.toast?.let { msg ->
                KawaiiSnackbar(
                    message = msg,
                    onDismiss = { viewModel.clearToast() },
                    modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 24.dp, start = 16.dp, end = 16.dp)
                )
            }
        }
    }

    wallpaperTarget?.let { imageData ->
        KawaiiConfirmDialog(
            title = "New Look? 📱",
            message = "Set this doodle as your wallpaper?",
            confirmText = "Set Wallpaper! ✨",
            onConfirm = { viewModel.setWallpaper(imageData); wallpaperTarget = null },
            onDismiss = { wallpaperTarget = null }
        )
    }
}

@Composable
private fun AnimatedDoodleCard(index: Int, doodle: Doodle, onEdit: () -> Unit, onSetWallpaper: () -> Unit) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(doodle.id) {
        delay(index.coerceAtMost(5).toLong() * 80)
        visible = true
    }
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(300)) + slideInVertically(initialOffsetY = { it / 5 }, animationSpec = tween(300))
    ) {
        DoodleCard(doodle = doodle, onEdit = onEdit, onSetWallpaper = onSetWallpaper)
    }
}

@Composable
private fun DoodleCard(doodle: Doodle, onEdit: () -> Unit, onSetWallpaper: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = cs.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp, pressedElevation = 4.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Box {
            AsyncImage(
                model = convertBase64ToBitmap(doodle.imageData),
                contentDescription = "Doodle",
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxWidth().aspectRatio(1f)
            )
            // Floating action chips
            Column(
                modifier = Modifier.align(Alignment.TopEnd).padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                ActionChip(emoji = "✏️", label = "Edit", onClick = onEdit)
                ActionChip(emoji = "📱", label = "Wallpaper", onClick = onSetWallpaper)
            }
            // Unread dot
            if (!doodle.isRead) {
                Box(
                    Modifier.align(Alignment.TopStart).padding(12.dp)
                        .size(10.dp).background(cs.primary, CircleShape)
                )
            }
        }
        // Metadata
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                if (doodle.senderName != null) "📥 From ${doodle.senderName}" else "📤 Sent",
                style = MaterialTheme.typography.labelMedium,
                color = if (doodle.senderName != null) cs.secondary else cs.primary
            )
            Text(
                doodle.createdAt.take(10),
                style = MaterialTheme.typography.labelSmall,
                color = cs.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun DraftsSection(
    drafts: List<Draft>, hasMore: Boolean,
    onEdit: (String) -> Unit, onDelete: (String) -> Unit, onLoadMore: () -> Unit
) {
    val cs = MaterialTheme.colorScheme
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = cs.secondaryContainer.copy(alpha = 0.4f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                "📖 My Sketchbook",
                style = MaterialTheme.typography.titleSmall,
                color = cs.onSecondaryContainer,
                modifier = Modifier.padding(bottom = 10.dp)
            )
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                itemsIndexed(drafts, key = { _, d -> d.id }) { _, draft ->
                    Box(modifier = Modifier.size(96.dp).clip(RoundedCornerShape(16.dp)).background(cs.surface)) {
                        AsyncImage(
                            model = convertBase64ToBitmap(draft.imageData), contentDescription = "Draft",
                            contentScale = ContentScale.Fit, modifier = Modifier.fillMaxSize()
                        )
                        Row(
                            modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth()
                                .background(cs.scrim.copy(alpha = 0.2f)).padding(4.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            Text("✏️", modifier = Modifier.clickable { onEdit(draft.imageData) })
                            Text("🗑️", modifier = Modifier.clickable { onDelete(draft.id) })
                        }
                    }
                }
                if (hasMore) {
                    item {
                        Box(Modifier.size(96.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActionChip(emoji: String, label: String, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
        shadowElevation = 2.dp,
        modifier = Modifier.height(32.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(emoji, fontSize = 13.sp)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface)
        }
    }
}
