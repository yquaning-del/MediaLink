import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

interface DashboardData {
  employer: { companyName: string; kybStatus: string; subscriptionTier: string };
  stats: { activeJobs: number; totalApplications: number; shortlisted: number; hired: number };
  recentApplications: { id: string; job: { title: string }; applicant: { fullName: string }; status: string }[];
  activeJobs: { id: string; title: string; applicationCount: number; status: string }[];
}

const STATUS_COLOURS: Record<string, string> = {
  APPLIED: '#3b82f6', SHORTLISTED: '#f59e0b', INTERVIEWED: '#8b5cf6',
  OFFER_MADE: '#f97316', HIRED: '#22c55e', REJECTED: '#ef4444',
};

export default function EmployerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data: res } = await api.get('/employers/dashboard');
      setData(res.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1B4F72" /></View>;

  const kybPending = data?.employer?.kybStatus !== 'APPROVED';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1B4F72" />}
    >
      {/* KYB Warning */}
      {kybPending && (
        <View style={styles.kybAlert}>
          <Ionicons name="warning-outline" size={18} color="#d97706" />
          <Text style={styles.kybText}>Your account is pending KYB verification. Job postings will be reviewed before going live.</Text>
        </View>
      )}

      {/* Company Header */}
      <View style={styles.header}>
        <View style={styles.companyIcon}>
          <Text style={styles.companyInitial}>{data?.employer?.companyName?.[0] ?? 'M'}</Text>
        </View>
        <View>
          <Text style={styles.companyName}>{data?.employer?.companyName}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{data?.employer?.subscriptionTier} Plan</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Active Jobs', value: data?.stats?.activeJobs ?? 0, icon: 'briefcase-outline', color: '#1B4F72' },
          { label: 'Applications', value: data?.stats?.totalApplications ?? 0, icon: 'people-outline', color: '#3b82f6' },
          { label: 'Shortlisted', value: data?.stats?.shortlisted ?? 0, icon: 'bookmark-outline', color: '#f59e0b' },
          { label: 'Hired', value: data?.stats?.hired ?? 0, icon: 'checkmark-circle-outline', color: '#22c55e' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={22} color={stat.color} />
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Active Jobs */}
      {(data?.activeJobs?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Listings</Text>
          {data?.activeJobs?.map((job) => (
            <View key={job.id} style={styles.jobRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobMeta}>{job.applicationCount} application{job.applicationCount !== 1 ? 's' : ''}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: job.status === 'ACTIVE' ? '#f0fdf4' : '#fef3c7' }]}>
                <Text style={[styles.statusText, { color: job.status === 'ACTIVE' ? '#15803d' : '#d97706' }]}>{job.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Applications */}
      {(data?.recentApplications?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Applications</Text>
          {data?.recentApplications?.map((app) => (
            <View key={app.id} style={styles.appRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.appName}>{app.applicant?.fullName}</Text>
                <Text style={styles.appJob}>{app.job?.title}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: (STATUS_COLOURS[app.status] ?? '#64748b') + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOURS[app.status] ?? '#64748b' }]}>
                  {app.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  kybAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fef3c7', margin: 12, padding: 12, borderRadius: 10 },
  kybText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1B4F72', padding: 20 },
  companyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  companyInitial: { color: '#fff', fontSize: 22, fontWeight: '800' },
  companyName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tierBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 4, alignSelf: 'flex-start' },
  tierText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 6 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748b' },
  section: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, marginTop: 0 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  jobRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  jobTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  jobMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  appName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  appJob: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
});
