# Add project specific ProGuard rules here.
-keep class com.kawaii.doodle.data.remote.dto.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
