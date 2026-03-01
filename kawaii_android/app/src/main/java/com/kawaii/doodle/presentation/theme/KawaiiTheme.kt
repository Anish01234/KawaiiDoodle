package com.kawaii.doodle.presentation.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.googlefonts.Font
import androidx.compose.ui.text.googlefonts.GoogleFont
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ─── Google Fonts Provider ────────────────────────────────────────────────────

private val provider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage = "com.google.android.gms",
    certificates = com.kawaii.doodle.R.array.com_google_android_gms_fonts_certs
)

private val QuicksandFont = GoogleFont("Quicksand")
private val OutfitFont = GoogleFont("Outfit")

val QuicksandFamily = androidx.compose.ui.text.font.FontFamily(
    Font(googleFont = QuicksandFont, fontProvider = provider, weight = FontWeight.Normal),
    Font(googleFont = QuicksandFont, fontProvider = provider, weight = FontWeight.Medium),
    Font(googleFont = QuicksandFont, fontProvider = provider, weight = FontWeight.SemiBold),
    Font(googleFont = QuicksandFont, fontProvider = provider, weight = FontWeight.Bold),
)

val OutfitFamily = androidx.compose.ui.text.font.FontFamily(
    Font(googleFont = OutfitFont, fontProvider = provider, weight = FontWeight.Normal),
    Font(googleFont = OutfitFont, fontProvider = provider, weight = FontWeight.Medium),
    Font(googleFont = OutfitFont, fontProvider = provider, weight = FontWeight.Bold),
    Font(googleFont = OutfitFont, fontProvider = provider, weight = FontWeight.Black),
)

// ─── Typography ────────────────────────────────────────────────────────────────

val KawaiiTypography = Typography(
    displayLarge = TextStyle(fontFamily = OutfitFamily, fontWeight = FontWeight.Black, fontSize = 57.sp, lineHeight = 64.sp),
    displayMedium = TextStyle(fontFamily = OutfitFamily, fontWeight = FontWeight.Black, fontSize = 45.sp, lineHeight = 52.sp),
    displaySmall = TextStyle(fontFamily = OutfitFamily, fontWeight = FontWeight.Bold, fontSize = 36.sp, lineHeight = 44.sp),

    headlineLarge = TextStyle(fontFamily = OutfitFamily, fontWeight = FontWeight.Bold, fontSize = 32.sp, lineHeight = 40.sp),
    headlineMedium = TextStyle(fontFamily = OutfitFamily, fontWeight = FontWeight.Bold, fontSize = 28.sp, lineHeight = 36.sp),
    headlineSmall = TextStyle(fontFamily = OutfitFamily, fontWeight = FontWeight.Bold, fontSize = 24.sp, lineHeight = 32.sp),

    titleLarge = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.Bold, fontSize = 22.sp, lineHeight = 28.sp),
    titleMedium = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.15.sp),
    titleSmall = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),

    bodyLarge = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp),
    bodySmall = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp),

    labelLarge = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.Bold, fontSize = 14.sp, letterSpacing = 0.1.sp),
    labelMedium = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 0.5.sp),
    labelSmall = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.Bold, fontSize = 11.sp, letterSpacing = 0.5.sp),
)

// ─── Color Tokens ─────────────────────────────────────────────────────────────

// Light palette
val KawaiiPink = Color(0xFFE91E8C)
val KawaiiRose = Color(0xFFFF4081)
val KawaiiLightPink = Color(0xFFFFD6E8)
val KawaiiPinkBg = Color(0xFFFFF0F7)
val KawaiiBlue = Color(0xFF5B9BD5)
val KawaiiPurple = Color(0xFF9C7EEA)
val KawaiiYellow = Color(0xFFFFD54F)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFFB5004F),            // Deeper rose for better contrast
    onPrimary = Color.White,
    primaryContainer = Color(0xFFFFD9E3),
    onPrimaryContainer = Color(0xFF3E0021),
    secondary = Color(0xFF6B548E),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFEEDBFF),
    onSecondaryContainer = Color(0xFF260E47),
    tertiary = Color(0xFF415E96),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFDAE2FF),
    onTertiaryContainer = Color(0xFF001648),
    error = Color(0xFFBA1A1A),
    onError = Color.White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    background = Color(0xFFFFF8F9),
    onBackground = Color(0xFF22191C),
    surface = Color(0xFFFFF8F9),
    onSurface = Color(0xFF22191C),
    surfaceVariant = Color(0xFFF3DEE5),
    onSurfaceVariant = Color(0xFF514349),
    outline = Color(0xFF847379),
    outlineVariant = Color(0xFFD5C3C9),
    inverseSurface = Color(0xFF382830),
    inverseOnSurface = Color(0xFFFFECF0),
    inversePrimary = Color(0xFFFFB2C8),
    surfaceTint = Color(0xFFB5004F),
    scrim = Color.Black
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFFFB2C8),
    onPrimary = Color(0xFF66003B),
    primaryContainer = Color(0xFF8E0045),
    onPrimaryContainer = Color(0xFFFFD9E3),
    secondary = Color(0xFFD5BAFF),
    onSecondary = Color(0xFF3B1F5D),
    secondaryContainer = Color(0xFF523C75),
    onSecondaryContainer = Color(0xFFEEDBFF),
    tertiary = Color(0xFFB2C5FF),
    onTertiary = Color(0xFF0D2E6A),
    tertiaryContainer = Color(0xFF284580),
    onTertiaryContainer = Color(0xFFDAE2FF),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    background = Color(0xFF191114),
    onBackground = Color(0xFFEFDFE4),
    surface = Color(0xFF191114),
    onSurface = Color(0xFFEFDFE4),
    surfaceVariant = Color(0xFF514349),
    onSurfaceVariant = Color(0xFFD5C3C9),
    outline = Color(0xFF9E8D93),
    outlineVariant = Color(0xFF514349),
    inverseSurface = Color(0xFFEFDFE4),
    inverseOnSurface = Color(0xFF382830),
    inversePrimary = Color(0xFFB5004F),
    surfaceTint = Color(0xFFFFB2C8),
    scrim = Color.Black
)

// ─── Shapes ───────────────────────────────────────────────────────────────────

val KawaiiShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = RoundedCornerShape(40.dp)
)

// ─── Theme Composable ─────────────────────────────────────────────────────────

@Composable
fun KawaiiTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,       // Material You on Android 12+
    content: @Composable () -> Unit
) {
    val context = LocalContext.current

    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = KawaiiTypography,
        shapes = KawaiiShapes,
        content = content
    )
}
