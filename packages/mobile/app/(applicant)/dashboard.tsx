import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface DashboardData {
  profile: { completionScore: number; fullName: string };
  matchedJobs: { id: string; title: string; employer: { companyName: string }; region: string }[];
  recentApplications: { id: string; job: { title: string }; status: string }[];
}

const STATUS_COLOURS: Record<string, string> = {
  APPLIED: '#3b82f6', SHORTLISTED: '#f59e0b', INTERVIEWED: '#8b5cf6',
  OFFER_MADE: '#f97316', HIRED: '#22c55e', REJECTED: '#ef4444',
};

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [profileRes, matchesRes, appsRes] = await Promise.all([
        api.get('/applicants/profile'),
        api.get('/applicants/matches?limit=5'),
        api.get('/applicants/applications?limit=3'),
      ]);
      setData({
        profile: profileRes.data.data,
        matchedJobs: matchesRes.data.data ?? [],
        recentApplications: appsRes.data.data ?? [],
      });
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1B4F72" /></View>;

  const score = data?.profile?.completionScore ?? 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1B4F72" />}
    >
      {/* Profile card */}
      <View style={styles.profileCard}>
        <Text style={styles.greeting}>Hi, {data?.profile?.fullName?.split(' ')[0] ?? 'there'} 👋</Text>

        {score < 60 && (
          <TouchableOpacity style={styles.alert} onPress={() => router.push('/(applicant)/profile')}>
            <Ionicons name="warning-outline" size={16} color="#d97706" />
            <Text style={styles.alertText}>Complete your profile to appear in searches ({score}%)</Text>
            <Ionicons name="chevron-forward" size={14} color="#d97706" />
          </TouchableOpacity>
        )}

        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Profile Score</Text>
          <Text style={[styles.scoreValue, { color: score >= 60 ? '#22c55e' : '#ef4444' }]}>{score}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: score >= 60 ? '#22c55e' : '#ef4444' }]} />
        </View>
      </View>

      {/* Matched Jobs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matched Jobs</Text>
          <TouchableOpacity onPress={() => router.push('/(applicant)/jobs')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {(data?.matchedJobs ?? []).length === 0 ? (
          <Text style={styles.empty}>No matches yet. Complete your profile.</Text>
        ) : data?.matchedJobs?.map((job) => (
          <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => router.push(`/(applicant)/jobs` as any)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobMeta}>{job.employer?.companyName} · {job.region}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Applications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Applications</Text>
          <TouchableOpacity onPress={() => router.push('/(applicant)/applications')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {(data?.recentApplications ?? []).length === 0 ? (
          <Text style={styles.empty}>No applications yet.</Text>
        ) : data?.recentApplications?.map((app) => (
          <View key={app.id} style={styles.appRow}>
            <Text style={styles.appTitle} numberOfLines={1}>{app.job.title}</Text>
            <View style={[styles.statusPill, { backgroundColor: STATUS_COLOURS[app.status] + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLOURS[app.status] ?? '#64748b' }]}>
                {app.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { backgroundColor: '#1B4F72', padding: 20, marginBottom: 8 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', borderRadius: 8, padding: 10, marginBottom: 12 },
  alertText: { flex: 1, fontSize: 12, color: '#92400e' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  scoreLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  scoreValue: { fontSize: 13, fontWeight: '700' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  section: { backgroundColor: '#fff', marginBottom: 8, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  seeAll: { fontSize: 12, color: '#1B4F72', fontWeight: '600' },
  jobCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  jobTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  jobMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  appRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  appTitle: { flex: 1, fontSize: 13, color: '#1e293b', marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  empty: { color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
});
