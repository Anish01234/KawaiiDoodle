package io.kawaii.doodle

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.WallpaperManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.os.Build
import android.util.Base64
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.util.Scanner

class WallpaperWorker(appContext: Context, workerParams: WorkerParameters) :
    Worker(appContext, workerParams) {

    override fun doWork(): Result {
        val doodleId = inputData.getString("doodle_id") ?: return Result.failure()
        Log.d("WallpaperWorker", "Starting background work for doodle: $doodleId")

        return try {
            // 1. Fetch Doodle from Supabase
            val supabaseUrl = "https://sonwqwsgacjzhbiplkyj.supabase.co/rest/v1/doodles?id=eq.$doodleId&select=image_data"
            val anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbndxd3NnYWNqemhiaXBsa3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDg4NzQsImV4cCI6MjA4NTg4NDg3NH0.ZnMvp4iYCM4yGYyLXm2VKbc0WmbLr0To1_Oe0wdrIcM"

            val url = URL(supabaseUrl)
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 15000 // 15s
            conn.readTimeout = 15000
            conn.setRequestProperty("apikey", anonKey)
            conn.setRequestProperty("Authorization", "Bearer $anonKey")

            if (conn.responseCode == 200) {
                val response = Scanner(conn.inputStream).useDelimiter("\\A").next()
                val jsonArray = JSONArray(response)
                
                if (jsonArray.length() > 0) {
                    val imageData = jsonArray.getJSONObject(0).getString("image_data")
                    val success = applyWallpaper(imageData)
                    
                    if (success) {
                        Log.d("WallpaperWorker", "✅ Lock screen updated successfully via Worker.")
                        showSuccessNotification()
                        return Result.success()
                    }
                }
            } else {
                Log.e("WallpaperWorker", "Failed to fetch doodle: ${conn.responseCode}")
            }
            Result.retry() // Retry if fetch failed
        } catch (e: Exception) {
            Log.e("WallpaperWorker", "Worker Error: ${e.message}")
            Result.failure()
        }
    }

    private fun showSuccessNotification() {
        val channelId = "PushNotifications"
        val notificationManager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Doodle Alerts", NotificationManager.IMPORTANCE_HIGH)
            notificationManager.createNotificationChannel(channel)
        }
        
        // Use intent that just launches app if tapped
        val intent = android.content.Intent(applicationContext, MainActivity::class.java).apply {
            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = android.app.PendingIntent.getActivity(applicationContext, 0, intent, android.app.PendingIntent.FLAG_IMMUTABLE)

        val builder = androidx.core.app.NotificationCompat.Builder(applicationContext, channelId)
            .setSmallIcon(R.drawable.ic_pencil)
            .setContentTitle("Magic Applied! ✨")
            .setContentText("Your lock screen has been updated.")
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }

    private fun applyWallpaper(base64Image: String): Boolean {
        return try {
            val cleanBase64 = if (base64Image.contains(",")) base64Image.split(",")[1] else base64Image
            val decodedString = Base64.decode(cleanBase64, Base64.DEFAULT)
            val doodleBitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size) ?: return false

            val metrics = applicationContext.resources.displayMetrics
            val screenWidth = metrics.widthPixels
            val screenHeight = metrics.heightPixels

            val wallpaperBitmap = Bitmap.createBitmap(screenWidth, screenHeight, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(wallpaperBitmap)

            // Sample color
            val sampleX = 5.coerceAtMost(doodleBitmap.width - 1)
            val sampleY = 5.coerceAtMost(doodleBitmap.height - 1)
            val pixelColor = doodleBitmap.getPixel(sampleX, sampleY)
            canvas.drawColor(pixelColor)

            // Draw center
            val left = (screenWidth - doodleBitmap.width) / 2f
            val top = (screenHeight - doodleBitmap.height) / 2f
            canvas.drawBitmap(doodleBitmap, left, top, null as Paint?)

            val wm = WallpaperManager.getInstance(applicationContext)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                wm.setBitmap(wallpaperBitmap, null as Rect?, true, WallpaperManager.FLAG_LOCK)
            } else {
                wm.setBitmap(wallpaperBitmap)
            }
            
            doodleBitmap.recycle()
            wallpaperBitmap.recycle()
            true
        } catch (e: Exception) {
            Log.e("WallpaperWorker", "Apply Wallpaper Error: ${e.message}")
            false
        }
    }
}
