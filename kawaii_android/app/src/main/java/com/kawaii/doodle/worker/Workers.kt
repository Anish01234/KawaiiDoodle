package com.kawaii.doodle.worker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.app.NotificationCompat
import androidx.hilt.work.HiltWorker
import androidx.work.*
import com.kawaii.doodle.BuildConfig
import com.kawaii.doodle.data.remote.GithubApiService
import com.kawaii.doodle.data.remote.GithubRawService
import com.kawaii.doodle.domain.model.AppHealthStatus
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

/** Checks GitHub for a newer release. Shows a local notification if one exists. */
@HiltWorker
class UpdateCheckWorker @AssistedInject constructor(
    @Assisted ctx: Context,
    @Assisted params: WorkerParameters,
    private val githubApi: GithubApiService
) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        return try {
            val releaseResponse = githubApi.getLatestRelease()
            val release = releaseResponse.body() ?: throw Exception("Empty release body")
            val latestTag = release.tagName.trimStart('v')
            val currentVersion = BuildConfig.VERSION_NAME.trimStart('v')

            if (isNewerVersion(latestTag, currentVersion)) {
                showUpdateNotification(
                    latestTag = latestTag,
                    releaseUrl = release.htmlUrl
                )
            }
            Result.success()
        } catch (e: Exception) {
            // Non-critical, silently succeed
            Result.success()
        }
    }

    private fun isNewerVersion(latest: String, current: String): Boolean {
        return try {
            val l = latest.split(".").map { it.toInt() }
            val c = current.split(".").map { it.toInt() }
            for (i in 0 until maxOf(l.size, c.size)) {
                val lv = l.getOrElse(i) { 0 }
                val cv = c.getOrElse(i) { 0 }
                if (lv > cv) return true
                if (lv < cv) return false
            }
            false
        } catch (e: Exception) {
            false
        }
    }

    private fun showUpdateNotification(latestTag: String, releaseUrl: String) {
        val nm = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.createNotificationChannel(
            NotificationChannel("updates", "App Updates", NotificationManager.IMPORTANCE_DEFAULT)
        )
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(releaseUrl))
        val pi = android.app.PendingIntent.getActivity(
            applicationContext, 0, intent,
            android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT
        )
        val notif = NotificationCompat.Builder(applicationContext, "updates")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("✨ Kawaii Doodle v$latestTag is here!")
            .setContentText("Tap to download the latest version")
            .setContentIntent(pi)
            .setAutoCancel(true)
            .build()
        nm.notify(1001, notif)
    }

    companion object {
        fun enqueue(context: Context) {
            val req = OneTimeWorkRequestBuilder<UpdateCheckWorker>()
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                "update_check",
                ExistingWorkPolicy.REPLACE,
                req
            )
        }
    }
}

/** Checks status.json from GitHub to block critically broken versions. */
@HiltWorker
class CriticalHealthWorker @AssistedInject constructor(
    @Assisted ctx: Context,
    @Assisted params: WorkerParameters,
    private val githubRawApi: GithubRawService
) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        return try {
            val statusResponse = githubRawApi.getAppStatus()
            val status = statusResponse.body() ?: throw Exception("Empty status body")
            val current = BuildConfig.VERSION_NAME.trimStart('v')
            val blocked = status.brokenVersions?.contains(current) == true ||
                    (status.minSupportedVersion != null && compareVersions(current, status.minSupportedVersion) < 0)

            val outputData = workDataOf(
                "blocked" to blocked,
                "message" to (status.criticalMessage ?: ""),
                "url" to (status.forceUpdateUrl ?: "")
            )
            Result.success(outputData)
        } catch (e: Exception) {
            Result.success() // Don't block app if health check fails
        }
    }

    private fun compareVersions(a: String, b: String): Int {
        val av = a.split(".").map { it.toIntOrNull() ?: 0 }
        val bv = b.split(".").map { it.toIntOrNull() ?: 0 }
        for (i in 0 until maxOf(av.size, bv.size)) {
            val diff = (av.getOrElse(i) { 0 }) - (bv.getOrElse(i) { 0 })
            if (diff != 0) return diff
        }
        return 0
    }

    companion object {
        fun enqueue(context: Context): androidx.work.Operation {
            val req = OneTimeWorkRequestBuilder<CriticalHealthWorker>()
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            return WorkManager.getInstance(context).enqueueUniqueWork(
                "critical_health",
                ExistingWorkPolicy.REPLACE,
                req
            )
        }
    }
}

/** Syncs locally-pending drafts to Supabase when network is available. */
@HiltWorker
class DraftSyncWorker @AssistedInject constructor(
    @Assisted ctx: Context,
    @Assisted params: WorkerParameters,
    private val authRepo: com.kawaii.doodle.domain.repository.AuthRepository,
    private val draftRepo: com.kawaii.doodle.domain.repository.DraftRepository
) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        return try {
            val userId = authRepo.getCurrentUserId() ?: return Result.success()
            draftRepo.syncPendingDrafts(userId)
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    companion object {
        fun enqueueWhenNetworkAvailable(context: Context) {
            val req = OneTimeWorkRequestBuilder<DraftSyncWorker>()
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                "draft_sync",
                ExistingWorkPolicy.KEEP,
                req
            )
        }
    }
}
