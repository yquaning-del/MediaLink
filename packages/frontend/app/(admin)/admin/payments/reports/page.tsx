'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api, { extractError } from '@/lib/api';
import { useToastStore } from '@/lib/store';
import { Download, TrendingUp, DollarSign, Users, CreditCard } from 'lucide-react';

interface ReportData {
  totalRevenue: number;
  totalPayments: number;
  registrationRevenue: number;
  revenueShareRevenue: number;
  subscriptionRevenue: number;
  pendingPayments: number;
  failedPayments: number;
}

export default function PaymentReportsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/admin/analytics/payments')
      .then((res) => setData(res.data.data))
      .catch((err) => addToast({ type: 'error', title: 'Failed to load report', description: extractError(err) }))
      .finally(() => setLoading(false));
  }, [addToast]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/payments/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Report exported successfully' });
    } catch (err) {
      addToast({ type: 'error', title: 'Export failed', description: extractError(err) });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Revenue', value: `GHC ${(data?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Total Payments', value: data?.totalPayments ?? 0, icon: CreditCard, color: 'text-blue-600' },
    { label: 'Registration Fees', value: `GHC ${(data?.registrationRevenue ?? 0).toLocaleString()}`, icon: Users, color: 'text-brand' },
    { label: 'Revenue Share', value: `GHC ${(data?.revenueShareRevenue ?? 0).toLocaleString()}`, icon: TrendingUp, color: 'text-brand-accent' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Reports</h1>
          <p className="text-muted-foreground text-sm">Overview of all platform payment activity</p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export XLSX'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Registration Fees', value: data?.registrationRevenue ?? 0, color: 'bg-brand' },
              { label: 'Revenue Share', value: data?.revenueShareRevenue ?? 0, color: 'bg-brand-accent' },
              { label: 'Subscriptions', value: data?.subscriptionRevenue ?? 0, color: 'bg-blue-500' },
            ].map((item) => {
              const total = data?.totalRevenue || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">GHC {item.value.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-yellow-800">Pending Payments</span>
              <span className="font-bold text-yellow-800">{data?.pendingPayments ?? 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-red-800">Failed Payments</span>
              <span className="font-bold text-red-800">{data?.failedPayments ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
