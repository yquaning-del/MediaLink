import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { api, extractError } from '@/lib/api';

export default function RegisterScreen() {
  const [role, setRole] = useState<'APPLICANT' | 'EMPLOYER'>('APPLICANT');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = async () => {
    if (!form.fullName || !form.email || !form.phone || !form.password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (role === 'EMPLOYER' && !form.companyName) {
      Alert.alert('Missing Fields', 'Company name is required for employers.');
      return;
    }

    setLoading(true);
    try {
      if (role === 'APPLICANT') {
        await api.post('/auth/register/applicant', {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });
      } else {
        await api.post('/auth/register/employer', {
          companyName: form.companyName,
          registrationNumber: '',
          industryType: 'TELEVISION',
          contactName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: '',
          password: form.password,
        });
      }

      // Navigate to OTP verification
      router.push({ pathname: '/(auth)/verify-otp', params: { phone: form.phone, context: 'register' } });
    } catch (err) {
      Alert.alert('Registration Failed', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>MediaLink</Text>
          <Text style={styles.subtitle}>Ghana's Media Sales Platform</Text>
        </View>

        <Text style={styles.title}>Create Account</Text>

        {/* Role Selector */}
        <View style={styles.roleRow}>
          {(['APPLICANT', 'EMPLOYER'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                {r === 'APPLICANT' ? 'Job Seeker' : 'Employer'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fields */}
        <View style={styles.field}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={form.fullName}
            onChangeText={set('fullName')}
            placeholder="Your full name"
            placeholderTextColor="#94a3b8"
            autoCapitalize="words"
          />
        </View>

        {role === 'EMPLOYER' && (
          <View style={styles.field}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              value={form.companyName}
              onChangeText={set('companyName')}
              placeholder="Media house or company name"
              placeholderTextColor="#94a3b8"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={set('email')}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="024xxxxxxx"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={set('password')}
            placeholder="At least 8 characters"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            value={form.confirmPassword}
            onChangeText={set('confirmPassword')}
            placeholder="Repeat your password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 28, fontWeight: '800', color: '#1B4F72' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 20 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center' },
  roleBtnActive: { borderColor: '#1B4F72', backgroundColor: '#eff6ff' },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  roleBtnTextActive: { color: '#1B4F72' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1e293b', backgroundColor: '#fff' },
  submitBtn: { backgroundColor: '#1B4F72', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: '#64748b' },
  link: { fontSize: 14, color: '#1B4F72', fontWeight: '600' },
});
