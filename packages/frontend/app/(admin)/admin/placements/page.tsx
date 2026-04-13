'use client';

import { useEffect, useState } from 'react';
import api, { extractError } from '@/lib/api';
import { MOCK_ADMIN_PLACEMENTS } from '@/lib/demo';
import { useToastStore } from '@/lib/store';

interface Placement {
  id: string;
  status: string;
  startDate: string;
  salaryAgreed: number;
  revenueShareRate: number;
  monthsRemaining: number;
  applicant: { fullName: string };
  application: { job: { title: string; employer: { companyName: string } } };
  _count: { payments: number };
  paidMonths: number;
}

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700' },
  COMPLETED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  TERMINATED: { bg: 'bg-red-50', text: 'text-red-700' },
  DISPUTED: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
};

export default function AdminPlacementsPage() {
  const { addToast } = useToastStore();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rateModal, setRateModal] = useState<{ id: string; rate: number } | null>(null);
  const [newRate, setNewRate] = useState('');
  const [updatingRate, setUpdatingRate] = useState(false);

  const load = async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const { data } = await api.get(`/admin/placements?${params}`);
      setPlacements(data.data ?? []);
    } catch { setPlacements(MOCK_ADMIN_PLACEMENTS); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    if (!confirm(`Change placement status to ${status}?`)) return;
    try {
      await api.patch(`/admin/placements/${id}/status`, { status });
      setPlacements((ps) => ps.map((p) => p.id === id ? { ...p, status } : p));
      addToast({ type: 'success', title: 'Placement status updated.' });
    } catch (err) {
      addToast({ type: 'error', title: extractError(err) });
    }
  };

  const handleUpdateRate = async () => {
    if (!rateModal) return;
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 0.03 || rate > 0.05) {
      addToast({ type: 'error', title: 'Rate must be between 3% and 5%.' });
      return;
    }
    setUpdatingRate(true);
    try {
      await api.patch(`/admin/placements/${rateModal.id}/rate`, { revenueShareRate: rate });
      setPlacements((ps) => ps.map((p) => p.id === rateModal.id ? { ...p, revenueShareRate: rate } : p));
      addToast({ type: 'success', title: 'Revenue share rate updated.' });
      setRateModal(null);
      setNewRate('');
    } catch (err) {
      addToast({ type: 'error', title: extractError(err) });
    } finally { setUpdatingRate(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Placements</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: placements.length, color: 'text-slate-900' },
          { label: 'Active', value: placements.filter((p) => p.status === 'ACTIVE').length, color: 'text-green-600' },
          { label: 'Completed', value: placements.filter((p) => p.status === 'COMPLETED').length, color: 'text-blue-600' },
          { label: 'Disputed', value: placements.filter((p) => p.status === 'DISPUTED').length, color: 'text-yellow-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-1">
        {['ALL', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'DISPUTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg ${statusFilter === s ? 'bg-[#1B4F72] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Applicant / Role</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Employer</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Salary</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Rate</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Progress</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : placements.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">No placements found.</td></tr>
            ) : placements.map((p) => {
              const colours = STATUS_COLOURS[p.status] ?? STATUS_COLOURS.ACTIVE;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{p.applicant?.fullName}</p>
                    <p className="text-xs text-slate-500">{p.application?.job?.title}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.application?.job?.employer?.companyName}</td>
                  <td className="px-4 py-3 text-right font-semibold">GHC {Number(p.salaryAgreed).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setRateModal({ id: p.id, rate: p.revenueShareRate }); setNewRate(String(p.revenueShareRate)); }}
                      className="text-[#1B4F72] font-semibold hover:underline"
                    >
                      {(p.revenueShareRate * 100).toFixed(0)}%
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-700">{p.paidMonths ?? 0}/6</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colours.bg} ${colours.text}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      {p.status === 'ACTIVE' && (
                        <>
                          <button onClick={() => handleStatusChange(p.id, 'COMPLETED')} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">Complete</button>
                          <button onClick={() => handleStatusChange(p.id, 'DISPUTED')} className="text-xs text-yellow-600 hover:text-yellow-800 font-semibold">Dispute</button>
                          <button onClick={() => handleStatusChange(p.id, 'TERMINATED')} className="text-xs text-red-500 hover:text-red-700 font-semibold">Terminate</button>
                        </>
                      )}
                      {p.status === 'DISPUTED' && (
                        <>
                          <button onClick={() => handleStatusChange(p.id, 'ACTIVE')} className="text-xs text-green-600 hover:text-green-800 font-semibold">Resolve</button>
                          <button onClick={() => handleStatusChange(p.id, 'TERMINATED')} className="text-xs text-red-500 hover:text-red-700 font-semibold">Terminate</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rate edit modal */}
      {rateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-slate-900">Adjust Revenue Share Rate</h3>
            <p className="text-sm text-slate-500">Enter new rate (3%–5%). This change is logged to the audit trail.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rate (decimal, e.g. 0.04 = 4%)</label>
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                step="0.01"
                min="0.03"
                max="0.05"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRateModal(null)} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
              <button
                onClick={handleUpdateRate}
                disabled={updatingRate}
                className="bg-[#1B4F72] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {updatingRate ? 'Saving...' : 'Save Rate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
