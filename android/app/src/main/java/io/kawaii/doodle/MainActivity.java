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

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
