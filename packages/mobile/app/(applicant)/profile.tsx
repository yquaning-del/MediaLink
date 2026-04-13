import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Profile {
  fullName: string;
  region?: string;
  district?: string;
  completionScore: number;
  professionalSummary?: string;
  skills: string[];
  cvUrl?: string;
  workExperiences: { role: string; companyName: string; isCurrent: boolean; startDate: string }[];
  educations: { institution: string; qualification: string; graduationYear: number }[];
}

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applicants/profile').then(({ data }) => setProfile(data.data)).finally(() => setLoading(false));
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

  const score = profile?.completionScore ?? 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.fullName ?? 'Your Name'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {profile?.region && <Text style={styles.region}><Ionicons name="location-outline" size={12} /> {profile.region}</Text>}

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Profile {score}% complete</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: score >= 60 ? '#22c55e' : '#ef4444' }]} />
          </View>
        </View>
      </View>

      {/* Professional Summary */}
      {profile?.professionalSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.summaryText}>{profile.professionalSummary}</Text>
        </View>
      )}

      {/* Skills */}
      {(profile?.skills?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsGrid}>
            {profile?.skills?.map((s) => (
              <View key={s} style={styles.skillChip}><Text style={styles.skillText}>{s}</Text></View>
            ))}
          </View>
        </View>
      )}

      {/* Work Experience */}
      {(profile?.workExperiences?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Experience</Text>
          {profile?.workExperiences?.map((exp, i) => (
            <View key={i} style={styles.expItem}>
              <Text style={styles.expRole}>{exp.role}</Text>
              <Text style={styles.expCompany}>{exp.companyName}</Text>
              <Text style={styles.expDate}>{exp.isCurrent ? 'Current' : new Date(exp.startDate).getFullYear()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {(profile?.educations?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {profile?.educations?.map((edu, i) => (
            <View key={i} style={styles.expItem}>
              <Text style={styles.expRole}>{edu.qualification}</Text>
              <Text style={styles.expCompany}>{edu.institution}</Text>
              <Text style={styles.expDate}>{edu.graduationYear}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="document-outline" size={18} color="#1B4F72" />
          <Text style={styles.actionText}>{profile?.cvUrl ? 'View / Update CV' : 'Upload CV'}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
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
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  email: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  region: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 16 },
  scoreContainer: { width: '100%' },
  scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  section: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  summaryText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  skillText: { fontSize: 12, color: '#1B4F72', fontWeight: '500' },
  expItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  expRole: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  expCompany: { fontSize: 12, color: '#64748b', marginTop: 2 },
  expDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  actionText: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '500' },
  logoutBtn: { borderBottomWidth: 0 },
});
