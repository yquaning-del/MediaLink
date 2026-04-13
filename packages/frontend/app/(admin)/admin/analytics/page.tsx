'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MOCK_ADMIN_ANALYTICS_FULL } from '@/lib/demo';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalApplicants: number;
    totalEmployers: number;
    totalJobs: number;
    totalPlacements: number;
    totalRevenue: number;
    avgDaysToPlacement: number;
    conversionRate: number;
  };
  monthlyTrend: { month: string; applicants: number; placements: number; revenue: number }[];
  applicantsByRegion: { region: string; count: number }[];
  jobsByIndustry: { industry: string; count: number }[];
  applicationConversion: { stage: string; count: number }[];
}

const BRAND_COLOURS = ['#1B4F72', '#2E86C1', '#F39C12', '#27AE60', '#E74C3C', '#8E44AD'];

const KPI_CARDS = [
  { key: 'totalApplicants', label: 'Total Applicants', format: (v: number) => v.toLocaleString(), icon: '👥' },
  { key: 'totalEmployers', label: 'Media Houses', format: (v: number) => v.toLocaleString(), icon: '🏢' },
  { key: 'totalJobs', label: 'Active Jobs', format: (v: number) => v.toLocaleString(), icon: '💼' },
  { key: 'totalPlacements', label: 'Total Placements', format: (v: number) => v.toLocaleString(), icon: '🤝' },
  { key: 'totalRevenue', label: 'Total Revenue', format: (v: number) => `GHC ${v.toLocaleString()}`, icon: '💰' },
  { key: 'conversionRate', label: 'Conversion Rate', format: (v: number) => `${v.toFixed(1)}%`, icon: '📊' },
  { key: 'avgDaysToPlacement', label: 'Avg Days to Placement', format: (v: number) => `${Math.round(v)} days`, icon: '⏱️' },
];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30d' | '90d' | '6m' | '1y'>('90d');

  useEffect(() => {
    api.get(`/admin/analytics/overview?period=${period}`).then(({ data: res }) => setData(res.data)).catch(() => setData(MOCK_ADMIN_ANALYTICS_FULL)).finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        <div className="flex gap-1">
          {([['30d', '30 days'], ['90d', '90 days'], ['6m', '6 months'], ['1y', '1 year']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${period === val ? 'bg-[#1B4F72] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
          <div key={card.key} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl mb-1">{card.icon}</div>
            <p className="text-2xl font-bold text-[#1B4F72]">
              {card.format(data?.overview?.[card.key as keyof typeof data.overview] as number ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-900 mb-4">Monthly Trend</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data?.monthlyTrend ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="applicants" stroke="#1B4F72" strokeWidth={2} dot={false} name="Applicants" />
            <Line type="monotone" dataKey="placements" stroke="#27AE60" strokeWidth={2} dot={false} name="Placements" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-4">Monthly Revenue (GHC)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.monthlyTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `GHC ${v.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#F39C12" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Applicants by Region */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-4">Applicants by Region</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data?.applicantsByRegion ?? []}
                dataKey="count"
                nameKey="region"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ region, percent }) => `${region} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data?.applicantsByRegion?.map((_, i) => (
                  <Cell key={i} fill={BRAND_COLOURS[i % BRAND_COLOURS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Jobs by Industry */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-4">Jobs by Industry Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.jobsByIndustry ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="industry" tick={{ fontSize: 11 }} width={70} />
              <Tooltip />
              <Bar dataKey="count" fill="#1B4F72" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Application Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-4">Application Funnel</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.applicationConversion ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data?.applicationConversion?.map((_, i) => (
                  <Cell key={i} fill={BRAND_COLOURS[i % BRAND_COLOURS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
