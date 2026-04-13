'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { MOCK_EMPLOYER_ANALYTICS } from '@/lib/demo';
import { formatDate, cn } from '@/lib/utils';
import { Briefcase, Users, FileText, TrendingUp, Plus, ChevronRight, AlertTriangle } from 'lucide-react';

interface EmployerAnalytics {
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  hired: number;
  totalPlacements: number;
  recentJobs: { id: string; title: string; status: string; applicationCount: number; viewCount: number; createdAt: string }[];
  recentApplications: { id: string; applicant: { fullName: string }; job: { title: string }; status: string; appliedAt: string }[];
  kybStatus: string;
}

const STATUS_COLOURS: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-800', SHORTLISTED: 'bg-yellow-100 text-yellow-800',
  INTERVIEWED: 'bg-purple-100 text-purple-800', OFFER_MADE: 'bg-orange-100 text-orange-800',
  HIRED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800',
};

export default function EmployerDashboard() {
  const [analytics, setAnalytics] = useState<EmployerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/employers/analytics')
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => setAnalytics(MOCK_EMPLOYER_ANALYTICS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-16 gap-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-red-600 font-medium">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employer Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your job listings and hiring pipeline.</p>
        </div>
        <Button asChild>
          <Link href="/employer/jobs/new"><Plus className="h-4 w-4 mr-1" /> Post a Job</Link>
        </Button>
      </div>

      {/* KYB pending warning */}
      {analytics?.kybStatus === 'PENDING' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Your company is pending verification</p>
            <p className="text-xs text-amber-700 mt-0.5">Admin is reviewing your registration. You&apos;ll receive an email once approved to post jobs and access candidates.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: analytics?.activeJobs ?? 0, icon: Briefcase, href: '/employer/jobs', colour: 'text-blue-600 bg-blue-50' },
          { label: 'Total Applications', value: analytics?.totalApplications ?? 0, icon: FileText, href: '/employer/applications', colour: 'text-purple-600 bg-purple-50' },
          { label: 'Shortlisted', value: analytics?.shortlisted ?? 0, icon: Users, href: '/employer/applications?status=SHORTLISTED', colour: 'text-yellow-600 bg-yellow-50' },
          { label: 'Hires Made', value: analytics?.hired ?? 0, icon: TrendingUp, href: '/employer/placements', colour: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, href, colour }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className={cn('h-10 w-10 rounded-full flex items-center justify-center mb-3', colour)}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Job Listings</CardTitle>
              <Link href="/employer/jobs" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!analytics?.recentJobs?.length ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No job listings yet.</p>
                <Button asChild size="sm"><Link href="/employer/jobs/new">Post Your First Job</Link></Button>
              </div>
            ) : analytics.recentJobs.map((job) => (
              <Link key={job.id} href={`/employer/jobs/${job.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.applicationCount} applications · {job.viewCount} views</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === 'ACTIVE' ? 'default' : 'outline'} className="text-xs">{job.status}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Applications</CardTitle>
              <Link href="/employer/applications" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!analytics?.recentApplications?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No applications received yet.</p>
            ) : analytics.recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{app.applicant?.fullName ?? 'Applicant'}</p>
                  <p className="text-xs text-muted-foreground">{app.job?.title} · {formatDate(app.appliedAt)}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', STATUS_COLOURS[app.status] ?? 'bg-gray-100 text-gray-700')}>
                  {app.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
