package io.kawaii.doodle;

import android.app.Application;
import android.util.Log;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // ── STEP 1: Install global crash handlers FIRST ──────────────────────
        // This must be the very first thing called so that any subsequent
        // crash (Firebase init, plugin load, background thread) is captured.
        GlobalCrashHandler.INSTANCE.install();
        // ────────────────────────────────────────────────────────────────────

        // Manual Firebase Initialization
        // Ensure Firebase is ready for background services and plugins
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
                Log.d("KawaiiFirebase", "Manually initialized FirebaseApp in Application class ✅");
            } else {
                Log.d("KawaiiFirebase", "FirebaseApp already initialized");
            }
        } catch (Exception e) {
            Log.e("KawaiiFirebase", "Manual Init Failed ❌", e);
        }
    }
}
