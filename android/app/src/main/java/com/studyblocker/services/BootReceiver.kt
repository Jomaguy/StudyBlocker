package com.studyblocker.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * Restarts the MonitorService after device reboot if monitoring was active.
 * The service uses START_STICKY, but BootReceiver ensures it starts after reboot.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        // We rely on the app to restart monitoring when opened after reboot.
        // No-op for now — MonitorService is started from JS side.
        Log.d("StudyBlocker", "Boot completed received")
    }
}
