package com.kawaii.doodle.presentation.ui.friends

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.kawaii.doodle.domain.model.Friend
import com.kawaii.doodle.domain.model.FriendStatus
import com.kawaii.doodle.domain.model.User
import com.kawaii.doodle.presentation.ui.shared.KawaiiConfirmDialog
import com.kawaii.doodle.presentation.ui.shared.KawaiiSnackbar
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FriendsScreen(
    onNavigateBack: () -> Unit,
    viewModel: FriendViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    var searchText by remember { mutableStateOf("") }
    var removeTarget by remember { mutableStateOf<Friend?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("Friends 💫", style = MaterialTheme.typography.titleLarge)
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Rounded.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadFriends() }) {
                        Icon(Icons.Rounded.Refresh, "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                // Search bar
                item {
                    SearchBar(
                        text = searchText,
                        onTextChange = { searchText = it },
                        isLoading = state.isSearching,
                        onSearch = { viewModel.searchFriend(searchText) }
                    )
                }

                // Search result (animated appearance)
                state.searchResult?.let { user ->
                    item {
                        AnimatedVisibility(
                            visible = true,
                            enter = expandVertically() + fadeIn(tween(300))
                        ) {
                            SearchResultCard(user = user, onAdd = { viewModel.sendRequest(user) }, onDismiss = { viewModel.clearSearch() })
                        }
                    }
                }

                // Error
                state.error?.let { err ->
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                        ) {
                            Text(
                                err,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }
                }

                // Pending
                val pending = state.friends.filter { it.status == FriendStatus.PENDING && !it.isRequester }
                if (pending.isNotEmpty()) {
                    item {
                        Text(
                            "💌 Pending Requests (${pending.size})",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                    itemsIndexed(pending, key = { _, f -> f.relId }) { idx, friend ->
                        AnimatedFriendCard(index = idx, friend = friend,
                            onAccept = { viewModel.acceptRequest(friend.relId, friend.username) },
                            onRemove = { removeTarget = friend })
                    }
                }

                // Accepted
                val accepted = state.friends.filter { it.status == FriendStatus.ACCEPTED }
                if (accepted.isNotEmpty()) {
                    item {
                        Text(
                            "✨ Friends (${accepted.size})",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                    itemsIndexed(accepted, key = { _, f -> f.relId }) { idx, friend ->
                        AnimatedFriendCard(index = idx + pending.size, friend = friend,
                            onRemove = { removeTarget = friend })
                    }
                }

                if (state.isLoading) {
                    item {
                        Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                }

                if (state.friends.isEmpty() && !state.isLoading) {
                    item {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("👋", fontSize = 56.sp)
                            Spacer(Modifier.height(12.dp))
                            Text(
                                "Search for friends by their Kawaii ID!",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            state.toast?.let { msg ->
                KawaiiSnackbar(message = msg, onDismiss = { viewModel.clearToast() },
                    modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 24.dp, start = 16.dp, end = 16.dp))
            }
        }
    }

    removeTarget?.let { friend ->
        KawaiiConfirmDialog(
            title = "Remove ${friend.username}? 💔",
            message = "You'll need to add them again to reconnect.",
            confirmText = "Remove",
            cancelText = "Keep 💖",
            onConfirm = { viewModel.removeFriend(friend.relId); removeTarget = null },
            onDismiss = { removeTarget = null }
        )
    }
}

@Composable
private fun SearchBar(
    text: String, onTextChange: (String) -> Unit,
    isLoading: Boolean, onSearch: () -> Unit
) {
    val cs = MaterialTheme.colorScheme
    OutlinedTextField(
        value = text,
        onValueChange = onTextChange,
        placeholder = { Text("Kawaii ID, e.g. BubblyKitten-1234", style = MaterialTheme.typography.bodySmall) },
        shape = RoundedCornerShape(28.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = cs.primary,
            unfocusedBorderColor = cs.outlineVariant
        ),
        singleLine = true,
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        keyboardActions = KeyboardActions(onSearch = { onSearch() }),
        trailingIcon = {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp).padding(2.dp), strokeWidth = 2.dp)
            } else {
                IconButton(onClick = onSearch) {
                    Icon(Icons.Rounded.Search, "Search", tint = cs.primary)
                }
            }
        },
        modifier = Modifier.fillMaxWidth()
    )
}

@Composable
private fun AnimatedFriendCard(index: Int, friend: Friend, onAccept: (() -> Unit)? = null, onRemove: () -> Unit) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(friend.relId) {
        delay(index.toLong() * 60)
        visible = true
    }
    AnimatedVisibility(
        visible = visible,
        enter = slideInHorizontally(initialOffsetX = { it / 2 }, animationSpec = tween(300)) + fadeIn(tween(300))
    ) {
        FriendCard(friend = friend, onAccept = onAccept, onRemove = onRemove)
    }
}

@Composable
private fun FriendCard(friend: Friend, onAccept: (() -> Unit)? = null, onRemove: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = cs.surfaceVariant.copy(alpha = 0.5f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(48.dp).clip(CircleShape).background(cs.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                if (friend.avatarUrl != null) {
                    AsyncImage(friend.avatarUrl, friend.username, modifier = Modifier.fillMaxSize())
                } else {
                    Text(friend.username.first().uppercase(), fontWeight = FontWeight.Bold, color = cs.onPrimaryContainer)
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(friend.username, style = MaterialTheme.typography.titleSmall)
                Text(friend.kawaiiId, style = MaterialTheme.typography.labelSmall, color = cs.primary)
                if (friend.status == FriendStatus.PENDING) {
                    Text(
                        if (friend.isRequester) "Request sent 💌" else "Wants to be friends! 👋",
                        style = MaterialTheme.typography.labelSmall, color = cs.onSurfaceVariant
                    )
                }
            }
            if (onAccept != null) {
                FilledTonalIconButton(onClick = onAccept, modifier = Modifier.size(36.dp)) {
                    Icon(Icons.Rounded.Check, "Accept", modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.width(4.dp))
            }
            IconButton(onClick = onRemove, modifier = Modifier.size(36.dp)) {
                Icon(Icons.Rounded.Close, "Remove", tint = cs.error, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun SearchResultCard(user: User, onAdd: () -> Unit, onDismiss: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = cs.tertiaryContainer),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(cs.tertiary.copy(0.3f)),
                contentAlignment = Alignment.Center) {
                if (user.avatarUrl != null) AsyncImage(user.avatarUrl, user.username, modifier = Modifier.fillMaxSize())
                else Text(user.username.first().uppercase(), fontWeight = FontWeight.Bold, color = cs.onTertiaryContainer)
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(user.username, style = MaterialTheme.typography.titleSmall, color = cs.onTertiaryContainer)
                Text(user.kawaiiId, style = MaterialTheme.typography.labelSmall, color = cs.tertiary)
            }
            FilledTonalIconButton(onClick = onAdd, modifier = Modifier.size(36.dp)) {
                Icon(Icons.Rounded.PersonAdd, "Add", modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(4.dp))
            IconButton(onClick = onDismiss, modifier = Modifier.size(36.dp)) {
                Icon(Icons.Rounded.Close, "Dismiss", modifier = Modifier.size(18.dp))
            }
        }
    }
}
