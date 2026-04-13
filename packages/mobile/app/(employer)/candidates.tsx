import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

interface Candidate {
  id: string;
  fullName: string;
  region?: string;
  completionScore: number;
  skills: string[];
  matchScore?: number;
  jobTitle?: string;
}

export default function CandidatesScreen() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/employers/candidates');
      setCandidates(data.data ?? []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1B4F72" /></View>;

  return (
    <FlatList
      style={styles.container}
      data={candidates}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1B4F72" />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={40} color="#cbd5e1" />
          <Text style={styles.emptyText}>No matched candidates yet.</Text>
          <Text style={styles.emptySubtext}>Post active jobs to see matched applicants here.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.fullName}</Text>
              {item.region && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color="#64748b" />
                  <Text style={styles.location}>{item.region}</Text>
                </View>
              )}
            </View>
            {item.matchScore != null && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchScore}>{Math.round(item.matchScore)}%</Text>
                <Text style={styles.matchLabel}>match</Text>
              </View>
            )}
          </View>

          {/* Profile completion bar */}
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Profile {item.completionScore}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.completionScore}%`, backgroundColor: item.completionScore >= 60 ? '#22c55e' : '#ef4444' }]} />
            </View>
          </View>

          {/* Skills */}
          {item.skills?.length > 0 && (
            <View style={styles.skillsRow}>
              {item.skills.slice(0, 4).map((s) => (
                <View key={s} style={styles.skillChip}><Text style={styles.skillText}>{s}</Text></View>
              ))}
              {item.skills.length > 4 && (
                <View style={styles.skillChip}><Text style={styles.skillText}>+{item.skills.length - 4}</Text></View>
              )}
            </View>
          )}

          {item.jobTitle && (
            <Text style={styles.jobContext}>Matched for: {item.jobTitle}</Text>
          )}
        </View>
      )}
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#1B4F72', fontSize: 15, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  location: { fontSize: 12, color: '#64748b' },
  matchBadge: { alignItems: 'center', backgroundColor: '#eff6ff', padding: 8, borderRadius: 10 },
  matchScore: { fontSize: 16, fontWeight: '800', color: '#1B4F72' },
  matchLabel: { fontSize: 10, color: '#64748b' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  scoreLabel: { fontSize: 11, color: '#64748b', width: 76 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  skillChip: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  skillText: { fontSize: 11, color: '#1B4F72' },
  jobContext: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 },
});
