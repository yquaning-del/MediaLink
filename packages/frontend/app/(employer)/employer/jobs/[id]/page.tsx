'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api, { extractError } from '@/lib/api';
import { useToastStore } from '@/lib/store';
import {
  ArrowLeft, Edit, MapPin, Clock, Users, Calendar, Eye,
  Briefcase, GraduationCap, DollarSign,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  department?: string;
  jobType: string;
  location: string;
  region: string;
  remoteEligible: boolean;
  description: string;
  requiredSkills: string[];
  minExperienceYears: number;
  minEducationLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  applicationDeadline?: string;
  numberOfOpenings: number;
  status: string;
  viewCount: number;
  createdAt: string;
  _count: { applications: number };
  employer: { companyName: string; industryType: string };
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CLOSED: 'bg-red-100 text-red-800',
};

export default function EmployerJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then((res) => setJob(res.data.data))
      .catch((err) => addToast({ type: 'error', title: 'Failed to load job', description: extractError(err) }))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Job not found</h2>
        <Button asChild variant="outline"><Link href="/employer/jobs">Back to Jobs</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">{job.department || 'No department'} &middot; {job.employer.companyName}</p>
        </div>
        <Badge className={STATUS_COLOR[job.status] || 'bg-gray-100'}>{job.status}</Badge>
        <Button asChild>
          <Link href={`/employer/jobs/${id}/edit`}><Edit className="h-4 w-4 mr-2" /> Edit</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Applications', value: job._count.applications },
          { icon: Eye, label: 'Views', value: job.viewCount },
          { icon: Calendar, label: 'Openings', value: job.numberOfOpenings },
          { icon: Clock, label: 'Posted', value: new Date(job.createdAt).toLocaleDateString() },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-semibold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.description }} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Job Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>{job.jobType.replace('_', ' ')}</span></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{job.location}, {job.region}</span></div>
              {job.remoteEligible && <Badge variant="outline">Remote Eligible</Badge>}
              {job.minEducationLevel && <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /><span>{job.minEducationLevel}</span></div>}
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{job.minExperienceYears}+ years experience</span></div>
              {(job.salaryMin || job.salaryMax) && (
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /><span>GHC {job.salaryMin?.toLocaleString()} – {job.salaryMax?.toLocaleString()}</span></div>
              )}
              {job.applicationDeadline && (
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</span></div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Required Skills</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {job.requiredSkills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
