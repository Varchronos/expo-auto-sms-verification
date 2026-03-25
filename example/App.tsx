import { useAutoSmsVerification } from 'expo-auto-sms-verification';
import ExpoAutoSmsVerificationModule from 'expo-auto-sms-verification/ExpoAutoSmsVerificationModule';
import { useEffect } from 'react';
import { useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function App() {
  const otpInputRef = useRef<TextInput>(null);

  const { startListening, stopListening, otp, status, error } = useAutoSmsVerification({
    otpPattern: /(\d{6})/,
    onOtpReceived: (code) => {
      // Auto-fill the input as soon as the OTP is extracted
      otpInputRef.current?.setNativeProps({ text: code });
    },
  });

  useEffect(() => {
    ExpoAutoSmsVerificationModule.getMessageHash().then((res) => {
      console.log(res)
    })
  })

  const isListening = status === 'listening';
  const isReceived = status === 'received';
  const isTimeout = status === 'timeout';
  const isError = status === 'error';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>SMS Auto-Verification</Text>
        <Text style={styles.subtitle}>
          Tap the button, then send yourself an SMS containing a 6-digit code.
          {'\n'}It will be filled in automatically.
        </Text>

        {/* OTP input */}
        <TextInput
          ref={otpInputRef}
          style={styles.otpInput}
          value={otp ?? ''}
          onChangeText={() => { }}
          placeholder="------"
          placeholderTextColor="#bbb"
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          editable={!isListening}
        />

        {/* Status badge */}
        <StatusBadge status={status} error={error} />

        {/* Action button */}
        {Platform.OS === 'android' ? (
          isListening ? (
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={stopListening}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, (isReceived || isTimeout || isError) && styles.buttonSecondary]}
              onPress={startListening}>
              <Text style={styles.buttonText}>
                {isReceived || isTimeout || isError ? 'Try Again' : 'Start Listening'}
              </Text>
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.unsupported}>
            <Text style={styles.unsupportedText}>
              SMS Auto-Verification is Android-only.
            </Text>
          </View>
        )}

        {/* Example SMS format hint */}
        <View style={styles.hint}>
          <Text style={styles.hintTitle}>SMS must follow this format:</Text>
          <Text style={styles.hintCode}>
            {'Your code is 123456\n\n<app-hash>'}
          </Text>
          <Text style={styles.hintNote}>
            Replace {'<app-hash>'} with your 11-character app hash from Play App Signing.
          </Text>
        </View>
      </View>
    </View>
  );
}

function StatusBadge({
  status,
  error,
}: {
  status: ReturnType<typeof useAutoSmsVerification>['status'];
  error: string | null;
}) {
  const config: Record<typeof status, { label: string; color: string }> = {
    idle: { label: 'Idle', color: '#888' },
    listening: { label: 'Listening…', color: '#f59e0b' },
    received: { label: 'OTP Received', color: '#22c55e' },
    timeout: { label: 'Timed out (5 min)', color: '#ef4444' },
    error: { label: error ?? 'Error', color: '#ef4444' },
  };

  const { label, color } = config[status];

  return (
    <View style={styles.statusRow}>
      {status === 'listening' && (
        <ActivityIndicator size="small" color={color} style={{ marginRight: 6 }} />
      )}
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
  },
  card: {
    margin: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#111',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#e5e7eb',
  },
  buttonSecondary: {
    backgroundColor: '#374151',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unsupported: {
    backgroundColor: '#fef9c3',
    borderRadius: 10,
    padding: 12,
  },
  unsupportedText: {
    color: '#854d0e',
    textAlign: 'center',
    fontSize: 14,
  },
  hint: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hintCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#1e293b',
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    padding: 8,
  },
  hintNote: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
});
