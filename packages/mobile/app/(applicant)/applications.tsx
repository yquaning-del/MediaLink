import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { api } from '@/lib/api';

interface Application {
  id: string;
  status: string;
  matchScore?: number;
  appliedAt: string;
  job: { title: string; employer: { companyName: string } };
}

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  APPLIED: { bg: '#eff6ff', text: '#1d4ed8' },
  SHORTLISTED: { bg: '#fefce8', text: '#a16207' },
  INTERVIEWED: { bg: '#f5f3ff', text: '#7c3aed' },
  OFFER_MADE: { bg: '#fff7ed', text: '#c2410c' },
  HIRED: { bg: '#f0fdf4', text: '#15803d' },
  REJECTED: { bg: '#fef2f2', text: '#dc2626' },
};

export default function ApplicationsScreen() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/applicants/applications');
      setApps(data.data ?? []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1B4F72" /></View>;

  return (
    <FlatList
      style={styles.container}
      data={apps}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1B4F72" />}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No applications yet.</Text>
          <Text style={styles.emptySubtext}>Go to Jobs to start applying!</Text>
        </View>
      }
      renderItem={({ item }) => {
        const colours = STATUS_COLOURS[item.status] ?? { bg: '#f1f5f9', text: '#64748b' };
        const date = new Date(item.appliedAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
        return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle} numberOfLines={1}>{item.job.title}</Text>
                <Text style={styles.company}>{item.job.employer?.companyName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: colours.bg }]}>
                <Text style={[styles.statusText, { color: colours.text }]}>{item.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.date}>Applied {date}</Text>
              {item.matchScore && (
                <Text style={styles.score}>{Math.round(item.matchScore)}% match</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  company: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 11, color: '#94a3b8' },
  score: { fontSize: 11, color: '#1B4F72', fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#475569', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#94a3b8' },
});
