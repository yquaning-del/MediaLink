import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api, extractError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function VerifyOtpScreen() {
  const { phone, context } = useLocalSearchParams<{ phone: string; context: string }>();
  const { setAuth } = useAuthStore();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, code, purpose: context === 'register' ? 'REGISTRATION' : 'LOGIN' });

      if (data.data?.accessToken) {
        const { accessToken, refreshToken, user } = data.data;
        await setAuth(user, accessToken, refreshToken ?? '');
        if (user.role === 'APPLICANT') router.replace('/(applicant)/dashboard');
        else router.replace('/(auth)/login');
      } else {
        Alert.alert('Phone Verified!', 'Your account is created. Please sign in.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      }
    } catch (err) {
      Alert.alert('Verification Failed', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { phone });
      setResendCooldown(60);
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    } catch (err) {
      Alert.alert('Error', extractError(err));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {phone}
        </Text>

        <View style={styles.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { refs.current[i] = r; }}
              style={[styles.digitInput, d ? styles.digitFilled : null]}
              value={d}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive a code? </Text>
          {resendCooldown > 0 ? (
            <Text style={styles.cooldown}>Resend in {resendCooldown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, paddingTop: 60 },
  back: { marginBottom: 32 },
  backText: { fontSize: 15, color: '#1B4F72', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 40, lineHeight: 20 },
  codeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 32 },
  digitInput: {
    width: 48, height: 56, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10,
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#1e293b', backgroundColor: '#fff',
  },
  digitFilled: { borderColor: '#1B4F72', backgroundColor: '#eff6ff' },
  verifyBtn: { backgroundColor: '#1B4F72', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  verifyBtnDisabled: { opacity: 0.6 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  resendLabel: { fontSize: 14, color: '#64748b' },
  cooldown: { fontSize: 14, color: '#94a3b8' },
  resendLink: { fontSize: 14, color: '#1B4F72', fontWeight: '600' },
});
