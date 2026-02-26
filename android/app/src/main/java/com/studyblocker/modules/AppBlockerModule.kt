package com.studyblocker.modules

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import com.studyblocker.services.MonitorService
import java.util.TreeMap

class AppBlockerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppBlockerModule"

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val result = Arguments.createArray()
            for (app in apps) {
                val map = Arguments.createMap()
                map.putString("packageName", app.packageName)
                map.putString("appName", pm.getApplicationLabel(app).toString())
                map.putBoolean("isSystemApp", (app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0)
                result.pushMap(map)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_APPS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    reactContext.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    reactContext.packageName
                )
            }
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestUsageStatsPermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        promise.resolve(Settings.canDrawOverlays(reactContext))
    }

    @ReactMethod
    fun requestOverlayPermission() {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${reactContext.packageName}")
        ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun startMonitorService(blockedAppsJson: String) {
        val ctx = reactContext
        val intent = Intent(ctx, MonitorService::class.java).apply {
            putExtra("blockedAppsJson", blockedAppsJson)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(intent)
        } else {
            ctx.startService(intent)
        }
    }

    @ReactMethod
    fun stopMonitorService() {
        reactContext.stopService(Intent(reactContext, MonitorService::class.java))
    }

    @ReactMethod
    fun updateBlockedApps(blockedAppsJson: String) {
        val intent = Intent("com.studyblocker.UPDATE_BLOCKED_APPS").apply {
            putExtra("blockedAppsJson", blockedAppsJson)
        }
        reactContext.sendBroadcast(intent)
    }

    @ReactMethod
    fun grantAppAccess(packageName: String, expiresAt: Double) {
        val intent = Intent("com.studyblocker.GRANT_ACCESS").apply {
            putExtra("packageName", packageName)
            putExtra("expiresAt", expiresAt.toLong())
        }
        reactContext.sendBroadcast(intent)
    }

    @ReactMethod
    fun getCurrentForegroundApp(promise: Promise) {
        try {
            val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val now = System.currentTimeMillis()
            val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 5000, now)
            if (stats.isNullOrEmpty()) { promise.resolve(null); return }
            val sorted = TreeMap<Long, android.app.usage.UsageStats>()
            for (s in stats) sorted[s.lastTimeUsed] = s
            promise.resolve(sorted[sorted.lastKey()]?.packageName)
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }
}
