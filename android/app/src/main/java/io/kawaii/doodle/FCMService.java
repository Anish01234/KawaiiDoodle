package io.kawaii.doodle;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.app.WallpaperManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Map;

public class FCMService extends FirebaseMessagingService {

    private static final String TAG = "KawaiiFCM";
    private static final String CHANNEL_ID = "doodle_data_channel_v1";
    private static final String CHANNEL_NAME = "Incoming Doodles";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Log.d(TAG, "From: " + remoteMessage.getFrom());

        // Check if message contains data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            Map<String, String> data = remoteMessage.getData();

            String imageData = data.get("image_data");
            String title = data.get("title");
            String body = data.get("body");

            // 1. Update Wallpaper (Background Work)
            if (imageData != null && !imageData.isEmpty()) {
                Log.d(TAG, "Found image_data, setting wallpaper...");
                setWallpaper(imageData);
            }

            // 2. Show Notification Manually (since backend sends data-only)
            if (title != null || body != null) {
                showNotification(title != null ? title : "New Magic! ✨",
                        body != null ? body : "You received a new doodle!");
            }
        }
    }

    private void showNotification(String title, String body) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // Create Channel (Required for Android O+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_MAX // Max importance for heads-up
            );
            channel.setDescription("Notifications for incoming doodles");
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            notificationManager.createNotificationChannel(channel);
        }

        // Intent to open app
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.setAction("history");

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

        // Icon Logic: Try ic_stat_icon -> ic_launcher -> system default
        int resourceId = getResources().getIdentifier("ic_stat_icon", "drawable", getPackageName());
        if (resourceId == 0) {
            resourceId = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        }
        if (resourceId == 0) {
            resourceId = android.R.drawable.sym_def_app_icon; // Safest fallback
        }

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(resourceId)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body)) // Ensure long text is shown
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_MAX) // Max priority for pre-O
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(pendingIntent);

        notificationManager.notify((int) System.currentTimeMillis(), notificationBuilder.build());
    }

    private void setWallpaper(String base64Image) {
        try {
            if (base64Image.contains(",")) {
                base64Image = base64Image.split(",")[1];
            }

            byte[] decodedString = Base64.decode(base64Image, Base64.DEFAULT);
            InputStream inputStream = new ByteArrayInputStream(decodedString);
            Bitmap bitmap = BitmapFactory.decodeStream(inputStream);

            if (bitmap != null) {
                WallpaperManager wallpaperManager = WallpaperManager.getInstance(getApplicationContext());
                wallpaperManager.setBitmap(bitmap, null, false, WallpaperManager.FLAG_LOCK);
                Log.d(TAG, "Lock screen wallpaper updated successfully!");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting wallpaper: " + e.getMessage());
        }
    }
}
