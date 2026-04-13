'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { MOCK_ADMIN_ANALYTICS } from '@/lib/demo';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Building2, Briefcase, MapPin, DollarSign, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminAnalytics {
  totalApplicants: number;
  totalEmployers: number;
  activeJobs: number;
  totalPlacements: number;
  activePlacements: number;
  totalRevenue: number;
  revenueThisMonth: number;
  pendingKyb: number;
  overduePayments: number;
  conversionRate: number;
  avgDaysToPlacement: number;
  monthlyTrend: { month: string; applicants: number; placements: number; revenue: number }[];
}

const KPI = [
  { key: 'totalApplicants', label: 'Total Applicants', icon: Users, colour: 'text-blue-600 bg-blue-50', href: '/admin/users/applicants' },
  { key: 'totalEmployers', label: 'Media Houses', icon: Building2, colour: 'text-purple-600 bg-purple-50', href: '/admin/users/employers' },
  { key: 'activeJobs', label: 'Active Jobs', icon: Briefcase, colour: 'text-green-600 bg-green-50', href: '/admin/jobs' },
  { key: 'activePlacements', label: 'Active Placements', icon: MapPin, colour: 'text-orange-600 bg-orange-50', href: '/admin/placements' },
];

export default function AdminDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(({ data: res }) => setData(res.data))
      .catch(() => setData(MOCK_ADMIN_ANALYTICS))
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
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/payments/reports">Export Report</Link>
        </Button>
      </div>

      {/* Alerts */}
      {((data?.pendingKyb ?? 0) > 0 || (data?.overduePayments ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(data?.pendingKyb ?? 0) > 0 && (
            <Link href="/admin/users/employers?status=PENDING">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 hover:bg-amber-100 transition-colors">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-900">{data?.pendingKyb} pending KYB verification{(data?.pendingKyb ?? 0) > 1 ? 's' : ''}</p>
                  <p className="text-xs text-amber-700">Click to review employer applications</p>
                </div>
              </div>
            </Link>
          )}
          {(data?.overduePayments ?? 0) > 0 && (
            <Link href="/admin/payments?status=PENDING">
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-900">{data?.overduePayments} overdue payment{(data?.overduePayments ?? 0) > 1 ? 's' : ''}</p>
                  <p className="text-xs text-red-700">Click to view defaulters</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI.map(({ key, label, icon: Icon, colour, href }) => (
          <Link key={key} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-3 ${colour}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{(data as any)?.[key] ?? 0}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="h-10 w-10 rounded-full flex items-center justify-center mb-3 text-green-600 bg-green-50">
              <DollarSign className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(data?.totalRevenue ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Total Platform Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="h-10 w-10 rounded-full flex items-center justify-center mb-3 text-brand bg-brand/10">
              <DollarSign className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(data?.revenueThisMonth ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Revenue This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="h-10 w-10 rounded-full flex items-center justify-center mb-3 text-purple-600 bg-purple-50">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{data?.avgDaysToPlacement ?? 0} days</p>
            <p className="text-xs text-muted-foreground">Avg. Time to Placement</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      {(data?.monthlyTrend?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="applicants" name="Applicants" stroke="#1B4F72" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="placements" name="Placements" stroke="#27AE60" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (GHC)" stroke="#F39C12" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
