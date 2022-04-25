package com.example.teledrive




import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.view.View.OnLongClickListener
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.telegram.passport.PassportScope

import org.telegram.passport.TelegramPassport
import java.util.UUID


class TdriveLoginFragment : AppCompatActivity() {
    private val payload: String = UUID.randomUUID().toString()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.tdrivelogin)
        val button: Button = findViewById(R.id.telegram)
        button.setOnLongClickListener(loginLongClickListener)
        button.setOnClickListener {
            println(payload)
            val req = TelegramPassport.AuthRequest()
            req.botID = 1549037203
            req.nonce = payload
            req.publicKey = "-----BEGIN PUBLIC KEY-----\n" +
                    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0oM0cQphLzDEHuShhvbT\n" +
                    "/OfqEyflDs5+Wn6kfg3ay6KIo85B5ScAFyECrIBK/A98AJ/3BxIDoVkUaXGUldB0\n" +
                    "zTkOUQIIYZSP3cTdu75O0Nd6svSNVP56t+Ii3RSv4M6MLOPF0J3S5WFbb22DG2VV\n" +
                    "ndLMfQlp/wxMtPXVM2KPWxOwx1PfY+E+f9U0GLo7BOWD7Aj4h/AHF3JsINBgLFyz\n" +
                    "3BQf2a4p1sl+tIX9ke3BVLFLmuQNL2WJNpQajbb+Oz18y4VmJOc9uncQDe/22dWo\n" +
                    "83Qcsvw2zqF92awaVRSEHMMOW98SOazO9Bz5UYs8wJ2OPm/z4ZiSlsXk7Z6D8n82\n" +
                    "7QIDAQAB\n" +
                    "-----END PUBLIC KEY-----"
            req.scope = PassportScope(
                // PassportScopeElementOneOfSeveral(PassportScope.PASSPORT, PassportScope.IDENTITY_CARD).withSelfie(),
                // PassportScopeElementOne(PassportScope.PERSONAL_DETAILS).withNativeNames(),
                // PassportScope.DRIVER_LICENSE,
                // PassportScope.ADDRESS,
                // PassportScope.ADDRESS_DOCUMENT,
                PassportScope.PERSONAL_DETAILS,
                PassportScope.PASSPORT,
                // PassportScope.IDENTITY_CARD,
                PassportScope.PHONE_NUMBER,
                PassportScope.EMAIL,
                // PassportScope.TEMPORARY_REGISTRATION,
                // PassportScope.PASSPORT_REGISTRATION,
                // PassportScope.RENTAL_AGREEMENT,
                // PassportScope.BANK_STATEMENT,
                // PassportScope.UTILITY_BILL,
                // PassportScope.ADDRESS,
                // PassportScope.INTERNAL_PASSPORT
            )
            val tgPassportResult = 352 // this can be any integer less than 0xFFFF
            TelegramPassport.request(this@TdriveLoginFragment, req, tgPassportResult)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putSerializable("payload", payload)
    }

    private val loginLongClickListener = OnLongClickListener {
        TelegramPassport.showAppInstallAlert(this@TdriveLoginFragment)
        true
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 352) {
            if (resultCode == RESULT_OK) {
                Toast.makeText(this, R.string.login_successful, Toast.LENGTH_SHORT).show()
            } else if (resultCode == TelegramPassport.RESULT_ERROR) {
                if (data != null) {
                    AlertDialog.Builder(this)
                        .setTitle(R.string.error)
                        .setMessage(data.getStringExtra("error"))
                        .setPositiveButton(R.string.ok, null)
                        .show()
                }
            } else {
                Toast.makeText(this, R.string.login_canceled, Toast.LENGTH_SHORT).show()
            }
        }
    }

}