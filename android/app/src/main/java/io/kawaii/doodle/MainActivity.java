package io.kawaii.doodle;

import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat;
import android.os.Bundle;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import android.util.Log;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WallpaperPlugin.class);
        super.onCreate(savedInstanceState);

        // FORCE WEBVIEW DEBUGGING
        android.webkit.WebView.setWebContentsDebuggingEnabled(true);

        // Manual Firebase Initialization
        // Bypass google-services.json processing issues
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseOptions options = new FirebaseOptions.Builder()
                        .setApplicationId("1:338129743756:android:8eabbade845ac4c68170a9")
                        .setApiKey("AIzaSyBdxffLUEnU_ENE7mJoC57cIjiP-C7QlW8")
                        .setProjectId("kawaii-doodle-97054")
                        .setStorageBucket("kawaii-doodle-97054.firebasestorage.app")
                        .setGcmSenderId("338129743756")
                        .build();
                FirebaseApp.initializeApp(this, options);
                Log.d("KawaiiFirebase", "Manually initialized FirebaseApp ✅");
            } else {
                Log.d("KawaiiFirebase", "FirebaseApp already initialized");
            }
        } catch (Exception e) {
            Log.e("KawaiiFirebase", "Manual Init Failed ❌", e);
        }

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
