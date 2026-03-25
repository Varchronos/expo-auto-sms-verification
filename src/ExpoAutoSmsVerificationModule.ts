import { NativeModule, requireNativeModule } from 'expo';

import { ExpoAutoSmsVerificationModuleEvents } from './ExpoAutoSmsVerification.types';

declare class ExpoAutoSmsVerificationModule extends NativeModule<ExpoAutoSmsVerificationModuleEvents> {
  /**
   * Starts the Android SMS Retriever API and registers a BroadcastReceiver.
   * The listener stays active for up to 5 minutes.
   * Fires `onSmsReceived`, `onSmsTimeout`, or `onSmsError` events.
   */
  startSmsRetriever(): Promise<void>;

  /**
   * Manually stops the SMS Retriever before the 5-minute timeout.
   */
  stopSmsRetriever(): Promise<void>;

  /**
   * Returns the 11-character hash strings for all of the app's signing certificates.
   *
   * Send **all** returned hashes to your backend and include each one on its own line
   * at the end of the SMS. Google Play can rotate or add signing certificates across
   * app updates, and you cannot predict which certificate will be active on a given
   * user's device. Including all hashes ensures the SMS Retriever matches regardless
   * of which certificate is currently in use.
   *
   * SMS format:
   * ```
   * <your message>
   *
   * <hash1>
   * <hash2>
   * ```
   *
   * @returns Array of 11-character hash strings derived from the package name
   * and each signing certificate.
   *
   * @example
   * const hashes = ExpoAutoSmsVerification.getMessageHash();
   * // Send hashes to your backend, which appends them to the SMS:
   * // "Your code is 123456\n\nDupZx+hcHZP\nFA+9qCX9VSu"
   */
  getMessageHash(): Promise<string[]>
}

export default requireNativeModule<ExpoAutoSmsVerificationModule>('ExpoAutoSmsVerification');
