package com.studyblocker.services

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.studyblocker.MainActivity
import java.net.URLEncoder

/**
 * Thin activity that redirects to the React Native QuizOverlay screen via deep link.
 * Launched by MonitorService when a blocked app is detected in the foreground.
 */
class QuizLauncherActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val blockedPkg = intent?.getStringExtra("blockedPackageName") ?: ""
        val blockedName = intent?.getStringExtra("blockedAppName") ?: "App"

        val encodedName = URLEncoder.encode(blockedName, "UTF-8")
        val deepLink = "studyblocker://quiz?blockedAppPackage=$blockedPkg&blockedAppName=$encodedName"

        val rnIntent = Intent(this, MainActivity::class.java).apply {
            data = Uri.parse(deepLink)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        }
        startActivity(rnIntent)
        finish()
    }
}
