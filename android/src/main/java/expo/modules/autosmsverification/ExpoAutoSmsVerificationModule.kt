package expo.modules.autosmsverification

import android.content.Context
import android.content.IntentFilter
import android.os.Build
import androidx.core.content.ContextCompat
import com.google.android.gms.auth.api.phone.SmsRetriever
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

@Suppress("unused")
class ExpoAutoSmsVerificationModule : Module() {
    private var smsReceiver: SmsRetrieverBroadcastReceiver? = null
    private var registeredContext: Context? = null

    override fun definition() = ModuleDefinition {
        Name("ExpoAutoSmsVerification")

        Events("onSmsReceived", "onSmsTimeout", "onSmsError")

        // Starts the SMS Retriever API and registers a dynamic BroadcastReceiver.
        // The listener stays active for up to 5 minutes (Google's limit).
        AsyncFunction("startSmsRetriever") {
            val context = appContext.reactContext
                ?: throw Exception("React context not available")

            // Tear down any existing listener before starting a new one
            unregisterReceiver()

            // Kick off the retriever — Google Play Services starts listening for a matching SMS
            SmsRetriever.getClient(context).startSmsRetriever()

            registeredContext = context
            smsReceiver = SmsRetrieverBroadcastReceiver(
                onSmsReceived = { message ->
                    sendEvent("onSmsReceived", mapOf("message" to message))
                    unregisterReceiver() // auto-cleanup after first match
                },
                onTimeout = {
                    sendEvent("onSmsTimeout", emptyMap<String, Any>())
                    unregisterReceiver()
                },
                onError = { errorMessage ->
                    sendEvent("onSmsError", mapOf("error" to errorMessage))
                    unregisterReceiver()
                }
            )

            val filter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)

            // Android 13+ (Tiramisu) requires the exported/not-exported flag for dynamically registered receivers.
            // We use ContextCompat to handle this across different Android versions.
            ContextCompat.registerReceiver(
                context,
                smsReceiver,
                filter,
                SmsRetriever.SEND_PERMISSION,
                null,
                ContextCompat.RECEIVER_EXPORTED
            )
        }

        // DEBUG ONLY — fires onSmsReceived directly without real SMS.
        // Remove before releasing to production.
        Function("simulateSms") { message: String ->
            sendEvent("onSmsReceived", mapOf("message" to message))
        }

        // Manually stop listening before the 5-minute timeout
        AsyncFunction("stopSmsRetriever") {
            unregisterReceiver()
        }

        OnDestroy {
            unregisterReceiver()
        }
    }

    private fun unregisterReceiver() {
        val receiver = smsReceiver ?: return
        try {
            registeredContext?.unregisterReceiver(receiver)
        } catch (_: IllegalArgumentException) {
            // Receiver was never registered or already unregistered — safe to ignore
        }
        smsReceiver = null
        registeredContext = null
    }
}
