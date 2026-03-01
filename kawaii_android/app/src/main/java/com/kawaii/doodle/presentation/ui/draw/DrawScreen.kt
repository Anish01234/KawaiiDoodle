package com.kawaii.doodle.presentation.ui.draw

import android.graphics.*
import android.graphics.Paint
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.Canvas
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.*
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import coil.request.CachePolicy
import com.kawaii.doodle.presentation.theme.KawaiiPink
import com.kawaii.doodle.presentation.ui.shared.KawaiiConfirmDialog
import com.kawaii.doodle.presentation.ui.shared.KawaiiSnackbar

private val PALETTE = listOf(
    Color(0xFFFF6B6B), Color(0xFFFFD1DC), Color(0xFFFF9AA2), Color(0xFFFFB7B2),
    Color(0xFFBDE0FE), Color(0xFFA0C4FF), Color(0xFF9BF6FF), Color(0xFFCAFFBF),
    Color(0xFFFDFFB6), Color(0xFFFFC6FF), Color(0xFFBDB2FF),
    Color(0xFFFFFFFC), Color(0xFFD0D0D0), Color(0xFF808080), Color(0xFF000000)
)

private val STAMPS = listOf("💖", "⭐", "🌸", "🦋", "🌈", "✨", "🍀", "🎀", "🐱", "🍕")

