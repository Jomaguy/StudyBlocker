package com.studyblocker.services

import android.app.*
import android.app.usage.UsageStatsManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.*
import androidx.core.app.NotificationCompat
import com.studyblocker.MainActivity
import org.json.JSONArray
import java.util.TreeMap

class MonitorService : Service() {

    companion object {
        private const val CHANNEL_ID = "StudyBlockerMonitor"
        private const val NOTIF_ID = 1001
        private const val POLL_MS = 1000L
    }

    private val handler = Handler(Looper.getMainLooper())
    private val blockedPackages = mutableSetOf<String>()
    private val grantExpiry = mutableMapOf<String, Long>()
    private var lastForegroundPkg = ""

    private val updateReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
            when (intent.action) {
                "com.studyblocker.UPDATE_BLOCKED_APPS" ->
                    parseBlocked(intent.getStringExtra("blockedAppsJson"))
                "com.studyblocker.GRANT_ACCESS" -> {
                    val pkg = intent.getStringExtra("packageName") ?: return
                    val exp = intent.getLongExtra("expiresAt", 0L)
                    grantExpiry[pkg] = exp
                }
            }
        }
    }

    private val pollTask = object : Runnable {
        override fun run() {
            checkForeground()
            handler.postDelayed(this, POLL_MS)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createChannel()
        startForeground(NOTIF_ID, buildNotification())

        parseBlocked(intent?.getStringExtra("blockedAppsJson"))

        val filter = IntentFilter().apply {
            addAction("com.studyblocker.UPDATE_BLOCKED_APPS")
            addAction("com.studyblocker.GRANT_ACCESS")
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(updateReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(updateReceiver, filter)
        }

        handler.post(pollTask)
        return START_STICKY
    }

    private fun checkForeground() {
        val usm = getSystemService(USAGE_STATS_SERVICE) as? UsageStatsManager ?: return
        val now = System.currentTimeMillis()
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 5000, now)
        if (stats.isNullOrEmpty()) return

        val sorted = TreeMap<Long, android.app.usage.UsageStats>()
        for (s in stats) sorted[s.lastTimeUsed] = s
        val fg = sorted[sorted.lastKey()]?.packageName ?: return

        if (fg == lastForegroundPkg) return
        lastForegroundPkg = fg

        if (!blockedPackages.contains(fg)) return

        // Check if access is still granted
        val exp = grantExpiry[fg]
        if (exp != null && exp > now) return
        grantExpiry.remove(fg)

        // Show quiz
        val qi = Intent(this, QuizLauncherActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra("blockedPackageName", fg)
            putExtra("blockedAppName", getAppName(fg))
        }
        startActivity(qi)
    }

    private fun getAppName(packageName: String): String =
        try { packageManager.getApplicationLabel(packageManager.getApplicationInfo(packageName, 0)).toString() }
        catch (_: Exception) { packageName }

    private fun parseBlocked(json: String?) {
        blockedPackages.clear()
        json ?: return
        try {
            val arr = JSONArray(json)
            repeat(arr.length()) { blockedPackages.add(arr.getString(it)) }
        } catch (_: Exception) {}
    }

    override fun onDestroy() {
        handler.removeCallbacks(pollTask)
        try { unregisterReceiver(updateReceiver) } catch (_: Exception) {}
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(CHANNEL_ID, "StudyBlocker Monitor", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Keeps StudyBlocker running in the background"
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
        }
    }

    private fun buildNotification(): Notification {
        val pi = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("StudyBlocker Active")
            .setContentText("Monitoring blocked apps")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pi)
            .setOngoing(true)
            .build()
    }
}
