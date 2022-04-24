package com.example.teledrive.ui.login

/**
 * PLACEHOLDER NOT ACTUAL IMPLEMENTATION OF LOGIN FOR TELEDRIVE
 * Authentication result : success (user details) or error message.
 */
data class LoginResult(
    val success: LoggedInUserView? = null,
    val error: Int? = null
)