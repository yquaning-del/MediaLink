'use client';

import { useEffect, useState } from 'react';
import api, { extractError } from '@/lib/api';
import { MOCK_ADMIN_JOBS } from '@/lib/demo';
import { useToastStore } from '@/lib/store';

interface Job {
  id: string;
  title: string;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  employer: { companyName: string };
  _count: { applications: number };
}

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700' },
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-600' },
  PAUSED: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  CLOSED: { bg: 'bg-red-50', text: 'text-red-700' },
};

export default function AdminJobsPage() {
  const { addToast } = useToastStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [moderating, setModerating] = useState<string | null>(null);

  const load = async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/jobs?${params}`);
      setJobs(data.data ?? []);
    } catch { setJobs(MOCK_ADMIN_JOBS); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleModerate = async (jobId: string, action: 'ACTIVE' | 'PAUSED' | 'CLOSED') => {
    const labels: Record<string, string> = { ACTIVE: 'activate', PAUSED: 'pause', CLOSED: 'close' };
    if (!confirm(`Are you sure you want to ${labels[action]} this job listing?`)) return;
    setModerating(jobId);
    try {
      await api.patch(`/admin/jobs/${jobId}/moderate`, { status: action });
      setJobs((js) => js.map((j) => j.id === jobId ? { ...j, status: action } : j));
      addToast({ type: 'success', title: `Job listing ${labels[action]}d.` });
    } catch (err) {
      addToast({ type: 'error', title: extractError(err) });
    } finally { setModerating(null); }
  };

  const handleToggleFeatured = async (job: Job) => {
    try {
      await api.patch(`/admin/jobs/${job.id}/moderate`, { isFeatured: !job.isFeatured });
      setJobs((js) => js.map((j) => j.id === job.id ? { ...j, isFeatured: !j.isFeatured } : j));
      addToast({ type: 'success', title: `Job ${job.isFeatured ? 'unfeatured' : 'featured'}.` });
    } catch (err) {
      addToast({ type: 'error', title: extractError(err) });
    }
  };

  const filtered = jobs.filter((j) =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.employer.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Job Moderation</h1>
        <p className="text-sm text-slate-500">{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search title or employer..."
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#1B4F72]/30"
        />
        <div className="flex gap-1">
          {['ALL', 'ACTIVE', 'PAUSED', 'DRAFT', 'CLOSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg ${statusFilter === s ? 'bg-[#1B4F72] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Job / Employer</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Views</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Applications</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Posted</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No jobs found.</td></tr>
            ) : filtered.map((job) => {
              const colours = STATUS_COLOURS[job.status] ?? STATUS_COLOURS.DRAFT;
              return (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.employer.companyName}</p>
                    {job.isFeatured && <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded">Featured</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colours.bg} ${colours.text}`}>{job.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{job.viewCount}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{job._count?.applications ?? 0}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(job.createdAt).toLocaleDateString('en-GH')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleToggleFeatured(job)}
                        className={`text-xs font-semibold px-2 py-1 rounded ${job.isFeatured ? 'text-amber-600 hover:text-amber-800' : 'text-slate-400 hover:text-amber-600'}`}
                      >
                        {job.isFeatured ? '★ Unfeature' : '☆ Feature'}
                      </button>
                      {job.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleModerate(job.id, 'PAUSED')}
                          disabled={moderating === job.id}
                          className="text-xs font-semibold text-yellow-600 hover:text-yellow-800 disabled:opacity-60"
                        >
                          Pause
                        </button>
                      )}
                      {job.status === 'PAUSED' && (
                        <button
                          onClick={() => handleModerate(job.id, 'ACTIVE')}
                          disabled={moderating === job.id}
                          className="text-xs font-semibold text-green-600 hover:text-green-800 disabled:opacity-60"
                        >
                          Activate
                        </button>
                      )}
                      {job.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleModerate(job.id, 'CLOSED')}
                          disabled={moderating === job.id}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-60"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
