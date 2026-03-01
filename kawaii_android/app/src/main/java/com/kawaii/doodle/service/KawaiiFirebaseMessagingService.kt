package com.kawaii.doodle.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.kawaii.doodle.MainActivity
import com.kawaii.doodle.domain.repository.AuthRepository
import com.kawaii.doodle.domain.repository.ProfileRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class KawaiiFirebaseMessagingService : FirebaseMessagingService() {

    @Inject lateinit var authRepo: AuthRepository
    @Inject lateinit var profileRepo: ProfileRepository

    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        scope.launch {
            val userId = authRepo.getCurrentUserId() ?: return@launch
            profileRepo.updateFcmToken(userId, token)
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val title = message.notification?.title ?: message.data["title"] ?: "Kawaii Doodle ✨"
        val body = message.notification?.body ?: message.data["body"] ?: "You have a new doodle!"
        val action = message.data["action"] ?: "history"

        showNotification(title, body, action)
    }

    private fun showNotification(title: String, body: String, action: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.createNotificationChannel(
            NotificationChannel("doodles", "New Doodles", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Notifications for new doodles"
            }
        )

        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("deeplink_action", action)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pi = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notif = NotificationCompat.Builder(this, "doodles")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(pi)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        nm.notify(System.currentTimeMillis().toInt(), notif)
    }
}
