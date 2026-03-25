package expo.modules.autosmsverification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

class SmsRetrieverBroadcastReceiver(
    private val onSmsReceived: (message: String) -> Unit,
    private val onTimeout: () -> Unit,
    private val onError: (message: String) -> Unit
) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (SmsRetriever.SMS_RETRIEVED_ACTION != intent.action) return

        val extras = intent.extras ?: return
        val status = extras.get(SmsRetriever.EXTRA_STATUS) as? Status ?: return

        when (status.statusCode) {
            CommonStatusCodes.SUCCESS -> {
                val message = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE) ?: ""
                onSmsReceived(message)
            }
            CommonStatusCodes.TIMEOUT -> {
                onTimeout()
            }
            else -> {
                onError("SMS retrieval failed: ${status.statusMessage ?: status.statusCode}")
            }
        }
    }
}
