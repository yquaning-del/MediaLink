'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api, { extractError } from '@/lib/api';
import { useToastStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MapPin, Clock, DollarSign, Users, Calendar, Building2, ArrowLeft, Star } from 'lucide-react';

interface JobDetail {
  id: string;
  title: string;
  description: string;
  department?: string;
  jobType: string;
  location: string;
  region: string;
  remoteEligible: boolean;
  requiredSkills: string[];
  minExperienceYears: number;
  minEducationLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  applicationDeadline?: string;
  numberOfOpenings: number;
  isFeatured: boolean;
  viewCount: number;
  employer: { companyName: string; industryType: string; address: string };
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`).then(({ data }) => setJob(data.data)).finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post('/applications', { jobId: id, coverNote: coverNote || undefined });
      setApplied(true);
      setApplyOpen(false);
      addToast({ type: 'success', title: 'Application submitted!', description: 'The employer has been notified.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Application failed', description: extractError(err) });
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="p-6 flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!job) return <div className="p-6 text-center text-muted-foreground">Job not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {job.isFeatured && (
                      <Badge variant="warning" className="text-xs">
                        <Star className="h-3 w-3 mr-1" /> Featured
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{job.employer.industryType}</Badge>
                  </div>
                  <h1 className="text-2xl font-bold">{job.title}</h1>
                  <p className="text-muted-foreground mt-1">{job.employer.companyName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}, {job.region}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{job.jobType.replace('_', ' ')}</span>
                {(job.salaryMin || job.salaryMax) && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    {job.salaryMin ? formatCurrency(job.salaryMin) : ''}
                    {job.salaryMin && job.salaryMax ? ' – ' : ''}
                    {job.salaryMax ? formatCurrency(job.salaryMax) : ''}/month
                  </span>
                )}
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{job.numberOfOpenings} opening{job.numberOfOpenings !== 1 ? 's' : ''}</span>
                {job.applicationDeadline && (
                  <span className="flex items-center gap-1.5 text-orange-600"><Calendar className="h-4 w-4" />Closes {formatDate(job.applicationDeadline)}</span>
                )}
              </div>

              {job.remoteEligible && <Badge variant="success" className="mb-4">Remote Eligible</Badge>}

              <div
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </CardContent>
          </Card>

          {/* Required Skills */}
          <Card>
            <CardHeader><CardTitle className="text-base">Required Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s) => (
                  <span key={s} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{s}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {applied ? (
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 text-xl">✓</span>
                  </div>
                  <p className="font-medium text-green-700">Application Submitted</p>
                  <p className="text-xs text-muted-foreground mt-1">Track it in My Applications.</p>
                </div>
              ) : (
                <Button className="w-full" size="lg" onClick={() => setApplyOpen(true)}>Apply Now</Button>
              )}
              <Button variant="outline" className="w-full" size="sm" onClick={() => router.push('/applicant/applications')}>
                View My Applications
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">About the Employer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{job.employer.companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{job.employer.address}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Requirements</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Min experience: <strong>{job.minExperienceYears}+ years</strong></p>
              {job.minEducationLevel && <p>Education: <strong>{job.minEducationLevel}</strong></p>}
              {job.department && <p>Department: <strong>{job.department}</strong></p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {job.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Your profile and CV will be shared with {job.employer.companyName}.</p>
            <div>
              <Label htmlFor="coverNote">Cover Note <span className="text-muted-foreground text-xs">(optional, max 500 characters)</span></Label>
              <Textarea
                id="coverNote"
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value.slice(0, 500))}
                placeholder="Briefly explain why you're a great fit for this role..."
                className="mt-1 min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground text-right mt-0.5">{coverNote.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} loading={applying}>Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
