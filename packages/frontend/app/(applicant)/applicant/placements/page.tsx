'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MOCK_APPLICANT_PLACEMENTS } from '@/lib/demo';

interface Placement {
  id: string;
  startDate: string;
  salaryAgreed: number;
  revenueShareRate: number;
  monthsRemaining: number;
  status: string;
  contractUrl?: string;
  application: {
    job: { title: string; employer: { companyName: string } };
  };
  schedules: { id: string; monthNumber: number; dueDate: string; amount: number; status: string }[];
}

const STATUS_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  COMPLETED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  TERMINATED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  DISPUTED: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
};

export default function ApplicantPlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/placements/mine').then(({ data }) => setPlacements(data.data ?? [])).catch(() => setPlacements(MOCK_APPLICANT_PLACEMENTS)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72]" />
      </div>
    );
  }

  if (placements.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Placements</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <p className="font-semibold text-slate-700 mb-1">No placements yet</p>
          <p className="text-sm text-slate-500">Once you&apos;re hired and a placement is confirmed, it will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Placements</h1>

      {placements.map((placement) => {
        const colours = STATUS_COLOURS[placement.status] ?? STATUS_COLOURS.ACTIVE;
        const paidCount = placement.schedules?.filter((s) => s.status === 'SUCCESS').length ?? 0;
        const totalSchedules = placement.schedules?.length ?? 6;
        const progressPct = Math.round((paidCount / totalSchedules) * 100);

        return (
          <div key={placement.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[#1B4F72] p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-lg">{placement.application?.job?.title}</h2>
                  <p className="text-blue-200 text-sm mt-0.5">{placement.application?.job?.employer?.companyName}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${colours.bg} ${colours.text}`}>
                  {placement.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">GHC {Number(placement.salaryAgreed).toLocaleString()}</p>
                  <p className="text-xs text-blue-200 mt-0.5">Monthly Salary</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{(placement.revenueShareRate * 100).toFixed(0)}%</p>
                  <p className="text-xs text-blue-200 mt-0.5">Revenue Share</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{placement.monthsRemaining}</p>
                  <p className="text-xs text-blue-200 mt-0.5">Months Left</p>
                </div>
              </div>
            </div>

            {/* Revenue share progress */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Revenue Share Progress</span>
                <span className="text-sm text-slate-500">{paidCount} / {totalSchedules} payments</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment Schedule</h3>
              <div className="space-y-2">
                {placement.schedules?.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Month {s.monthNumber}</p>
                      <p className="text-xs text-slate-500">
                        Due {new Date(s.dueDate).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-800">GHC {Number(s.amount).toLocaleString()}</span>
                      {s.status === 'SUCCESS' ? (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Paid</span>
                      ) : s.status === 'FAILED' ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Failed</span>
                      ) : (
                        <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {placement.contractUrl && (
              <div className="px-5 pb-5">
                <a
                  href={placement.contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#1B4F72] font-semibold hover:underline"
                >
                  <span>📄</span> View Placement Agreement
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
