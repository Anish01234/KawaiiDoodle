package io.kawaii.doodle

import android.app.WallpaperManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.os.Build
import android.os.PowerManager
import android.util.Base64
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.util.Scanner
import android.content.Context
import io.kawaii.doodle.MainActivity

import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import androidx.work.workDataOf

class FCMService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // We DON'T call super.onMessageReceived to avoid Capacitor plugin intercepting it
        
        Log.d("FCMService", "Message Received: ${remoteMessage.data}")

        val type = remoteMessage.data["type"]
        val doodleId = remoteMessage.data["doodle_id"]
        val title = remoteMessage.data["title"] ?: "New Magic! ✨"
        val body = remoteMessage.data["body"] ?: "You received a doodle!"

        if (type == "doodle" && !doodleId.isNullOrEmpty()) {
            Log.d("FCMService", "Doodle detected! Scheduling WorkManager job... ✨")
            
            // 1. Show manual notification immediately so user knows something arrived
            showManualNotification(title, body)

            // 2. Schedule Worker to handle the heavy lifting
            scheduleWallpaperUpdate(doodleId)
        }
    }

    private fun scheduleWallpaperUpdate(doodleId: String) {
        val workData = workDataOf("doodle_id" to doodleId)
        
        val workRequest = OneTimeWorkRequest.Builder(WallpaperWorker::class.java)
            .setInputData(workData)
            .addTag("doodle_update")
            .build()

        WorkManager.getInstance(applicationContext).enqueue(workRequest)
    }

    private fun showManualNotification(title: String, body: String) {
        val channelId = "PushNotifications"
        val notificationManager = getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager

        // Create Channel for Android O+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel(channelId, "Doodle Alerts", android.app.NotificationManager.IMPORTANCE_HIGH)
            notificationManager.createNotificationChannel(channel)
        }

        // Build Notification
        val intent = android.content.Intent(this, MainActivity::class.java).apply {
            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = android.app.PendingIntent.getActivity(this, 0, intent, android.app.PendingIntent.FLAG_IMMUTABLE)

        val builder = androidx.core.app.NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_pencil) // Custom pencil icon
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }
}
