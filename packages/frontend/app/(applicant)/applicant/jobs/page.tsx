'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { MOCK_APPLICANT_JOBS } from '@/lib/demo';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, MapPin, Clock, DollarSign, Star, ChevronRight } from 'lucide-react';

const GHANA_REGIONS = ['Greater Accra', 'Ashanti', 'Northern', 'Eastern', 'Western', 'Volta', 'Central', 'Brong-Ahafo', 'Upper East', 'Upper West'];
const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full-Time' },
  { value: 'PART_TIME', label: 'Part-Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'COMMISSION_BASED', label: 'Commission' },
];

interface Job {
  id: string;
  title: string;
  employer: { companyName: string; industryType: string };
  region: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills: string[];
  isFeatured: boolean;
  applicationDeadline?: string;
  viewCount: number;
  createdAt: string;
}

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [jobType, setJobType] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) params.set('search', search);
      if (region) params.set('region', region);
      if (jobType) params.set('jobType', jobType);
      const { data } = await api.get(`/jobs?${params}`);
      setJobs(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch { setJobs(MOCK_APPLICANT_JOBS); setTotal(MOCK_APPLICANT_JOBS.length); }
    finally { setLoading(false); }
  }, [page, search, region, jobType]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchJobs(); };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Browse Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} media sales roles across Ghana</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, skills, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={region} onValueChange={(v) => { setRegion(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Regions</SelectItem>
            {GHANA_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={jobType} onValueChange={(v) => { setJobType(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Job Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {JOB_TYPES.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="submit">Search</Button>
      </form>

      {/* Job Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No jobs found. Try adjusting your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/applicant/jobs/${job.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-4 pb-4 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {job.isFeatured && (
                          <Badge variant="warning" className="text-[10px] py-0">
                            <Star className="h-3 w-3 mr-0.5" /> Featured
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] py-0">{job.employer?.industryType}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{job.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.employer?.companyName}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground my-3">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.region}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.jobType.replace('_', ' ')}</span>
                    {(job.salaryMin || job.salaryMax) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {job.salaryMin ? formatCurrency(job.salaryMin) : ''}{job.salaryMin && job.salaryMax ? '–' : ''}{job.salaryMax ? formatCurrency(job.salaryMax) : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 flex-1">
                    {job.requiredSkills?.slice(0, 4).map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-muted rounded-full text-[11px]">{s}</span>
                    ))}
                    {(job.requiredSkills?.length ?? 0) > 4 && (
                      <span className="px-2 py-0.5 bg-muted rounded-full text-[11px]">+{job.requiredSkills.length - 4}</span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Posted {formatDate(job.createdAt)}</span>
                    {job.applicationDeadline && <span className="text-orange-600">Closes {formatDate(job.applicationDeadline)}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
