'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api, { extractError } from '@/lib/api';
import { MOCK_ADMIN_EMPLOYERS } from '@/lib/demo';
import { useToastStore } from '@/lib/store';
import { formatDate, getStatusBadgeVariant } from '@/lib/utils';
import { CheckCircle, XCircle, Search, Building2 } from 'lucide-react';

interface Employer {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  industryType: string;
  registrationNumber: string;
  kybStatus: string;
  verified: boolean;
  subscriptionTier: string;
  createdAt: string;
  user: { status: string };
}

export default function EmployersPage() {
  const params = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kybFilter, setKybFilter] = useState(params.get('status') ?? '');
  const [actionModal, setActionModal] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);
  const [reason, setReason] = useState('');
  const [actioning, setActioning] = useState(false);

  const loadEmployers = useCallback(async () => {
    setLoading(true);
    try {
      const q: Record<string, string> = { role: 'EMPLOYER', limit: '50' };
      if (search) q.search = search;
      if (kybFilter) q.kybStatus = kybFilter;
      const { data } = await api.get(`/admin/users?${new URLSearchParams(q)}`);
      setEmployers(data.data ?? []);
    } catch { setEmployers(MOCK_ADMIN_EMPLOYERS); }
    finally { setLoading(false); }
  }, [search, kybFilter]);

  useEffect(() => { loadEmployers(); }, [loadEmployers]);

  const loadPending = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/employers/pending');
      setEmployers(data.data ?? []);
    } catch { setEmployers(MOCK_ADMIN_EMPLOYERS.filter(e => e.kybStatus === 'PENDING')); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (kybFilter === 'PENDING') loadPending();
    else loadEmployers();
  }, [kybFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async () => {
    if (!actionModal) return;
    setActioning(true);
    try {
      await api.post(`/admin/employers/${actionModal.id}/approve`, { notes: reason });
      setEmployers((prev) => prev.map((e) => e.id === actionModal.id ? { ...e, kybStatus: 'APPROVED', verified: true } : e));
      addToast({ type: 'success', title: 'Employer approved.', description: 'They have been notified via email.' });
      setActionModal(null);
      setReason('');
    } catch (err) {
      addToast({ type: 'error', title: 'Action failed', description: extractError(err) });
    } finally { setActioning(false); }
  };

  const handleReject = async () => {
    if (!actionModal || !reason.trim()) return;
    setActioning(true);
    try {
      await api.post(`/admin/employers/${actionModal.id}/reject`, { reason });
      setEmployers((prev) => prev.map((e) => e.id === actionModal.id ? { ...e, kybStatus: 'REJECTED' } : e));
      addToast({ type: 'success', title: 'Employer rejected.', description: 'They have been notified.' });
      setActionModal(null);
      setReason('');
    } catch (err) {
      addToast({ type: 'error', title: 'Action failed', description: extractError(err) });
    } finally { setActioning(false); }
  };

  const pendingCount = employers.filter((e) => e.kybStatus === 'PENDING').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employers &amp; KYB</h1>
          <p className="text-muted-foreground text-sm mt-1">{employers.length} employer{employers.length !== 1 ? 's' : ''} {pendingCount > 0 && `· ${pendingCount} pending KYB`}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employers..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadEmployers()} className="pl-9" />
        </div>
        {(['', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
          <Button key={f} variant={kybFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setKybFilter(f)}>
            {f || 'All'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : employers.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No employers found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employers.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{emp.companyName}</h3>
                      <Badge variant={emp.kybStatus === 'APPROVED' ? 'default' : emp.kybStatus === 'REJECTED' ? 'destructive' : 'secondary'} className="text-xs">
                        {emp.kybStatus}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{emp.industryType}</Badge>
                      {emp.subscriptionTier !== 'FREE' && (
                        <Badge className="text-xs bg-brand-accent text-white">{emp.subscriptionTier}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {emp.email} · {emp.phone} · Reg: {emp.registrationNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Registered {formatDate(emp.createdAt)}</p>
                  </div>
                  {emp.kybStatus === 'PENDING' && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => { setActionModal({ id: emp.id, type: 'approve' }); setReason(''); }}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-8" onClick={() => { setActionModal({ id: emp.id, type: 'reject' }); setReason(''); }}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog open={!!actionModal} onOpenChange={() => { setActionModal(null); setReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionModal?.type === 'approve' ? 'Approve Employer' : 'Reject Employer'}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>{actionModal?.type === 'approve' ? 'Notes (optional)' : 'Rejection Reason (required, min 10 characters)'}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={actionModal?.type === 'approve' ? 'Optional notes for this approval...' : 'Explain why this employer application is being rejected...'}
              className="mt-1 min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button
              variant={actionModal?.type === 'reject' ? 'destructive' : 'default'}
              loading={actioning}
              disabled={actionModal?.type === 'reject' && reason.trim().length < 10}
              onClick={actionModal?.type === 'approve' ? handleApprove : handleReject}
            >
              {actionModal?.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
