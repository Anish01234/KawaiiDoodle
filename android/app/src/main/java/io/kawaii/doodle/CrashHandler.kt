package io.kawaii.doodle

import android.util.Log
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

// ─────────────────────────────────────────────────────────────────────────────
// CrashHandler.kt
//
// Provides:
//   1. GlobalCrashHandler  – catches ALL unhandled exceptions on ANY thread
//   2. globalCoroutineScope – app-wide scope with a CoroutineExceptionHandler
//   3. safeRun / safeAsync  – inline helpers for risky calls (Supabase, JSON,
//      image decoding, etc.)
//
// HOW TO INSTALL:
//   • Call GlobalCrashHandler.install() inside MainApplication.onCreate()
//   • Use globalCoroutineScope.launch { … } instead of GlobalScope.launch
//   • Wrap risky one-off calls with safeRun { … }
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. GLOBAL UNCAUGHT EXCEPTION HANDLER ────────────────────────────────────
/**
 * Catches every crash on every thread (main, background, Binder threads, etc.)
 * and writes a full structured log to Logcat before delegating to the default
 * handler so the system can still generate a crash report / restart the app.
 *
 * Tag: GLOBAL_CRASH
 */
object GlobalCrashHandler : Thread.UncaughtExceptionHandler {

    private const val TAG = "GLOBAL_CRASH"

    /** The system's original handler – called after we finish logging. */
    private var defaultHandler: Thread.UncaughtExceptionHandler? = null

    /**
     * Call once in [MainApplication.onCreate].
     * Replaces the default handler with this one while keeping a reference
     * to the original so we can still delegate after logging.
     */
    fun install() {
        defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler(this)
        Log.i(TAG, "✅ Global uncaught exception handler installed")
    }

    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        try {
            Log.e(TAG, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            Log.e(TAG, "💥 UNCAUGHT EXCEPTION on thread: ${thread.name} (id=${thread.id})")
            Log.e(TAG, "   Exception : ${throwable.javaClass.name}")
            Log.e(TAG, "   Message   : ${throwable.message}")
            Log.e(TAG, "   Cause     : ${throwable.cause?.javaClass?.name ?: "none"}")
            Log.e(TAG, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            // Full stack trace
            Log.e(TAG, "Stack trace:", throwable)

            // Walk the cause chain so nested exceptions are also visible
            var cause = throwable.cause
            var depth = 1
            while (cause != null) {
                Log.e(TAG, "Caused by (depth=$depth):", cause)
                cause = cause.cause
                depth++
            }
        } finally {
            // Always hand off to the system so it can show the crash dialog /
            // restart the app / write a tombstone, etc.
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }
}

// ─── 2. COROUTINE EXCEPTION HANDLER ──────────────────────────────────────────
/**
 * Catches any unhandled exception thrown inside a coroutine launched on
 * [globalCoroutineScope].
 *
 * Tag: COROUTINE_CRASH
 */
private const val COROUTINE_TAG = "COROUTINE_CRASH"

val globalCoroutineExceptionHandler = CoroutineExceptionHandler { context, throwable ->
    Log.e(COROUTINE_TAG, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    Log.e(COROUTINE_TAG, "💥 Coroutine crashed – context: $context")
    Log.e(COROUTINE_TAG, "   Exception : ${throwable.javaClass.name}")
    Log.e(COROUTINE_TAG, "   Message   : ${throwable.message}")
    Log.e(COROUTINE_TAG, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    Log.e(COROUTINE_TAG, "Stack trace:", throwable)
}

/**
 * App-wide coroutine scope.
 * • [SupervisorJob] – one child failure does NOT cancel sibling coroutines.
 * • [Dispatchers.Default] – background thread pool.
 * • [globalCoroutineExceptionHandler] – logs every unhandled coroutine error.
 *
 * Usage:
 *   globalCoroutineScope.launch { someAsyncWork() }
 *   globalCoroutineScope.launch(Dispatchers.Main) { updateUI() }
 */
val globalCoroutineScope = CoroutineScope(
    SupervisorJob() + Dispatchers.Default + globalCoroutineExceptionHandler
)

// ─── 3. SAFE WRAPPERS FOR RISKY OPERATIONS ───────────────────────────────────

/**
 * Runs [block] synchronously, logging any exception under [tag].
 * Returns [default] if the block throws.
 *
 * Use for risky synchronous calls:
 *   • JSON parsing
 *   • Bitmap / image decoding
 *   • SharedPreferences reads
 *   • Any code that might throw unexpectedly
 *
 * Example:
 *   val bitmap = safeRun("IMAGE_DECODE") {
 *       BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
 *   }
 */
inline fun <T> safeRun(
    tag: String,
    operationName: String = "operation",
    default: T? = null,
    block: () -> T?
): T? {
    return try {
        block()
    } catch (e: Exception) {
        Log.e(tag, "❌ safeRun failed during '$operationName': ${e.message}", e)
        default
    }
}

/**
 * Suspending version of [safeRun] for use inside coroutines.
 * Wraps and logs any exception from a suspend [block].
 *
 * Use for risky async calls:
 *   • Supabase queries / realtime subscriptions
 *   • Network requests
 *   • Room database operations
 *
 * Example:
 *   val data = safeAsync("SUPABASE", "fetchPosts") {
 *       supabase.from("posts").select().decodeList<Post>()
 *   }
 */
suspend inline fun <T> safeAsync(
    tag: String,
    operationName: String = "async operation",
    default: T? = null,
    crossinline block: suspend () -> T?
): T? {
    return try {
        block()
    } catch (e: Exception) {
        Log.e(tag, "❌ safeAsync failed during '$operationName': ${e.message}", e)
        default
    }
}

// ─── 4. CONVENIENCE TAGS (use these for consistency across the app) ───────────
object CrashTags {
    const val GLOBAL      = "GLOBAL_CRASH"
    const val COROUTINE   = "COROUTINE_CRASH"
    const val SUPABASE    = "SUPABASE_ERROR"
    const val IMAGE       = "IMAGE_ERROR"
    const val JSON        = "JSON_ERROR"
    const val FIREBASE    = "FIREBASE_ERROR"
    const val WALLPAPER   = "WALLPAPER_ERROR"
    const val FCM         = "FCM_ERROR"
    const val NETWORK     = "NETWORK_ERROR"
}
