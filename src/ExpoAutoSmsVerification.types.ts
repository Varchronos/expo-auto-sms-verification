export type SmsReceivedPayload = {
  /** The full text content of the intercepted SMS message */
  message: string;
};

export type SmsErrorPayload = {
  error: string;
};

export type ExpoAutoSmsVerificationModuleEvents = {
  /** Fired when a matching SMS is received. Parse the OTP out of `message`. */
  onSmsReceived: (params: SmsReceivedPayload) => void;
  /** Fired when no matching SMS arrived within the 5-minute window. */
  onSmsTimeout: (params: Record<string, never>) => void;
  /** Fired when the retriever encounters an error. */
  onSmsError: (params: SmsErrorPayload) => void;
};
