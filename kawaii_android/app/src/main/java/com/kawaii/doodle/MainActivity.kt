package com.kawaii.doodle

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import androidx.navigation.compose.rememberNavController
import com.kawaii.doodle.presentation.navigation.KawaiiNavGraph
import com.kawaii.doodle.presentation.navigation.Route
import com.kawaii.doodle.presentation.theme.KawaiiTheme
import com.kawaii.doodle.worker.CriticalHealthWorker
import com.kawaii.doodle.worker.DraftSyncWorker
import com.kawaii.doodle.worker.UpdateCheckWorker
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.delay

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        // Make the status bar and nav bar fully transparent —
        // Compose content will draw behind them.
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)

        // Kick off background workers
        UpdateCheckWorker.enqueue(this)
        CriticalHealthWorker.enqueue(this)
        DraftSyncWorker.enqueueWhenNetworkAvailable(this)

        setContent {
            val darkTheme = isSystemInDarkTheme()

            KawaiiTheme(darkTheme = darkTheme) {
                val navController = rememberNavController()

                // Sync status-bar icon brightness with current theme
                // (light icons for dark theme, dark icons for light theme)
                SideEffect {
                    WindowCompat.getInsetsController(window, window.decorView)
                        .isAppearanceLightStatusBars = !darkTheme
                    WindowCompat.getInsetsController(window, window.decorView)
                        .isAppearanceLightNavigationBars = !darkTheme
                }

                // Handle deep link from push notification
                val deepLinkAction = intent?.getStringExtra("deeplink_action")
                LaunchedEffect(deepLinkAction) {
                    if (deepLinkAction == "history") {
                        delay(500)
                        navController.navigate(Route.History.path)
                    }
                }

                KawaiiNavGraph(navController = navController)
            }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        intent.getStringExtra("deeplink_action")?.let { setIntent(intent) }
    }
}
