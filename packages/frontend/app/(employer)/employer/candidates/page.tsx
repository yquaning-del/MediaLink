'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { MOCK_EMPLOYER_CANDIDATES } from '@/lib/demo';
import { getInitials, cn } from '@/lib/utils';
import { Search, MapPin, Briefcase, ChevronRight, Star } from 'lucide-react';

const GHANA_REGIONS = ['Greater Accra', 'Ashanti', 'Northern', 'Eastern', 'Western', 'Volta', 'Central'];

interface Candidate {
  id: string;
  fullName: string;
  profilePhotoUrl?: string;
  region?: string;
  completionScore: number;
  skills: string[];
  preferredJobTypes: string[];
  workExperiences: { role: string; companyName: string; isCurrent: boolean }[];
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) q.set('search', search);
      if (region) q.set('region', region);
      const { data } = await api.get(`/applicants/search?${q}`);
      setCandidates(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch { setCandidates(MOCK_EMPLOYER_CANDIDATES); setTotal(MOCK_EMPLOYER_CANDIDATES.length); }
    finally { setLoading(false); }
  }, [page, search, region]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Candidate Search</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} verified media sales professionals</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchCandidates(); }} className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={region} onValueChange={(v) => { setRegion(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Regions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Regions</SelectItem>
            {GHANA_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="submit">Search</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No candidates found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map((c) => {
            const currentRole = c.workExperiences?.find((w) => w.isCurrent);
            return (
              <Link key={c.id} href={`/employer/candidates/${c.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={c.profilePhotoUrl} alt={c.fullName} />
                        <AvatarFallback className="bg-brand/10 text-brand font-semibold text-sm">
                          {getInitials(c.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{c.fullName}</p>
                        {currentRole && <p className="text-xs text-muted-foreground truncate">{currentRole.role} · {currentRole.companyName}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Profile score</span>
                        <span className={cn('font-semibold', c.completionScore >= 80 ? 'text-green-600' : c.completionScore >= 60 ? 'text-yellow-600' : 'text-red-500')}>
                          {c.completionScore}%
                        </span>
                      </div>
                      <Progress value={c.completionScore} className="h-1.5" />
                    </div>

                    {c.region && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3" />{c.region}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {c.skills?.slice(0, 4).map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-muted rounded-full text-[11px]">{s}</span>
                      ))}
                      {(c.skills?.length ?? 0) > 4 && (
                        <span className="px-2 py-0.5 bg-muted rounded-full text-[11px]">+{c.skills.length - 4}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

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
