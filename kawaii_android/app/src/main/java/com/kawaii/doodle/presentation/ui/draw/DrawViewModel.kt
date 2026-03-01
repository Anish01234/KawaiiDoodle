package com.kawaii.doodle.presentation.ui.draw

import android.graphics.*
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kawaii.doodle.domain.model.Friend
import com.kawaii.doodle.domain.model.FriendStatus
import com.kawaii.doodle.domain.repository.AuthRepository
import com.kawaii.doodle.domain.repository.DoodleRepository
import com.kawaii.doodle.domain.repository.DraftRepository
import com.kawaii.doodle.domain.repository.FriendRepository
import com.kawaii.doodle.domain.repository.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.util.Base64
import javax.inject.Inject

enum class DrawTool { PEN, ERASER, FILL, STAMP }

data class DrawUiState(
    val tool: DrawTool = DrawTool.PEN,
    val color: Int = Color.rgb(255, 107, 107),
    val strokeWidth: Float = 10f,
    val stampEmoji: String = "💖",
    val selectedRecipients: Set<String> = emptySet(),   // Kawaii IDs
    val friends: List<Friend> = emptyList(),
    val canUndo: Boolean = false,
    val canRedo: Boolean = false,
    val isSending: Boolean = false,
    val sendSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class DrawViewModel @Inject constructor(
    private val authRepo: AuthRepository,
    private val profileRepo: ProfileRepository,
    private val doodleRepo: DoodleRepository,
    private val draftRepo: DraftRepository,
    private val friendRepo: FriendRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(DrawUiState())
    val uiState: StateFlow<DrawUiState> = _uiState.asStateFlow()

    // Undo/Redo stack — store full Bitmap snapshots
    private val undoStack = java.util.LinkedList<Bitmap>()
    private val redoStack = java.util.LinkedList<Bitmap>()

    // Pending doodle to edit (passed from history)
    val pendingDoodleData: String? = savedStateHandle["pendingDoodle"]

    init {
        loadFriends()
    }

    private fun loadFriends() {
        viewModelScope.launch {
            val userId = authRepo.getCurrentUserId() ?: return@launch
            try {
                val friends = friendRepo.getFriends(userId)
                _uiState.update { it.copy(friends = friends.filter { f -> f.status == FriendStatus.ACCEPTED }) }
            } catch (_: Exception) {}
        }
    }

    fun setTool(tool: DrawTool) { _uiState.update { it.copy(tool = tool) } }
    fun setColor(color: Int) { _uiState.update { it.copy(color = color, tool = DrawTool.PEN) } }
    fun setStrokeWidth(width: Float) { _uiState.update { it.copy(strokeWidth = width) } }
    fun setStampEmoji(emoji: String) { _uiState.update { it.copy(stampEmoji = emoji, tool = DrawTool.STAMP) } }

    fun toggleRecipient(kawaiiId: String) {
        _uiState.update { state ->
            val current = state.selectedRecipients.toMutableSet()
            if (current.contains(kawaiiId)) current.remove(kawaiiId) else current.add(kawaiiId)
            state.copy(selectedRecipients = current)
        }
    }

    fun pushUndoState(bitmap: Bitmap) {
        undoStack.addLast(bitmap.copy(bitmap.config ?: Bitmap.Config.ARGB_8888, false))
        redoStack.clear()
        _uiState.update { it.copy(canUndo = undoStack.size > 1, canRedo = false) }
    }

    fun undo(): Bitmap? {
        if (undoStack.size <= 1) return null
        val current = undoStack.removeLast()
        redoStack.addLast(current)
        _uiState.update { it.copy(canUndo = undoStack.size > 1, canRedo = true) }
        return undoStack.lastOrNull()
    }

    fun redo(): Bitmap? {
        val next = redoStack.removeLastOrNull() ?: return null
        undoStack.addLast(next)
        _uiState.update { it.copy(canUndo = true, canRedo = redoStack.isNotEmpty()) }
        return next
    }

    fun sendDoodle(bitmap: Bitmap) {
        viewModelScope.launch {
            val state = _uiState.value
            if (state.selectedRecipients.isEmpty()) {
                _uiState.update { it.copy(error = "Select friends to send to! 👆") }
                return@launch
            }
            _uiState.update { it.copy(isSending = true) }
            val userId = authRepo.getCurrentUserId() ?: return@launch
            val userProfile = try {
                profileRepo.getProfile(userId)
            } catch (_: Exception) {
                return@launch
            }

            // Resolve kawaii IDs → actual UUIDs
            val receiverIds = state.friends
                .filter { it.kawaiiId in state.selectedRecipients }
                .map { it.actualId }

            val imageData = bitmapToBase64(flattenBitmap(bitmap))

            try {
                doodleRepo.sendDoodle(
                    senderId = userId,
                    receiverIds = receiverIds,
                    imageData = imageData
                )
                _uiState.update { it.copy(isSending = false, sendSuccess = true, selectedRecipients = emptySet()) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isSending = false, error = e.message ?: "Send failed 😭") }
            }
        }
    }

    fun saveDraft(bitmap: Bitmap) {
        viewModelScope.launch {
            val userId = authRepo.getCurrentUserId() ?: return@launch
            val imageData = bitmapToBase64(flattenBitmap(bitmap))
            try {
                draftRepo.saveDraft(userId, imageData)
                _uiState.update { it.copy(error = null) }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun clearError() { _uiState.update { it.copy(error = null) } }
    fun clearSendSuccess() { _uiState.update { it.copy(sendSuccess = false) } }

    /** Flatten ARGB bitmap onto white background and encode as JPEG base64 */
    private fun flattenBitmap(src: Bitmap): Bitmap {
        val result = Bitmap.createBitmap(src.width, src.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(result)
        canvas.drawColor(Color.WHITE)
        canvas.drawBitmap(src, 0f, 0f, null)
        return result
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, stream)
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(stream.toByteArray())
    }

    /** Flood-fill algorithm on Bitmap pixel data */
    fun floodFill(bitmap: Bitmap, startX: Int, startY: Int, fillColor: Int): Bitmap {
        val mutable = bitmap.copy(Bitmap.Config.ARGB_8888, true)
        val width = mutable.width
        val height = mutable.height
        val targetColor = mutable.getPixel(startX.coerceIn(0, width - 1), startY.coerceIn(0, height - 1))
        if (targetColor == fillColor) return mutable

        val pixels = IntArray(width * height)
        mutable.getPixels(pixels, 0, width, 0, 0, width, height)
        val filled = BooleanArray(width * height)

        val stack = java.util.LinkedList<Int>()
        val startIdx = startY * width + startX
        if (startIdx !in pixels.indices) return mutable
        stack.addLast(startIdx)

        while (stack.isNotEmpty()) {
            val idx = stack.removeLast()
            if (idx < 0 || idx >= pixels.size || filled[idx] || pixels[idx] != targetColor) continue
            filled[idx] = true
            pixels[idx] = fillColor
            val x = idx % width
            val y = idx / width
            if (x + 1 < width) stack.addLast(idx + 1)
            if (x - 1 >= 0) stack.addLast(idx - 1)
            if (y + 1 < height) stack.addLast(idx + width)
            if (y - 1 >= 0) stack.addLast(idx - width)
        }

        mutable.setPixels(pixels, 0, width, 0, 0, width, height)
        return mutable
    }
}
