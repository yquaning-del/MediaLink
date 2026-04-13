import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import { api, extractError } from '@/lib/api';

const ROLE_ROUTE: Record<string, string> = {
  APPLICANT: '/(applicant)/dashboard',
  EMPLOYER: '/(employer)/dashboard',
};

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password, totpCode: totpCode || undefined });
      const { user, accessToken, refreshToken } = data.data;
      await setAuth(user, accessToken, refreshToken);
      router.replace((ROLE_ROUTE[user.role] ?? '/(auth)/login') as any);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg === '2FA_REQUIRED' || msg === 'Two-factor authentication code required') {
        setRequires2FA(true);
      } else {
        Alert.alert('Login Failed', extractError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>ML</Text>
          </View>
          <Text style={styles.logoTitle}>MediaLink Ghana</Text>
          <Text style={styles.logoSubtitle}>Media Sales Recruitment</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Sign In</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            placeholderTextColor="#94a3b8"
          />

          {requires2FA && (
            <>
              <Text style={styles.label}>Authenticator Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={totpCode}
                onChangeText={setTotpCode}
                placeholder="6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor="#94a3b8"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{requires2FA ? 'Verify & Sign In' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerText}>
            Don&apos;t have an account? <Text style={styles.registerLink}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B4F72' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  logoTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  logoSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#1e293b' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { height: 48, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: '#1e293b', backgroundColor: '#f8fafc', marginBottom: 14 },
  otpInput: { textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: '700' },
  button: { height: 52, backgroundColor: '#1B4F72', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  forgotText: { textAlign: 'center', color: '#1B4F72', fontSize: 13, marginTop: 14, fontWeight: '500' },
  registerText: { textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  registerLink: { color: '#fff', fontWeight: '700', textDecorationLine: 'underline' },
});
