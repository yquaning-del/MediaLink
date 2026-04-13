'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import api, { extractError } from '@/lib/api';
import { MOCK_EMPLOYER_APPLICATIONS } from '@/lib/demo';
import { useToastStore } from '@/lib/store';
import { formatDate, getStatusBadgeVariant, cn } from '@/lib/utils';
import { ChevronRight, Send, UserCheck } from 'lucide-react';
import Link from 'next/link';

type AppStatus = 'APPLIED' | 'SHORTLISTED' | 'INTERVIEWED' | 'OFFER_MADE' | 'HIRED' | 'REJECTED';

interface Application {
  id: string;
  status: AppStatus;
  matchScore?: number;
  coverNote?: string;
  appliedAt: string;
  applicant: { id: string; fullName: string; region?: string; completionScore: number };
  job: { id: string; title: string };
}

const PIPELINE_STEPS: AppStatus[] = ['APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'OFFER_MADE', 'HIRED'];
const NEXT_STATUS: Partial<Record<AppStatus, AppStatus>> = {
  APPLIED: 'SHORTLISTED', SHORTLISTED: 'INTERVIEWED', INTERVIEWED: 'OFFER_MADE', OFFER_MADE: 'HIRED',
};

export default function EmployerApplicationsPage() {
  const params = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(params.get('status') ?? '');
  const [inviteApp, setInviteApp] = useState<Application | null>(null);
  const [inviteDetails, setInviteDetails] = useState({ date: '', time: '', location: '', notes: '' });
  const [actioning, setActioning] = useState(false);

  const jobId = params.get('jobId');

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (jobId) q.set('jobId', jobId);
      if (statusFilter) q.set('status', statusFilter);
      const { data } = await api.get(`/applications?${q}`);
      setApplications(data.data ?? []);
    } catch { setApplications(MOCK_EMPLOYER_APPLICATIONS); }
    finally { setLoading(false); }
  }, [jobId, statusFilter]);

  useEffect(() => { loadApps(); }, [loadApps]);

  const updateStatus = async (appId: string, status: AppStatus) => {
    setActioning(true);
    try {
      await api.patch(`/applications/${appId}/status`, { status });
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
      addToast({ type: 'success', title: `Status updated to ${status.toLowerCase().replace('_', ' ')}.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Update failed', description: extractError(err) });
    } finally { setActioning(false); }
  };

  const sendInvite = async () => {
    if (!inviteApp) return;
    setActioning(true);
    try {
      await api.post(`/applications/${inviteApp.id}/invite`, inviteDetails);
      setApplications((prev) => prev.map((a) => a.id === inviteApp.id ? { ...a, status: 'SHORTLISTED' } : a));
      addToast({ type: 'success', title: 'Interview invitation sent!', description: 'The applicant has been notified via SMS and email.' });
      setInviteApp(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Send failed', description: extractError(err) });
    } finally { setActioning(false); }
  };

  const confirmHire = async (app: Application) => {
    setActioning(true);
    try {
      await api.post('/placements', { applicationId: app.id });
      setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status: 'HIRED' } : a));
      addToast({ type: 'success', title: 'Placement confirmed!', description: 'A placement agreement has been generated and sent.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Confirm failed', description: extractError(err) });
    } finally { setActioning(false); }
  };

  // Group by status for kanban view
  const grouped = PIPELINE_STEPS.reduce<Record<string, Application[]>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {PIPELINE_STEPS.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : statusFilter ? (
        // List view when filtered
        <div className="space-y-3">
          {applications.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No applications in this status.</p>
          ) : applications.map((app) => <ApplicationCard key={app.id} app={app} onUpdateStatus={updateStatus} onInvite={setInviteApp} onHire={confirmHire} actioning={actioning} />)}
        </div>
      ) : (
        // Kanban view
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STEPS.map((status) => (
            <div key={status} className="shrink-0 w-64">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{status.replace('_', ' ')}</span>
                <span className="text-xs bg-muted rounded-full px-2 py-0.5">{grouped[status]?.length ?? 0}</span>
              </div>
              <div className="space-y-2">
                {(grouped[status] ?? []).map((app) => (
                  <ApplicationCard key={app.id} app={app} onUpdateStatus={updateStatus} onInvite={setInviteApp} onHire={confirmHire} actioning={actioning} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interview invite dialog */}
      <Dialog open={!!inviteApp} onOpenChange={() => setInviteApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Interview Invitation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Sending to <strong>{inviteApp?.applicant.fullName}</strong> for <strong>{inviteApp?.job.title}</strong></p>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Interview Date</Label>
                <Input type="date" value={inviteDetails.date} onChange={(e) => setInviteDetails((p) => ({ ...p, date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={inviteDetails.time} onChange={(e) => setInviteDetails((p) => ({ ...p, time: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Location / Meeting Link</Label>
              <Input value={inviteDetails.location} onChange={(e) => setInviteDetails((p) => ({ ...p, location: e.target.value }))} placeholder="Address or Google Meet link" className="mt-1" />
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea value={inviteDetails.notes} onChange={(e) => setInviteDetails((p) => ({ ...p, notes: e.target.value }))} placeholder="Any instructions for the candidate..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteApp(null)}>Cancel</Button>
            <Button onClick={sendInvite} loading={actioning}><Send className="h-4 w-4 mr-1" /> Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApplicationCard({ app, onUpdateStatus, onInvite, onHire, actioning, compact = false }:
  { app: Application; onUpdateStatus: (id: string, s: AppStatus) => void; onInvite: (a: Application) => void; onHire: (a: Application) => void; actioning: boolean; compact?: boolean }) {
  const nextStatus = NEXT_STATUS[app.status];

  return (
    <Card className={compact ? 'text-xs' : ''}>
      <CardContent className={cn('pt-3 pb-3', compact ? 'px-3' : 'px-4')}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <Link href={`/employer/candidates/${app.applicant.id}`}>
              <p className={cn('font-medium hover:text-primary transition-colors truncate', compact ? 'text-xs' : 'text-sm')}>{app.applicant.fullName}</p>
            </Link>
            {!compact && <p className="text-xs text-muted-foreground">{app.job.title}</p>}
          </div>
          {app.matchScore && (
            <Badge variant={app.matchScore >= 80 ? 'default' : 'secondary'} className="text-[10px] shrink-0">
              {Math.round(app.matchScore)}%
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">{formatDate(app.appliedAt)} · {app.applicant.completionScore}% profile</p>

        {!compact && (
          <div className="flex flex-wrap gap-1.5">
            {app.status === 'APPLIED' && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onInvite(app)}>
                <Send className="h-3 w-3 mr-1" /> Invite
              </Button>
            )}
            {nextStatus && app.status !== 'OFFER_MADE' && (
              <Button size="sm" className="h-7 text-xs" onClick={() => onUpdateStatus(app.id, nextStatus)} disabled={actioning}>
                <ChevronRight className="h-3 w-3 mr-1" /> {nextStatus.replace('_', ' ')}
              </Button>
            )}
            {app.status === 'OFFER_MADE' && (
              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => onHire(app)} disabled={actioning}>
                <UserCheck className="h-3 w-3 mr-1" /> Confirm Hire
              </Button>
            )}
            {app.status !== 'REJECTED' && app.status !== 'HIRED' && (
              <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => onUpdateStatus(app.id, 'REJECTED')} disabled={actioning}>
                Reject
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
