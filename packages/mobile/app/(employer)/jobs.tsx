import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, extractError } from '@/lib/api';

interface Job {
  id: string;
  title: string;
  jobType: string;
  region: string;
  status: string;
  applicationCount: number;
  createdAt: string;
}

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: '#f0fdf4', text: '#15803d' },
  DRAFT: { bg: '#f1f5f9', text: '#64748b' },
  PAUSED: { bg: '#fef3c7', text: '#d97706' },
  CLOSED: { bg: '#fef2f2', text: '#dc2626' },
};

export default function EmployerJobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data } = await api.get('/jobs/my-listings');
      setJobs(data.data ?? []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (job: Job) => {
    const nextStatus = job.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const label = nextStatus === 'ACTIVE' ? 'Publish' : 'Pause';
    Alert.alert(`${label} Job?`, `${label} "${job.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label, onPress: async () => {
          setToggling(job.id);
          try {
            await api.patch(`/jobs/${job.id}/status`, { status: nextStatus });
            setJobs((js) => js.map((j) => j.id === job.id ? { ...j, status: nextStatus } : j));
          } catch (err) {
            Alert.alert('Error', extractError(err));
          } finally { setToggling(null); }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1B4F72" /></View>;

  return (
    <FlatList
      style={styles.container}
      data={jobs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1B4F72" />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="briefcase-outline" size={40} color="#cbd5e1" />
          <Text style={styles.emptyText}>No job listings yet.</Text>
          <Text style={styles.emptySubtext}>Create your first job posting from the web portal.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const colours = STATUS_COLOURS[item.status] ?? { bg: '#f1f5f9', text: '#64748b' };
        return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.jobMeta}>{item.region} · {item.jobType.replace('_', ' ')}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: colours.bg }]}>
                <Text style={[styles.statusText, { color: colours.text }]}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={14} color="#64748b" />
                <Text style={styles.metaText}>{item.applicationCount} applicant{item.applicationCount !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}</Text>
              </View>

              {(item.status === 'ACTIVE' || item.status === 'PAUSED') && (
                <TouchableOpacity
                  style={[styles.toggleBtn, item.status === 'ACTIVE' ? styles.pauseBtn : styles.publishBtn, toggling === item.id && styles.btnDisabled]}
                  onPress={() => handleToggle(item)}
                  disabled={toggling === item.id}
                >
                  {toggling === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.toggleBtnText}>{item.status === 'ACTIVE' ? 'Pause' : 'Publish'}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#475569' },
  emptySubtext: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  jobMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#64748b' },
  toggleBtn: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pauseBtn: { backgroundColor: '#f59e0b' },
  publishBtn: { backgroundColor: '#22c55e' },
  btnDisabled: { opacity: 0.6 },
  toggleBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
