package com.kawaii.doodle.presentation.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.kawaii.doodle.presentation.ui.auth.AuthViewModel
import com.kawaii.doodle.presentation.ui.draw.DrawScreen
import com.kawaii.doodle.presentation.ui.friends.FriendsScreen
import com.kawaii.doodle.presentation.ui.history.HistoryScreen
import com.kawaii.doodle.presentation.ui.home.HomeScreen
import com.kawaii.doodle.presentation.ui.landing.LandingScreen
import com.kawaii.doodle.presentation.ui.profile.ProfileScreen
import com.kawaii.doodle.presentation.ui.setup.SetupScreen

private const val ANIM_DURATION = 350

/** Slide in from right, slide out to the left (forward). */
private fun enterTransition() = slideInHorizontally(
    initialOffsetX = { it },
    animationSpec = tween(ANIM_DURATION)
) + fadeIn(tween(ANIM_DURATION))

/** Slide out to the left (forward). */
private fun exitTransition() = slideOutHorizontally(
    targetOffsetX = { -it / 4 },
    animationSpec = tween(ANIM_DURATION)
) + fadeOut(tween(ANIM_DURATION / 2))

/** Slide in from left (back). */
private fun popEnterTransition() = slideInHorizontally(
    initialOffsetX = { -it / 4 },
    animationSpec = tween(ANIM_DURATION)
) + fadeIn(tween(ANIM_DURATION))

/** Slide out to the right (back). */
private fun popExitTransition() = slideOutHorizontally(
    targetOffsetX = { it },
    animationSpec = tween(ANIM_DURATION)
) + fadeOut(tween(ANIM_DURATION / 2))

/** Vertical slide-up (used for auth → main app transitions). */
private fun upEnterTransition() = slideInVertically(
    initialOffsetY = { it },
    animationSpec = tween(ANIM_DURATION)
) + fadeIn(tween(ANIM_DURATION))

private fun downExitTransition() = slideOutVertically(
    targetOffsetY = { it },
    animationSpec = tween(ANIM_DURATION)
) + fadeOut(tween(ANIM_DURATION / 2))

@Composable
fun KawaiiNavGraph(navController: NavHostController) {
    val authViewModel: AuthViewModel = hiltViewModel()
    val startDestination by authViewModel.startDestination.collectAsState()

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = Modifier.fillMaxSize(),
        enterTransition = { enterTransition() },
        exitTransition = { exitTransition() },
        popEnterTransition = { popEnterTransition() },
        popExitTransition = { popExitTransition() }
    ) {

        // ── Auth flow ─────────────────────────────────────────────────────
        composable(
            route = Route.Landing.path,
            enterTransition = { fadeIn(tween(ANIM_DURATION)) },
            exitTransition = { fadeOut(tween(ANIM_DURATION)) }
        ) {
            LandingScreen(
                onSignInSuccess = {
                    navController.navigate(Route.Home.path) {
                        popUpTo(Route.Landing.path) { inclusive = true }
                    }
                },
                onNeedsSetup = {
                    navController.navigate(Route.Setup.path) {
                        popUpTo(Route.Landing.path) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Route.Setup.path,
            enterTransition = { upEnterTransition() },
            exitTransition = { downExitTransition() }
        ) {
            SetupScreen(onSetupComplete = {
                navController.navigate(Route.Home.path) {
                    popUpTo(Route.Setup.path) { inclusive = true }
                }
            })
        }

        // ── Main screens (bottom-nav aware via MainShell) ─────────────────
        composable(
            route = Route.Home.path,
            enterTransition = { fadeIn(tween(ANIM_DURATION / 2)) },
            exitTransition = { fadeOut(tween(ANIM_DURATION / 2)) }
        ) {
            HomeScreen(
                onNavigateToDraw = { navController.navigate(Route.Draw.path) },
                onNavigateToHistory = { navController.navigate(Route.History.path) },
                onNavigateToFriends = { navController.navigate(Route.Friends.path) },
                onNavigateToProfile = { navController.navigate(Route.Profile.path) }
            )
        }

        composable(
            route = Route.Draw.path,
            enterTransition = { upEnterTransition() },
            popExitTransition = { downExitTransition() }
        ) {
            DrawScreen(
                onNavigateBack = { navController.popBackStack() },
                onSentSuccessfully = {
                    navController.navigate(Route.Home.path) {
                        popUpTo(Route.Draw.path) { inclusive = true }
                    }
                }
            )
        }

        composable(route = Route.History.path) {
            HistoryScreen(
                onNavigateBack = { navController.popBackStack() },
                onEditDoodle = { imageData ->
                    navController.currentBackStackEntry?.savedStateHandle?.set("pendingDoodle", imageData)
                    navController.navigate(Route.Draw.path)
                }
            )
        }

        composable(route = Route.Friends.path) {
            FriendsScreen(onNavigateBack = { navController.popBackStack() })
        }

        composable(route = Route.Profile.path) {
            ProfileScreen(
                onNavigateBack = { navController.popBackStack() },
                onSignedOut = {
                    navController.navigate(Route.Landing.path) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
