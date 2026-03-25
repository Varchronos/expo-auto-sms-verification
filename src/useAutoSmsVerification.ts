import { useEffect, useRef, useState } from 'react';

import ExpoAutoSmsVerificationModule from './ExpoAutoSmsVerificationModule';

export type SmsVerificationStatus = 'idle' | 'listening' | 'received' | 'timeout' | 'error';

export type UseAutoSmsVerificationOptions = {
  /**
   * Regex used to extract the OTP from the SMS message body.
   * Must include a capture group for the code.
   * Defaults to a 4–8 digit sequence: /(\d{4,8})/
   */
  otpPattern?: RegExp;
  /**
   * Called as soon as an OTP is extracted from the incoming SMS.
   */
  onOtpReceived?: (otp: string) => void;
};

export type UseAutoSmsVerificationResult = {
  /** Call this to start the Android SMS Retriever listener */
  startListening: () => Promise<void>;
  /** Call this to manually stop listening */
  stopListening: () => Promise<void>;
  /** The extracted OTP string, or null if not yet received */
  otp: string | null;
  /** Current state of the retriever */
  status: SmsVerificationStatus;
  /** Error message if status === 'error' */
  error: string | null;
};

const DEFAULT_OTP_PATTERN = /(\d{4,8})/;

export function useAutoSmsVerification(
  options: UseAutoSmsVerificationOptions = {}
): UseAutoSmsVerificationResult {
  const { otpPattern = DEFAULT_OTP_PATTERN, onOtpReceived } = options;

  const [otp, setOtp] = useState<string | null>(null);
  const [status, setStatus] = useState<SmsVerificationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Keep a stable ref to the callback so the effect doesn't re-run on every render
  const onOtpReceivedRef = useRef(onOtpReceived);
  useEffect(() => {
    onOtpReceivedRef.current = onOtpReceived;
  });

  useEffect(() => {
    const receivedSub = ExpoAutoSmsVerificationModule.addListener(
      'onSmsReceived',
      ({ message }) => {
        const match = message.match(otpPattern);
        const extracted = match?.[1] ?? null;
        setOtp(extracted);
        setStatus('received');
        if (extracted) {
          onOtpReceivedRef.current?.(extracted);
        }
      }
    );

    const timeoutSub = ExpoAutoSmsVerificationModule.addListener('onSmsTimeout', () => {
      setStatus('timeout');
    });

    const errorSub = ExpoAutoSmsVerificationModule.addListener('onSmsError', ({ error: msg }) => {
      setError(msg);
      setStatus('error');
    });

    return () => {
      receivedSub.remove();
      timeoutSub.remove();
      errorSub.remove();
    };
  }, [otpPattern]);

  const startListening = async () => {
    setOtp(null);
    setError(null);
    setStatus('listening');
    await ExpoAutoSmsVerificationModule.startSmsRetriever();
  };

  const stopListening = async () => {
    await ExpoAutoSmsVerificationModule.stopSmsRetriever();
    setStatus('idle');
  };

  return { startListening, stopListening, otp, status, error };
}
