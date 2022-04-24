package com.example.teledrive.ui.login

/**
 * PLACEHOLDER NOT ACTUAL IMPLEMENTATION OF LOGIN FOR TELEDRIVE
 * Data validation state of the login form.
 */
data class LoginFormState(
    val usernameError: Int? = null,
    val passwordError: Int? = null,
    val isDataValid: Boolean = false
)