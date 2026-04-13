'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { MOCK_APPLICANT_DATA } from '@/lib/demo';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDate, getCompletionColor, cn } from '@/lib/utils';
import { Briefcase, FileText, CreditCard, TrendingUp, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface DashboardData {
  profile: { completionScore: number; fullName: string; profilePhotoUrl?: string };
  matchedJobs: { id: string; title: string; employer: { companyName: string }; region: string; jobType: string; matchScore?: number }[];
  recentApplications: { id: string; job: { title: string; employer: { companyName: string } }; status: string; appliedAt: string }[];
  pendingPayments: { id: string; type: string; amount: number; dueDate: string }[];
}

const STATUS_COLOURS: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-800',
  SHORTLISTED: 'bg-yellow-100 text-yellow-800',
  INTERVIEWED: 'bg-purple-100 text-purple-800',
  OFFER_MADE: 'bg-orange-100 text-orange-800',
  HIRED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function ApplicantDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, matchesRes, appsRes] = await Promise.all([
          api.get('/applicants/profile'),
          api.get('/applicants/matches?limit=5'),
          api.get('/applicants/applications?limit=5'),
        ]);
        setData({
          profile: profileRes.data.data,
          matchedJobs: matchesRes.data.data ?? [],
          recentApplications: appsRes.data.data ?? [],
          pendingPayments: [],
        });
      } catch {
        setData(MOCK_APPLICANT_DATA);
      }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-red-600 font-medium">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const score = data?.profile?.completionScore ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {data?.profile?.fullName?.split(' ')[0] ?? 'there'}!</h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s a snapshot of your job search activity.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/applicant/jobs">Browse All Jobs <ChevronRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </div>

      {/* Profile completion alert */}
      {score < 60 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Your profile is {score}% complete</p>
            <p className="text-xs text-amber-700 mt-0.5">Complete at least 60% to appear in employer searches and start applying for jobs.</p>
          </div>
          <Button asChild size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700">
            <Link href="/applicant/profile/build">Complete Profile</Link>
          </Button>
        </div>
      )}

      {/* Profile score card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Profile Completion</CardTitle>
            <span className={cn('text-2xl font-bold', getCompletionColor(score))}>{score}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={score} className={cn('h-3', score >= 80 ? '[&>div]:bg-green-500' : score >= 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500')} />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span className="text-amber-600 font-medium">60% visibility threshold</span>
            <span>100%</span>
          </div>
          <Button asChild variant="link" className="p-0 h-auto text-xs mt-2">
            <Link href="/applicant/profile/build">Edit profile <ChevronRight className="h-3 w-3 ml-0.5" /></Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Matched Jobs', value: data?.matchedJobs?.length ?? 0, icon: Briefcase, href: '/applicant/jobs', colour: 'text-blue-600 bg-blue-50' },
          { label: 'Applications', value: data?.recentApplications?.length ?? 0, icon: FileText, href: '/applicant/applications', colour: 'text-purple-600 bg-purple-50' },
          { label: 'Profile Score', value: `${score}%`, icon: TrendingUp, href: '/applicant/profile/build', colour: 'text-green-600 bg-green-50' },
          { label: 'Pending Payments', value: data?.pendingPayments?.length ?? 0, icon: CreditCard, href: '/applicant/payments', colour: 'text-orange-600 bg-orange-50' },
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
        {/* Matched Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Matched Jobs</CardTitle>
              <Link href="/applicant/jobs" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.matchedJobs?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No job matches yet. Complete your profile to get matched.</p>
            ) : data?.matchedJobs?.map((job) => (
              <Link key={job.id} href={`/applicant/jobs/${job.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.employer?.companyName} · {job.region}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {job.matchScore && (
                      <Badge variant={job.matchScore >= 80 ? 'default' : 'secondary'} className="text-xs">
                        {Math.round(job.matchScore)}% match
                      </Badge>
                    )}
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
              <Link href="/applicant/applications" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.recentApplications?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No applications yet. Start applying to jobs!</p>
            ) : data?.recentApplications?.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{app.job?.title}</p>
                  <p className="text-xs text-muted-foreground">{app.job?.employer?.companyName} · {formatDate(app.appliedAt)}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-3', STATUS_COLOURS[app.status] ?? 'bg-gray-100 text-gray-700')}>
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
