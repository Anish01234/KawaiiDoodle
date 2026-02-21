package io.kawaii.doodle

import android.app.WallpaperManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Build
import android.util.Base64
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "Wallpaper")
class WallpaperPlugin : Plugin() {

    @PluginMethod
    fun setSeamlessDoodleAsWallpaper(call: PluginCall) {
        android.util.Log.d(CrashTags.WALLPAPER, "Method called: setSeamlessDoodleAsWallpaper")
        val base64Image = call.getString("image")
        if (base64Image == null) {
            call.reject("No image provided")
            return
        }

        try {
            // 1. Decode the received doodle (Base64 -> Bitmap)
            val cleanBase64 = if (base64Image.contains(",")) base64Image.split(",")[1] else base64Image
            val decodedString = safeRun(CrashTags.IMAGE, "Base64 decode") {
                Base64.decode(cleanBase64, Base64.DEFAULT)
            } ?: run {
                call.reject("Failed to decode Base64 data")
                return
            }
            var doodleBitmap = safeRun(CrashTags.IMAGE, "BitmapFactory.decodeByteArray") {
                BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)
            }

            if (doodleBitmap == null) {
                call.reject("Failed to decode bitmap")
                return
            }
            android.util.Log.d(CrashTags.WALLPAPER, "Bitmap decoded successfully. Size: ${doodleBitmap.width}x${doodleBitmap.height}")

            // 2. Get Device Screen Dimensions
            val metrics = context.resources.displayMetrics
            val screenWidth = metrics.widthPixels
            val screenHeight = metrics.heightPixels

            // 3. Create Full-Screen Canvas
            val wallpaperBitmap = Bitmap.createBitmap(screenWidth, screenHeight, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(wallpaperBitmap)

            // 4. Sample Color at (5, 5)
            // Ensure 5,5 is within bounds, else fallback to white
            val sampleX = 5.coerceAtMost(doodleBitmap.width - 1)
            val sampleY = 5.coerceAtMost(doodleBitmap.height - 1)
            val pixelColor = doodleBitmap.getPixel(sampleX, sampleY)
            
            // Log the color
            val hexColor = String.format("#%06X", (0xFFFFFF and pixelColor))
            android.util.Log.d(CrashTags.WALLPAPER, "Sampled color: $hexColor at ($sampleX, $sampleY)")

            // 5. Fill Background Seamlessly
            canvas.drawColor(pixelColor)

            // 6. Draw Doodle in Center
            // Calculate center position
            val left = (screenWidth - doodleBitmap.width) / 2f
            val top = (screenHeight - doodleBitmap.height) / 2f
            
            canvas.drawBitmap(doodleBitmap, left, top, null)
            android.util.Log.d(CrashTags.WALLPAPER, "Doodle drawn at $left, $top")

            // 7. Set as Lock Screen Wallpaper
            val wallpaperManager = WallpaperManager.getInstance(context)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                try {
                    // Try Lock Screen First
                    android.util.Log.d(CrashTags.WALLPAPER, "Attempting to set Lock Screen...")
                    wallpaperManager.setBitmap(wallpaperBitmap, null, true, WallpaperManager.FLAG_LOCK)
                    android.util.Log.d(CrashTags.WALLPAPER, "Lock Screen set successfully.")
                    
                    // ALSO Try System Screen (Home Screen) just for verification
                    // android.util.Log.d(CrashTags.WALLPAPER, "Attempting to set System Screen...")
                    // wallpaperManager.setBitmap(wallpaperBitmap, null, true, WallpaperManager.FLAG_SYSTEM)
                    
                } catch (e: Exception) {
                    android.util.Log.e(CrashTags.WALLPAPER, "Failed to set Lock Screen: ${e.message}", e)
                    // Fallback to setting globally (both)
                    wallpaperManager.setBitmap(wallpaperBitmap)
                }
            } else {
                // Fallback for older devices (Sets both usually)
                wallpaperManager.setBitmap(wallpaperBitmap)
            }

            // Show a Toast from Native side to verify execution
            val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
            mainHandler.post {
               android.widget.Toast.makeText(context, "Lock Screen Updated! (Native)", android.widget.Toast.LENGTH_SHORT).show()
            }

            call.resolve()

            // Cleanup
            if (!doodleBitmap.isRecycled) doodleBitmap.recycle()
            if (!wallpaperBitmap.isRecycled) wallpaperBitmap.recycle()

        } catch (e: Exception) {
            android.util.Log.e(CrashTags.WALLPAPER, "❌ CRITICAL ERROR in setSeamlessDoodleAsWallpaper: ${e.message}", e)
            call.reject("Error setting wallpaper: " + e.message)
        }
    }
}
