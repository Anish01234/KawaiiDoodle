package com.kawaii.doodle.presentation.ui.shared

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64

// ─── Base64 to Bitmap Utility ──────────────────────────────────────────────

fun convertBase64ToBitmap(base64Str: String): Bitmap? {
    return try {
        val cleanString = if (base64Str.startsWith("data:image")) {
            base64Str.substringAfter(",")
        } else {
            base64Str
        }
        val bytes = Base64.decode(cleanString, Base64.DEFAULT)
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    } catch (e: Exception) {
        null
    }
}