@Composable
fun DrawScreen(
    onNavigateBack: () -> Unit,
    onSentSuccessfully: () -> Unit,
    viewModel: DrawViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var showConfirmClear by remember { mutableStateOf(false) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    // The working bitmap
    var canvasBitmap by remember { mutableStateOf<android.graphics.Bitmap?>(null) }
    var bitmapInvalidator by remember { mutableStateOf(0) }
    var canvasSize by remember { mutableStateOf(IntSize.Zero) }

    // Drawing path state
    var currentPath by remember { mutableStateOf<androidx.compose.ui.graphics.Path?>(null) }
    var lastPoint by remember { mutableStateOf<Offset?>(null) }

    // Load pending doodle if editing
    LaunchedEffect(viewModel.pendingDoodleData) {
        viewModel.pendingDoodleData?.let { data ->
            // Decode base64 to bitmap — done on launching effect (background-safe)
            val bytes = if (data.contains(",")) {
                android.util.Base64.decode(data.substringAfter(","), android.util.Base64.DEFAULT)
            } else {
                android.util.Base64.decode(data, android.util.Base64.DEFAULT)
            }
            val decoded = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            canvasBitmap = decoded
            bitmapInvalidator++
        }
    }

    LaunchedEffect(state.sendSuccess) {
        if (state.sendSuccess) {
            viewModel.clearSendSuccess()
            onSentSuccessfully()
        }
    }

    LaunchedEffect(state.error) {
        state.error?.let { toastMsg = it; viewModel.clearError() }
    }

    Scaffold(containerColor = Color(0xFFFFF0F5)) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(modifier = Modifier.fillMaxSize()) {
            // ── Top toolbar ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Rounded.ArrowBack, "Back", tint = KawaiiPink)
                }

                Text("Draw! ✏️", fontWeight = FontWeight.Black, fontSize = 20.sp)

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    // Undo
                    IconButton(onClick = {
                        val prev = viewModel.undo()
                        if (prev != null) { canvasBitmap = prev; bitmapInvalidator++ }
                    }, enabled = state.canUndo) {
                        Icon(Icons.Rounded.Undo, "Undo",
                            tint = if (state.canUndo) Color(0xFF6B7280) else Color(0xFFD1D5DB))
                    }
                    // Redo
                    IconButton(onClick = {
                        val next = viewModel.redo()
                        if (next != null) { canvasBitmap = next; bitmapInvalidator++ }
                    }, enabled = state.canRedo) {
                        Icon(Icons.Rounded.Redo, "Redo",
                            tint = if (state.canRedo) Color(0xFF6B7280) else Color(0xFFD1D5DB))
                    }
                    // Clear
                    IconButton(onClick = { showConfirmClear = true }) {
                        Icon(Icons.Rounded.Delete, "Clear", tint = Color(0xFFF87171))
                    }
                }
            }

            // ── Friend recipient bubbles ──
            if (state.friends.isNotEmpty()) {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.height(72.dp)
                ) {
                    items(state.friends) { friend ->
                        val isSelected = friend.kawaiiId in state.selectedRecipients
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clickable { viewModel.toggleRecipient(friend.kawaiiId) }
                                .padding(4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(if (isSelected) KawaiiPink else Color(0xFFE5E7EB)),
                                contentAlignment = Alignment.Center
                            ) {
                                if (friend.avatarUrl != null) {
                                    AsyncImage(
                                        model = ImageRequest.Builder(context)
                                            .data(friend.avatarUrl)
                                            .crossfade(true)
                                            .diskCachePolicy(CachePolicy.ENABLED)
                                            .memoryCachePolicy(CachePolicy.ENABLED)
                                            .build(),
                                        contentDescription = friend.username,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                } else {
                                    Text(
                                        friend.username.first().uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) Color.White else Color(0xFF6B7280)
                                    )
                                }
                            }
                            Text(
                                friend.username.split(" ").first().take(6),
                                fontSize = 9.sp,
                                color = if (isSelected) KawaiiPink else Color(0xFF9CA3AF),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // ── Canvas ──
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(12.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
                    .onSizeChanged { size ->
                        canvasSize = size
                        if (canvasBitmap == null) {
                            canvasBitmap = android.graphics.Bitmap.createBitmap(
                                size.width, size.height, android.graphics.Bitmap.Config.ARGB_8888
                            ).also { bm ->
                                android.graphics.Canvas(bm).drawColor(android.graphics.Color.WHITE)
                                viewModel.pushUndoState(bm)
                            }
                        }
                    }
                    .pointerInput(state.tool, state.color, state.strokeWidth) {
                        awaitEachGesture {
                            val down = awaitFirstDown()
                            val pos = down.position
                            lastPoint = pos

                            when (state.tool) {
                                DrawTool.STAMP -> {
                                    canvasBitmap?.let { bm ->
                                        val c = android.graphics.Canvas(bm)
                                        val paint = android.graphics.Paint().apply { textSize = state.strokeWidth * 4 }
                                        c.drawText(state.stampEmoji, pos.x, pos.y, paint)
                                        viewModel.pushUndoState(bm)
                                        bitmapInvalidator++
                                    }
                                }
                                DrawTool.FILL -> {
                                    canvasBitmap?.let { bm ->
                                        val filled = viewModel.floodFill(
                                            bm,
                                            pos.x.toInt().coerceIn(0, bm.width - 1),
                                            pos.y.toInt().coerceIn(0, bm.height - 1),
                                            state.color
                                        )
                                        canvasBitmap = filled
                                        viewModel.pushUndoState(filled)
                                        bitmapInvalidator++
                                    }
                                }
                                else -> {
                                    // PEN / ERASER: draw live
                                    do {
                                        val event = awaitPointerEvent()
                                        val change = event.changes.first()
                                        change.consume()
                                        val newPos = change.position
                                        canvasBitmap?.let { bm ->
                                            val c = android.graphics.Canvas(bm)
                                            val paint = android.graphics.Paint().apply {
                                                isAntiAlias = true
                                                strokeWidth = state.strokeWidth
                                                strokeCap = android.graphics.Paint.Cap.ROUND
                                                strokeJoin = android.graphics.Paint.Join.ROUND
                                                style = android.graphics.Paint.Style.STROKE
                                                if (state.tool == DrawTool.ERASER) {
                                                    xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
                                                } else {
                                                    color = state.color
                                                }
                                            }
                                            val lp = lastPoint ?: newPos
                                            c.drawLine(lp.x, lp.y, newPos.x, newPos.y, paint)
                                            bitmapInvalidator++
                                        }
                                        lastPoint = newPos
                                    } while (event.changes.any { it.pressed })
                                    canvasBitmap?.let { viewModel.pushUndoState(it) }
                                }
                            }
                        }
                    }
            ) {
                // Render the bitmap
                val bitmap = canvasBitmap
                if (bitmap != null) {
                    androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                        @Suppress("UNUSED_EXPRESSION")
                        bitmapInvalidator // trigger recompose
                        drawIntoCanvas { canvas ->
                            canvas.nativeCanvas.drawBitmap(bitmap, 0f, 0f, null)
                        }
                    }
                }
            }

            // ── Bottom toolbar ──
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Color palette
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp)
                ) {
                    items(PALETTE) { paletteColor ->
                        val isSelected = state.color == paletteColor.toArgb() && state.tool == DrawTool.PEN
                        Box(
                            modifier = Modifier
                                .size(if (isSelected) 36.dp else 30.dp)
                                .clip(CircleShape)
                                .background(paletteColor)
                                .border(
                                    if (isSelected) 3.dp else 1.dp,
                                    if (isSelected) Color.White else Color.Transparent,
                                    CircleShape
                                )
                                .clickable { viewModel.setColor(paletteColor.toArgb()) }
                        )
                    }
                }

                // Tool row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Tool buttons
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ToolButton("✏️", state.tool == DrawTool.PEN) { viewModel.setTool(DrawTool.PEN) }
                        ToolButton("🧼", state.tool == DrawTool.ERASER) { viewModel.setTool(DrawTool.ERASER) }
                        ToolButton("🪣", state.tool == DrawTool.FILL) { viewModel.setTool(DrawTool.FILL) }
                    }

                    // Brush size slider
                    Slider(
                        value = state.strokeWidth,
                        onValueChange = { viewModel.setStrokeWidth(it) },
                        valueRange = 3f..40f,
                        colors = SliderDefaults.colors(
                            thumbColor = KawaiiPink,
                            activeTrackColor = KawaiiPink
                        ),
                        modifier = Modifier.width(100.dp)
                    )
                }

                // Stamp row
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    items(STAMPS) { emoji ->
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(
                                    if (state.stampEmoji == emoji && state.tool == DrawTool.STAMP)
                                        KawaiiPink.copy(alpha = 0.15f)
                                    else Color.Transparent
                                )
                                .clickable { viewModel.setStampEmoji(emoji) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(emoji, fontSize = 18.sp)
                        }
                    }
                }

                // Action row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            canvasBitmap?.let { viewModel.saveDraft(it) }
                            toastMsg = "Draft saved! 💾"
                        },
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF60A5FA)),
                        border = BorderStroke(1.dp, Color(0xFF93C5FD)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Rounded.BookmarkBorder, null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Save Draft", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }

                    Button(
                        onClick = { canvasBitmap?.let { viewModel.sendDoodle(it) } },
                        enabled = !state.isSending && state.selectedRecipients.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(containerColor = KawaiiPink),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        if (state.isSending) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Rounded.Send, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("SEND MAGIC ✨", fontWeight = FontWeight.Black, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // Dialogs / overlays
        if (showConfirmClear) {
            KawaiiConfirmDialog(
                title = "Clear Canvas? 🎨",
                message = "This will erase all your magic!",
                confirmText = "Clear! 🧊",
                onConfirm = {
                    showConfirmClear = false
                    canvasBitmap?.let { bm ->
                        android.graphics.Canvas(bm).drawColor(android.graphics.Color.WHITE)
                        viewModel.pushUndoState(bm)
                        bitmapInvalidator++
                    }
                },
                onDismiss = { showConfirmClear = false }
            )
        }

        toastMsg?.let { msg ->
            KawaiiSnackbar(
                message = msg,
                onDismiss = { toastMsg = null },
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            )
        }
        }
    }
}

@Composable
private fun ToolButton(emoji: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(if (selected) KawaiiPink.copy(alpha = 0.15f) else Color.Transparent)
            .border(
                if (selected) 2.dp else 0.dp,
                if (selected) KawaiiPink else Color.Transparent,
                CircleShape
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(emoji, fontSize = 18.sp)
    }
}
