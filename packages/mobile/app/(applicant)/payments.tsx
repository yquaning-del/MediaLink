import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, extractError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
}

interface Schedule {
  id: string;
  monthNumber: number;
  dueDate: string;
  amount: number;
  status: string;
}

export default function PaymentsScreen() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initiating, setInitiating] = useState<string | null>(null);

  const load = async () => {
    try {
      const [payRes, schedRes] = await Promise.all([
        api.get('/payments/history'),
        api.get('/placements/my-schedules').catch(() => ({ data: { data: [] } })),
      ]);
      setPayments(payRes.data.data ?? []);
      setSchedules(schedRes.data.data ?? []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handlePaySchedule = async (schedule: Schedule) => {
    setInitiating(schedule.id);
    try {
      const { data } = await api.post('/payments/revenue-share/initiate', { scheduleId: schedule.id });
      // Open Paystack payment URL in browser
      await Linking.openURL(data.data.authorizationUrl);
    } catch (err) {
      Alert.alert('Payment Error', extractError(err));
    } finally { setInitiating(null); }
  };

  const pendingSchedules = schedules.filter((s) => s.status === 'PENDING');

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1B4F72" /></View>;

  return (
    <FlatList
      style={styles.container}
      data={payments}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1B4F72" />}
      ListHeaderComponent={() => (
        <>
          {/* Revenue Share Section */}
          {schedules.length > 0 && (
            <View style={styles.revenueCard}>
              <Text style={styles.sectionTitle}>Revenue Share Obligations</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}><Text style={styles.statVal}>{schedules.length}</Text><Text style={styles.statLabel}>Total</Text></View>
                <View style={styles.stat}><Text style={[styles.statVal, { color: '#22c55e' }]}>{schedules.filter((s) => s.status === 'SUCCESS').length}</Text><Text style={styles.statLabel}>Paid</Text></View>
                <View style={styles.stat}><Text style={[styles.statVal, { color: '#f59e0b' }]}>{pendingSchedules.length}</Text><Text style={styles.statLabel}>Pending</Text></View>
              </View>
              {schedules.map((s) => (
                <View key={s.id} style={styles.scheduleRow}>
                  <View>
                    <Text style={styles.monthText}>Month {s.monthNumber}</Text>
                    <Text style={styles.dueDateText}>Due: {new Date(s.dueDate).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  </View>
                  <View style={styles.scheduleRight}>
                    <Text style={styles.amountText}>GHC {Number(s.amount).toLocaleString()}</Text>
                    {s.status === 'SUCCESS' ? (
                      <View style={styles.paidBadge}><Ionicons name="checkmark-circle" size={14} color="#22c55e" /><Text style={styles.paidText}>Paid</Text></View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.payBtn, initiating === s.id && styles.payBtnDisabled]}
                        onPress={() => handlePaySchedule(s)}
                        disabled={initiating === s.id}
                      >
                        {initiating === s.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.payBtnText}>Pay</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.historyTitle}>Payment History</Text>
        </>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No payment history yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.paymentRow}>
          <View>
            <Text style={styles.paymentType}>{item.type.replace('_', ' ')}</Text>
            <Text style={styles.paymentDate}>
              {item.paidAt ? `Paid ${new Date(item.paidAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}` : new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.paymentAmount}>GHC {Number(item.amount).toLocaleString()}</Text>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'SUCCESS' ? '#22c55e' : item.status === 'PENDING' ? '#f59e0b' : '#ef4444' }]} />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  revenueCard: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: '800', color: '#1B4F72' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  monthText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  dueDateText: { fontSize: 11, color: '#64748b', marginTop: 2 },
  scheduleRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  paidText: { fontSize: 11, color: '#22c55e', fontWeight: '600' },
  payBtn: { backgroundColor: '#1B4F72', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  historyTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', margin: 12, marginBottom: 4 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 2, padding: 14, borderRadius: 8 },
  paymentType: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  paymentDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  paymentAmount: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, alignSelf: 'flex-end' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 20, fontSize: 13 },
});
