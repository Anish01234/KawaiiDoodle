package io.kawaii.doodle;

import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat;


public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
