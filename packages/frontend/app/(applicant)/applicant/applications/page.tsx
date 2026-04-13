'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { MOCK_APPLICANT_APPLICATIONS } from '@/lib/demo';
import { formatDate, getStatusBadgeVariant } from '@/lib/utils';
import { ChevronRight, FileText } from 'lucide-react';

interface Application {
  id: string;
  status: string;
  matchScore?: number;
  appliedAt: string;
  coverNote?: string;
  job: { id: string; title: string; location: string; jobType: string; employer: { companyName: string } };
}

const STATUS_STEPS = ['APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'OFFER_MADE', 'HIRED'];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applicants/applications').then(({ data }) => setApplications(data.data ?? [])).catch(() => setApplications(MOCK_APPLICANT_APPLICATIONS)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-muted-foreground text-sm mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No applications yet.</p>
          <Link href="/applicant/jobs" className="text-primary text-sm hover:underline mt-2 inline-block">Browse Jobs</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const stepIndex = STATUS_STEPS.indexOf(app.status);
            const isRejected = app.status === 'REJECTED';

            return (
              <Card key={app.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{app.job.title}</h3>
                        <Badge variant={getStatusBadgeVariant(app.status)} className="text-xs shrink-0">
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{app.job.employer.companyName} · {app.job.location}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Applied {formatDate(app.appliedAt)}</p>
                    </div>
                    {app.matchScore && (
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Match score</p>
                        <p className="text-lg font-bold text-primary">{Math.round(app.matchScore)}%</p>
                      </div>
                    )}
                  </div>

                  {/* Progress pipeline */}
                  {!isRejected && (
                    <div className="mt-4">
                      <div className="flex items-center">
                        {STATUS_STEPS.map((s, i) => (
                          <div key={s} className="flex items-center flex-1">
                            <div className={`h-2 w-2 rounded-full shrink-0 ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`} />
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`h-0.5 flex-1 ${i < stepIndex ? 'bg-primary' : 'bg-muted'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        {STATUS_STEPS.map((s) => (
                          <span key={s} className="text-[10px] text-muted-foreground capitalize">{s.toLowerCase().replace('_', ' ')}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {app.coverNote && (
                    <p className="mt-3 text-xs text-muted-foreground italic border-l-2 border-muted pl-3">
                      &quot;{app.coverNote.slice(0, 120)}{app.coverNote.length > 120 ? '…' : ''}&quot;
                    </p>
                  )}

                  <div className="mt-3">
                    <Link href={`/applicant/jobs/${app.job.id}`} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                      View job <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
