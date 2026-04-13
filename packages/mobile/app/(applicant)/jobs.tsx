import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, extractError } from '@/lib/api';

interface Job {
  id: string;
  title: string;
  employer: { companyName: string; industryType: string };
  region: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills: string[];
  isFeatured: boolean;
}

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState<string | null>(null);

  const load = useCallback(async (q = '') => {
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (q) params.set('search', q);
      const { data } = await api.get(`/jobs?${params}`);
      setJobs(data.data ?? []);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApply = async (jobId: string) => {
    Alert.alert('Apply for this job?', 'Your profile will be shared with the employer.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Apply', onPress: async () => {
          setApplying(jobId);
          try {
            await api.post('/applications', { jobId });
            Alert.alert('Application Submitted!', 'The employer has been notified. Track your application in the Applications tab.');
          } catch (err) {
            Alert.alert('Application Failed', extractError(err));
          } finally { setApplying(null); }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Job }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#f59e0b" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <View style={styles.industryBadge}>
          <Text style={styles.industryText}>{item.employer?.industryType}</Text>
        </View>
      </View>

      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.companyName}>{item.employer?.companyName}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={12} color="#64748b" />
          <Text style={styles.metaText}>{item.region}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={12} color="#64748b" />
          <Text style={styles.metaText}>{item.jobType.replace('_', ' ')}</Text>
        </View>
        {item.salaryMin && (
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>GHC {Number(item.salaryMin).toLocaleString()}+</Text>
          </View>
        )}
      </View>

      <View style={styles.skillsRow}>
        {item.requiredSkills?.slice(0, 3).map((s) => (
          <View key={s} style={styles.skillChip}><Text style={styles.skillText}>{s}</Text></View>
        ))}
        {(item.requiredSkills?.length ?? 0) > 3 && (
          <View style={styles.skillChip}><Text style={styles.skillText}>+{item.requiredSkills.length - 3}</Text></View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.applyBtn, applying === item.id && styles.applyBtnDisabled]}
        onPress={() => handleApply(item.id)}
        disabled={applying === item.id}
      >
        {applying === item.id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.applyBtnText}>Apply Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(search)}
          placeholder="Search jobs, skills, companies..."
          placeholderTextColor="#94a3b8"
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1B4F72" /></View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(search); }}
          ListEmptyComponent={<Text style={styles.empty}>No jobs found. Try a different search.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fef3c7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  featuredText: { fontSize: 10, color: '#d97706', fontWeight: '600' },
  industryBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  industryText: { fontSize: 10, color: '#64748b' },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  companyName: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: '#64748b' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  skillChip: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  skillText: { fontSize: 11, color: '#3b82f6' },
  applyBtn: { backgroundColor: '#1B4F72', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
});
