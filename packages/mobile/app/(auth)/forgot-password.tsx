import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { api, extractError } from '@/lib/api';

type Step = 'phone' | 'reset';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [form, setForm] = useState({ code: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!phone) { Alert.alert('Error', 'Please enter your phone number.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { phone });
      setStep('reset');
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!form.code || !form.password) { Alert.alert('Error', 'All fields required.'); return; }
    if (form.password !== form.confirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
    if (form.password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { phone, code: form.code, newPassword: form.password });
      Alert.alert('Password Reset', 'Your password has been updated. Please sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{step === 'phone' ? 'Reset Password' : 'Enter New Password'}</Text>
        <Text style={styles.subtitle}>
          {step === 'phone'
            ? 'Enter your phone number and we\'ll send a verification code.'
            : `Enter the code sent to ${phone} and your new password.`}
        </Text>

        {step === 'phone' ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="024xxxxxxx"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRequestOtp}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Code</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={styles.input}
                value={form.code}
                onChangeText={(v) => setForm((f) => ({ ...f, code: v }))}
                placeholder="6-digit code"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={form.password}
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                placeholder="At least 8 characters"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={form.confirm}
                onChangeText={(v) => setForm((f) => ({ ...f, confirm: v }))}
                placeholder="Repeat new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reset Password</Text>}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.loginRow} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.loginText}>Remember your password? <Text style={styles.link}>Sign In</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, paddingTop: 60 },
  back: { marginBottom: 32 },
  backText: { fontSize: 15, color: '#1B4F72', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1e293b', backgroundColor: '#fff' },
  btn: { backgroundColor: '#1B4F72', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: { alignItems: 'center', marginTop: 24 },
  loginText: { fontSize: 14, color: '#64748b' },
  link: { color: '#1B4F72', fontWeight: '600' },
});
