'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api, { extractError } from '@/lib/api';
import { MOCK_EMPLOYER_JOBS } from '@/lib/demo';
import { useToastStore } from '@/lib/store';
import { formatDate, getStatusBadgeVariant } from '@/lib/utils';
import { Plus, Eye, Edit, Pause, Play, X, Users } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  status: string;
  jobType: string;
  region: string;
  viewCount: number;
  applicationCount: number;
  isFeatured: boolean;
  createdAt: string;
  applicationDeadline?: string;
}

export default function EmployerJobsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmJob, setConfirmJob] = useState<{ id: string; action: string } | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    api.get(`/employers/jobs${statusFilter ? `?status=${statusFilter}` : ''}`).then(({ data }) => {
      setJobs(data.data ?? []);
    }).catch(() => setJobs(MOCK_EMPLOYER_JOBS)).finally(() => setLoading(false));
  }, [statusFilter]);

  const handleStatusChange = async (jobId: string, action: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED') => {
    setActioning(true);
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: action });
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: action } : j));
      addToast({ type: 'success', title: `Job ${action.toLowerCase()}.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Action failed', description: extractError(err) });
    } finally {
      setActioning(false);
      setConfirmJob(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Job Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">{jobs.length} listing{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild><Link href="/employer/jobs/new"><Plus className="h-4 w-4 mr-1" /> Post Job</Link></Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No job listings yet.</p>
          <Button asChild><Link href="/employer/jobs/new">Post Your First Job</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{job.title}</h3>
                      <Badge variant={getStatusBadgeVariant(job.status)} className="text-xs shrink-0">{job.status}</Badge>
                      {job.isFeatured && <Badge variant="warning" className="text-xs shrink-0">Featured</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{job.region} · {job.jobType.replace('_', ' ')} · Posted {formatDate(job.createdAt)}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{job.viewCount} views</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applicationCount} applications</span>
                      {job.applicationDeadline && <span className="text-orange-600">Closes {formatDate(job.applicationDeadline)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/employer/applications?jobId=${job.id}`}><Users className="h-4 w-4" /></Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/employer/jobs/${job.id}/edit`}><Edit className="h-4 w-4" /></Link>
                    </Button>
                    {job.status === 'ACTIVE' && (
                      <Button variant="ghost" size="sm" onClick={() => setConfirmJob({ id: job.id, action: 'PAUSED' })}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {job.status === 'PAUSED' && (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(job.id, 'ACTIVE')}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {job.status === 'DRAFT' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(job.id, 'ACTIVE')}>Publish</Button>
                    )}
                    {(job.status === 'ACTIVE' || job.status === 'PAUSED') && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setConfirmJob({ id: job.id, action: 'CLOSED' })}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!confirmJob} onOpenChange={() => setConfirmJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to {confirmJob?.action?.toLowerCase()} this job listing?
            {confirmJob?.action === 'CLOSED' && ' This will stop accepting new applications.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmJob(null)}>Cancel</Button>
            <Button
              variant={confirmJob?.action === 'CLOSED' ? 'destructive' : 'default'}
              loading={actioning}
              onClick={() => confirmJob && handleStatusChange(confirmJob.id, confirmJob.action as any)}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
