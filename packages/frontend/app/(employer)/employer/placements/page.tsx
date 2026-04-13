'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MOCK_EMPLOYER_PLACEMENTS } from '@/lib/demo';

interface Placement {
  id: string;
  startDate: string;
  salaryAgreed: number;
  revenueShareRate: number;
  monthsRemaining: number;
  status: string;
  applicant: { fullName: string; user: { email: string } };
  application: { job: { title: string } };
  schedules: { monthNumber: number; dueDate: string; amount: number; status: string }[];
}

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700' },
  COMPLETED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  TERMINATED: { bg: 'bg-red-50', text: 'text-red-700' },
  DISPUTED: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
};

export default function EmployerPlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/placements/employer').then(({ data }) => setPlacements(data.data ?? [])).catch(() => setPlacements(MOCK_EMPLOYER_PLACEMENTS)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Placements</h1>
        <div className="flex gap-3 text-sm">
          <div className="text-center">
            <p className="font-bold text-[#1B4F72] text-xl">{placements.filter((p) => p.status === 'ACTIVE').length}</p>
            <p className="text-slate-500">Active</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-green-600 text-xl">{placements.filter((p) => p.status === 'COMPLETED').length}</p>
            <p className="text-slate-500">Completed</p>
          </div>
        </div>
      </div>

      {placements.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="font-semibold text-slate-700 mb-1">No placements yet</p>
          <p className="text-sm text-slate-500">Confirm hires in your hiring pipeline to create placement records.</p>
        </div>
      ) : (
        placements.map((placement) => {
          const colours = STATUS_COLOURS[placement.status] ?? STATUS_COLOURS.ACTIVE;
          const paidCount = placement.schedules?.filter((s) => s.status === 'SUCCESS').length ?? 0;
          const totalMonths = placement.schedules?.length ?? 6;

          return (
            <div key={placement.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">{placement.applicant?.fullName}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{placement.application?.job?.title}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colours.bg} ${colours.text}`}>
                    {placement.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-4 text-center bg-slate-50 rounded-lg p-3">
                  <div>
                    <p className="font-bold text-slate-800">GHC {Number(placement.salaryAgreed).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Monthly Salary</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{(placement.revenueShareRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">Revenue Share</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{paidCount}/{totalMonths}</p>
                    <p className="text-xs text-slate-500">Payments Made</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{placement.monthsRemaining}</p>
                    <p className="text-xs text-slate-500">Months Left</p>
                  </div>
                </div>
              </div>

              {/* Schedule timeline */}
              <div className="p-5">
                <div className="flex gap-1">
                  {placement.schedules?.map((s) => (
                    <div
                      key={s.monthNumber}
                      title={`Month ${s.monthNumber} — ${s.status}`}
                      className={`flex-1 h-2 rounded-full ${
                        s.status === 'SUCCESS' ? 'bg-green-500' :
                        s.status === 'FAILED' ? 'bg-red-400' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Month 1</span>
                  <span>{paidCount} of {totalMonths} paid</span>
                  <span>Month {totalMonths}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
