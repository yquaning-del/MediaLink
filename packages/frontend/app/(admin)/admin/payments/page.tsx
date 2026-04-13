'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api, { extractError } from '@/lib/api';
import { MOCK_ADMIN_PAYMENTS } from '@/lib/demo';
import { useToastStore } from '@/lib/store';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '@/lib/utils';
import { Download, CheckCircle, CreditCard } from 'lucide-react';

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
  payer: { email: string; applicantProfile?: { fullName: string }; mediaHouse?: { companyName: string } };
}

export default function AdminPaymentsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '20' });
      if (typeFilter) q.set('type', typeFilter);
      if (statusFilter) q.set('status', statusFilter);
      const { data } = await api.get(`/admin/payments?${q}`);
      setPayments(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch { setPayments(MOCK_ADMIN_PAYMENTS); setTotal(MOCK_ADMIN_PAYMENTS.length); }
    finally { setLoading(false); }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const handleMarkPaid = async (id: string) => {
    setMarkingPaid(id);
    try {
      await api.post(`/admin/payments/${id}/mark-paid`);
      setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: 'SUCCESS', paidAt: new Date().toISOString() } : p));
      addToast({ type: 'success', title: 'Payment marked as paid.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Action failed', description: extractError(err) });
    } finally { setMarkingPaid(null); }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const res = await api.get(`/admin/reports/finance?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `medialink-finance-report.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      addToast({ type: 'error', title: 'Export failed', description: extractError(err) });
    } finally { setExporting(false); }
  };

  const payerName = (p: Payment) => p.payer?.applicantProfile?.fullName ?? p.payer?.mediaHouse?.companyName ?? p.payer?.email;

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString()} payment records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} loading={exporting}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')} loading={exporting}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} loading={exporting}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Payment Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="REGISTRATION">Registration Fee</SelectItem>
            <SelectItem value="REVENUE_SHARE">Revenue Share</SelectItem>
            <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
            <SelectItem value="JOB_BOOST">Job Boost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="SUCCESS">Paid</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No payment records found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4">
                    <div className="sm:col-span-2">
                      <p className="font-medium text-sm truncate">{payerName(p)}</p>
                      <p className="text-xs text-muted-foreground">{p.type.replace('_', ' ')} {p.channel ? `· ${p.channel}` : ''}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{formatCurrency(Number(p.amount))}</p>
                      <p className="text-xs text-muted-foreground">{p.paidAt ? `Paid ${formatDate(p.paidAt)}` : p.dueDate ? `Due ${formatDate(p.dueDate)}` : formatDate(p.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(p.status)} className="text-xs">{p.status}</Badge>
                    </div>
                  </div>
                  {p.status === 'PENDING' && (
                    <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 shrink-0" onClick={() => handleMarkPaid(p.id)} loading={markingPaid === p.id}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Mark Paid
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
