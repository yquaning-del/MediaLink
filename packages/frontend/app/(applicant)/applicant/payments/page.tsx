'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api, { extractError } from '@/lib/api';
import { MOCK_APPLICANT_PAYMENTS } from '@/lib/demo';
import { useAuthStore, useToastStore } from '@/lib/store';
import { openPaystackModal } from '@/lib/paystack';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '@/lib/utils';
import { CreditCard, AlertCircle } from 'lucide-react';

interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  channel?: string;
  gatewayRef?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

interface Schedule {
  id: string;
  monthNumber: number;
  dueDate: string;
  amount: number;
  status: string;
}

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/payments/history'),
      api.get('/placements/my-schedules').catch(() => ({ data: { data: [] } })),
    ]).then(([payRes, schedRes]) => {
      setPayments(payRes.data.data ?? []);
      setSchedules(schedRes.data.data ?? []);
    }).catch(() => { setPayments(MOCK_APPLICANT_PAYMENTS); }).finally(() => setLoading(false));
  }, []);

  const handlePaySchedule = async (schedule: Schedule) => {
    if (!user) return;
    setPaying(schedule.id);
    try {
      const { data } = await api.post('/payments/revenue-share/initiate', { scheduleId: schedule.id });
      await openPaystackModal({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: user.email,
        amount: data.data.amount,
        currency: 'GHS',
        ref: data.data.reference,
        label: `Revenue Share — Month ${schedule.monthNumber}`,
        callback: async () => {
          addToast({ type: 'success', title: 'Payment successful!', description: `Month ${schedule.monthNumber} revenue share paid.` });
          setSchedules((prev) => prev.map((s) => s.id === schedule.id ? { ...s, status: 'SUCCESS' } : s));
        },
        onClose: () => setPaying(null),
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Payment failed', description: extractError(err) });
    } finally {
      setPaying(null);
    }
  };

  const pendingSchedules = schedules.filter((s) => s.status === 'PENDING');
  const totalOwed = pendingSchedules.reduce((sum, s) => sum + Number(s.amount), 0);

  if (loading) return <div className="p-6 flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your registration fee and revenue share obligations.</p>
      </div>

      {/* Revenue Share Summary */}
      {schedules.length > 0 && (
        <Card className={pendingSchedules.length > 0 ? 'border-orange-300 bg-orange-50' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {pendingSchedules.length > 0 && <AlertCircle className="h-5 w-5 text-orange-500" />}
              Revenue Share Obligations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <p className="text-2xl font-bold">{schedules.length}</p>
                <p className="text-xs text-muted-foreground">Total Months</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{schedules.filter((s) => s.status === 'SUCCESS').length}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{pendingSchedules.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>

            <div className="space-y-2">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Month {s.monthNumber}</p>
                    <p className="text-xs text-muted-foreground">Due: {formatDate(s.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{formatCurrency(Number(s.amount))}</span>
                    {s.status === 'SUCCESS' ? (
                      <Badge variant="success">Paid</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handlePaySchedule(s)}
                        loading={paying === s.id}
                        className="h-8"
                      >
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pendingSchedules.length > 0 && (
              <p className="text-sm font-medium text-orange-800 mt-3">
                Total outstanding: {formatCurrency(totalOwed)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{p.type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.paidAt ? `Paid ${formatDate(p.paidAt)}` : `Created ${formatDate(p.createdAt)}`}
                      {p.channel && ` · ${p.channel}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(Number(p.amount))}</span>
                    <Badge variant={getStatusBadgeVariant(p.status)} className="text-xs">{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
