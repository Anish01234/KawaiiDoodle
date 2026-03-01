package com.kawaii.doodle.presentation.navigation

sealed class Route(val path: String) {
    object Landing : Route("landing")
    object Setup : Route("setup")
    object Home : Route("home")
    object Draw : Route("draw")
    object History : Route("history")
    object Friends : Route("friends")
    object Profile : Route("profile")
    object Blocked : Route("blocked/{message}/{url}") {
        fun createRoute(message: String, url: String) = "blocked/$message/$url"
    }
}
