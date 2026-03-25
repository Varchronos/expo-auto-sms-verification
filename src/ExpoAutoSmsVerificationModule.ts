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
   * DEBUG ONLY — fires onSmsReceived with a fake message body.
   * Use this to test OTP extraction and auto-fill without real SMS.
   * Remove before releasing to production.
   */
  simulateSms(message: string): void;
}

export default requireNativeModule<ExpoAutoSmsVerificationModule>('ExpoAutoSmsVerification');
