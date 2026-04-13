import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { api, extractError } from '@/lib/api';

interface Application {
  id: string;
  status: string;
  matchScore?: number;
  appliedAt: string;
  applicant: { fullName: string; completionScore: number; skills: string[] };
  job: { title: string };
}

const PIPELINE: { status: string; label: string; color: string }[] = [
  { status: 'APPLIED', label: 'Applied', color: '#3b82f6' },
  { status: 'SHORTLISTED', label: 'Shortlisted', color: '#f59e0b' },
  { status: 'INTERVIEWED', label: 'Interviewed', color: '#8b5cf6' },
  { status: 'OFFER_MADE', label: 'Offer Made', color: '#f97316' },
  { status: 'HIRED', label: 'Hired', color: '#22c55e' },
];

const ACTIONS: Record<string, string[]> = {
  APPLIED: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEWED', 'REJECTED'],
  INTERVIEWED: ['OFFER_MADE', 'REJECTED'],
  OFFER_MADE: ['HIRED', 'REJECTED'],
};

export default function EmployerApplicationsScreen() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data } = await api.get('/employers/applications');
      setApps(data.data ?? []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    const label = PIPELINE.find((p) => p.status === newStatus)?.label ?? newStatus;
    Alert.alert(`Move to ${label}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          setUpdating(appId);
          try {
            await api.patch(`/applications/${appId}/status`, { status: newStatus });
            setApps((a) => a.map((ap) => ap.id === appId ? { ...ap, status: newStatus } : ap));
          } catch (err) {
            Alert.alert('Error', extractError(err));
          } finally { setUpdating(null); }
        },
      },
    ]);
  };

  const filters = ['ALL', ...PIPELINE.map((p) => p.status), 'REJECTED'];
  const filtered = activeFilter === 'ALL' ? apps : apps.filter((a) => a.status === activeFilter);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1B4F72" /></View>;

  return (
    <View style={styles.container}>
      {/* Filter pills */}
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === item && styles.filterPillActive]}
            onPress={() => setActiveFilter(item)}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item === 'ALL' ? 'All' : item.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1B4F72" />}
        ListEmptyComponent={<Text style={styles.empty}>No applications in this stage.</Text>}
        renderItem={({ item }) => {
          const step = PIPELINE.find((p) => p.status === item.status);
          const nextActions = ACTIONS[item.status] ?? [];

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.applicantName}>{item.applicant?.fullName}</Text>
                  <Text style={styles.jobTitle}>{item.job?.title}</Text>
                </View>
                {item.matchScore != null && (
                  <Text style={styles.score}>{Math.round(item.matchScore)}% match</Text>
                )}
              </View>

              <View style={styles.statusRow}>
                <View style={[styles.statusPill, { backgroundColor: (step?.color ?? '#64748b') + '20' }]}>
                  <Text style={[styles.statusText, { color: step?.color ?? '#64748b' }]}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.date}>
                  {new Date(item.appliedAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
                </Text>
              </View>

              {nextActions.length > 0 && item.status !== 'HIRED' && item.status !== 'REJECTED' && (
                <View style={styles.actionsRow}>
                  {nextActions.map((action) => (
                    <TouchableOpacity
                      key={action}
                      style={[
                        styles.actionBtn,
                        action === 'REJECTED' ? styles.rejectBtn : styles.advanceBtn,
                        updating === item.id && styles.btnDisabled,
                      ]}
                      onPress={() => handleUpdateStatus(item.id, action)}
                      disabled={updating === item.id}
                    >
                      {updating === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.actionBtnText}>
                          {action === 'REJECTED' ? 'Reject' : PIPELINE.find((p) => p.status === action)?.label ?? action.replace('_', ' ')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterList: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  filterPillActive: { backgroundColor: '#1B4F72' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  applicantName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  jobTitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  score: { fontSize: 12, color: '#1B4F72', fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  date: { fontSize: 11, color: '#94a3b8' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  advanceBtn: { backgroundColor: '#1B4F72' },
  rejectBtn: { backgroundColor: '#ef4444' },
  btnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
