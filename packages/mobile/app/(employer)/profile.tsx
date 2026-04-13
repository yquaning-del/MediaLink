import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface EmployerProfile {
  companyName: string;
  industryType: string;
  email: string;
  phone: string;
  address?: string;
  kybStatus: string;
  subscriptionTier: string;
  subscriptionExpiry?: string;
  verified: boolean;
}

const KYB_COLOURS: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: '#f0fdf4', text: '#15803d' },
  PENDING: { bg: '#fef3c7', text: '#d97706' },
  REJECTED: { bg: '#fef2f2', text: '#dc2626' },
};

export default function EmployerProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employers/profile').then(({ data }) => setProfile(data.data)).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          try { await api.post('/auth/logout'); } catch {}
          await clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1B4F72" /></View>;

  const kyb = KYB_COLOURS[profile?.kybStatus ?? 'PENDING'];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.companyName?.[0]?.toUpperCase() ?? 'M'}</Text>
        </View>
        <Text style={styles.companyName}>{profile?.companyName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.industryBadge}>
          <Text style={styles.industryText}>{profile?.industryType}</Text>
        </View>
      </View>

      {/* KYB Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification Status</Text>
        <View style={styles.kybRow}>
          <Ionicons name={profile?.kybStatus === 'APPROVED' ? 'shield-checkmark' : 'shield-outline'} size={20} color={kyb.text} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.kybStatus, { color: kyb.text }]}>KYB {profile?.kybStatus}</Text>
            {profile?.kybStatus === 'PENDING' && (
              <Text style={styles.kybNote}>Our team is reviewing your registration documents.</Text>
            )}
          </View>
          <View style={[styles.kybBadge, { backgroundColor: kyb.bg }]}>
            <Text style={[styles.kybBadgeText, { color: kyb.text }]}>{profile?.kybStatus}</Text>
          </View>
        </View>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.subscriptionRow}>
          <View>
            <Text style={styles.tierName}>{profile?.subscriptionTier} Plan</Text>
            {profile?.subscriptionExpiry && (
              <Text style={styles.expiryText}>
                Expires {new Date(profile.subscriptionExpiry).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
          </View>
          {profile?.subscriptionTier === 'FREE' && (
            <View style={styles.upgradeBadge}>
              <Text style={styles.upgradeText}>Upgrade</Text>
            </View>
          )}
        </View>
      </View>

      {/* Company Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Details</Text>
        {[
          { icon: 'mail-outline', label: profile?.email },
          { icon: 'call-outline', label: profile?.phone },
          { icon: 'location-outline', label: profile?.address },
        ].filter((d) => d.label).map((detail, i) => (
          <View key={i} style={styles.detailRow}>
            <Ionicons name={detail.icon as any} size={16} color="#64748b" />
            <Text style={styles.detailText}>{detail.label}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#1B4F72" />
          <Text style={styles.actionText}>2FA Settings</Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1B4F72', padding: 24, alignItems: 'center', paddingBottom: 28 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  companyName: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  email: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 },
  industryBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  industryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, marginTop: 0 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  kybRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kybStatus: { fontSize: 14, fontWeight: '700' },
  kybNote: { fontSize: 12, color: '#64748b', marginTop: 2 },
  kybBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  kybBadgeText: { fontSize: 12, fontWeight: '700' },
  subscriptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  expiryText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  upgradeBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  upgradeText: { color: '#1B4F72', fontSize: 13, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailText: { fontSize: 14, color: '#1e293b' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  actionText: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '500' },
  logoutBtn: { borderBottomWidth: 0 },
});
