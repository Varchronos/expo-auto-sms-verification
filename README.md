# expo-auto-sms-verification

[![npm version](https://img.shields.io/npm/v/expo-auto-sms-verification)](https://www.npmjs.com/package/expo-auto-sms-verification)
[![license](https://img.shields.io/npm/l/expo-auto-sms-verification)](https://github.com/Varchronos/expo-auto-sms-verification/blob/main/LICENSE)
[![platform - android](https://img.shields.io/badge/platform-Android-3ddc84?logo=android&logoColor=white)](https://developer.android.com/)
[![runs with expo](https://img.shields.io/badge/Runs%20with%20Expo-4630EB?logo=expo&logoColor=white)](https://expo.dev/)
[![npm downloads](https://img.shields.io/npm/dm/expo-auto-sms-verification)](https://www.npmjs.com/package/expo-auto-sms-verification)
[![GitHub stars](https://img.shields.io/github/stars/Varchronos/expo-auto-sms-verification?style=social)](https://github.com/Varchronos/expo-auto-sms-verification)

An Expo module for Android SMS Retriever API that automatically intercepts OTP SMS messages **without requiring SMS read permissions**.

Uses [Google's SMS Retriever API](https://developers.google.com/identity/sms-retriever/overview) under the hood, so your app never needs the `READ_SMS` permission.

> **Platform support:** Android only. iOS does not have an equivalent API. All the methods throw an `UnavailabilityError` on iOS.

> **Expo Go:** This module includes native code and **does not work in Expo Go**. You must use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (`npx expo run:android`) or an [EAS build](https://docs.expo.dev/build/introduction/).

## Why Use This?

- **No permissions required**: Unlike traditional SMS reading, the SMS Retriever API works without `READ_SMS` or any runtime permission. No permission dialogs, no Play Store warnings.
- **Won't get your app rejected on Google Play**: Google treats `READ_SMS` and `RECEIVE_SMS` as [restricted permissions](https://support.google.com/googleplay/android-developer/answer/9047303). Apps that declare them must submit a **Permissions Declaration Form** and demonstrate that SMS access is core to the app's functionality — most OTP use cases **do not qualify**. Apps that fail this review get rejected or removed from the Play Store. This module avoids the problem entirely by using the SMS Retriever API, which is Google's recommended approach for OTP verification and requires **zero** dangerous permissions.
- **Ready-to-use React hook**: `useAutoSmsVerification` handles the entire OTP flow out of the box: listening, extraction, state management, and cleanup. Drop it into your component and you're done.
- **Seamless user experience**: OTPs are intercepted and filled automatically without the user having to switch apps or manually copy codes (well this is kind of obvious).

## Table of Contents

- [Why Use This?](#why-use-this)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [SMS Message Format](#sms-message-format)
  - [Getting Your App Hash](#getting-your-app-hash)
- [API Reference](#api-reference)
  - [useAutoSmsVerification](#useautosmsverificationoptions)
  - [Native Module Methods](#native-module-methods)
  - [Events](#events)
  - [Types](#types)
- [Example](#example)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install expo-auto-sms-verification
```

No additional native configuration is required. The module uses [Google Play Services](https://developers.google.com/android/guides/overview) (`play-services-auth` and `play-services-auth-api-phone`), which are bundled automatically.

## Quick Start

```tsx
import { useAutoSmsVerification } from 'expo-auto-sms-verification';

function OtpScreen() {
  const { otp, status, error, startListening, stopListening } =
    useAutoSmsVerification({
      otpPattern: /(\d{6})/,           // match a 6-digit OTP
      onOtpReceived: (code) => {
        console.log('OTP received:', code);
        // submit OTP to your backend
      },
    });

  return (
    <View>
      <Text>Status: {status}</Text>
      <Text>OTP: {otp ?? '—'}</Text>
      <Button title="Start Listening" onPress={startListening} />
      <Button title="Stop" onPress={stopListening} />
    </View>
  );
}
```

## How It Works

1. Your app calls `startSmsRetriever()` (or the hook's `startListening()`).
2. Google Play Services begins listening for an incoming SMS that contains your app's **message hash**.
3. When a matching SMS arrives, the module fires an `onSmsReceived` event with the full message text.
4. The `useAutoSmsVerification` hook extracts the OTP using the regex pattern you provide.
5. The listener automatically stops after receiving an SMS or after a **5-minute timeout** (Google's limit).

**No SMS permission is needed**, the SMS Retriever API delegates interception to Google Play Services.

## SMS Message Format

For the SMS Retriever API to recognize your message, the SMS sent from your backend **must** follow this format:

```
Your verification code is 123456.

FA+9qCX9VSu
```

Requirements:
- The message must be **no longer than 140 bytes**
- It must end with an **11-character hash** that identifies your app
- The hash is derived from your app's package name and signing certificate
- More about verification message conventions [here](https://developers.google.com/identity/sms-retriever/verify).

### Getting Your App Hash

Call `getMessageHash()` to retrieve the hash(es) for your app:

```tsx
import ExpoAutoSmsVerification from 'expo-auto-sms-verification';

const hashes = await ExpoAutoSmsVerification.getMessageHash();
console.log(hashes); // e.g. ['FA+9qCX9VSu']
```

- Returns an array because your app may have multiple signing certificates (e.g. during [Google Play certificate rotation](https://developer.android.com/studio/publish/app-signing#certificate-rotation))
- **Send all hashes to your backend** and append them to outgoing SMS messages
- The hash will differ between debug and release builds (different signing keys)

## API Reference

### `useAutoSmsVerification(options?)`

React hook that manages the full SMS verification lifecycle.

**Options:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `otpPattern` | `RegExp` | `/(\d{4,8})/` | Regex with a capture group to extract the OTP from the SMS |
| `onOtpReceived` | `(otp: string) => void` | — | Callback fired immediately when an OTP is extracted |

**Returns:**

| Property | Type | Description |
|---|---|---|
| `startListening` | `() => Promise<void>` | Start the SMS retriever |
| `stopListening` | `() => Promise<void>` | Stop the SMS retriever early |
| `otp` | `string \| null` | The extracted OTP, or `null` |
| `status` | `SmsVerificationStatus` | One of: `'idle'`, `'listening'`, `'received'`, `'timeout'`, `'error'` |
| `error` | `string \| null` | Error message, if any |

### Native Module Methods

Available via the default export:

```tsx
import ExpoAutoSmsVerification from 'expo-auto-sms-verification';
```

#### `startSmsRetriever(): Promise<void>`

Starts the SMS Retriever listener. Registers a `BroadcastReceiver` that listens for up to 5 minutes.

#### `stopSmsRetriever(): Promise<void>`

Stops the listener and unregisters the `BroadcastReceiver`.

#### `getMessageHash(): Promise<string[]>`

Returns the 11-character hash string(s) for your app's signing certificate(s). Pass these to your backend to include in SMS messages.

### Events

If using the native module directly (without the hook), you can subscribe to events:

```tsx
import ExpoAutoSmsVerification from 'expo-auto-sms-verification';

const sub1 = ExpoAutoSmsVerification.addListener('onSmsReceived', ({ message }) => {
  console.log('SMS:', message);
});

const sub2 = ExpoAutoSmsVerification.addListener('onSmsTimeout', () => {
  console.log('Timed out after 5 minutes');
});

const sub3 = ExpoAutoSmsVerification.addListener('onSmsError', ({ error }) => {
  console.error('Error:', error);
});

// Clean up
sub1.remove();
sub2.remove();
sub3.remove();
```

### Types

```typescript
type SmsReceivedPayload = {
  message: string;
};

type SmsErrorPayload = {
  error: string;
};

type SmsVerificationStatus = 'idle' | 'listening' | 'received' | 'timeout' | 'error';

type UseAutoSmsVerificationOptions = {
  otpPattern?: RegExp;
  onOtpReceived?: (otp: string) => void;
};

type UseAutoSmsVerificationResult = {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  otp: string | null;
  status: SmsVerificationStatus;
  error: string | null;
};
```

## Example

A full working example app is included in the [`example/`](example/) folder. It demonstrates the hook usage, OTP auto-fill, status handling, and displaying the required SMS format with your app hash.

To run it:

```bash
cd example
npm install
npx expo run:android
```

## Testing

To test locally, send an SMS to the emulator or device in this exact format:

```
Your OTP is 123456.

<your-app-hash>
```

Get `<your-app-hash>` by calling `getMessageHash()` in your debug build.

> **Tip:** The hash differs between debug and release builds because they use different signing certificates.

## Troubleshooting

| Issue | Solution |
|---|---|
| SMS not detected | Ensure the SMS ends with the correct app hash from `getMessageHash()` |
| Timeout after 5 minutes | This is Google's hard limit, the user must request a new OTP |
| Different hash in production | Release builds use a different signing key, call `getMessageHash()` in the production environment and update your backend |
| `UnavailabilityError` on iOS | This is expected, SMS Retriever API is Android-only |
| Google Play Services missing | The device must have Google Play Services installed (most Android devices do, except some custom ROMs or China-market devices) |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/Varchronos/expo-auto-sms-verification).

## References

- [Google SMS Retriever API Overview](https://developers.google.com/identity/sms-retriever/overview)
- [SMS Retriever API - Verify Messages](https://developers.google.com/identity/sms-retriever/verify)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [Google Play Restricted Permissions Policy](https://support.google.com/googleplay/android-developer/answer/9047303)
- [Android App Signing & Certificate Rotation](https://developer.android.com/studio/publish/app-signing)

## Author

**Dhruv Rajak** ([@Varchronos](https://github.com/Varchronos))

README, Example and documentation co-authored with [Claude](https://claude.ai) by Anthropic.

## License

MIT
