package io.kawaii.doodle;

import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat;

import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WallpaperPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
