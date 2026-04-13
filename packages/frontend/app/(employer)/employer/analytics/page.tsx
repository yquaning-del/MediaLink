'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { MOCK_EMPLOYER_ANALYTICS_FULL } from '@/lib/demo';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Briefcase, Users, TrendingUp, Eye } from 'lucide-react';

interface Analytics {
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  hired: number;
  totalPlacements: number;
  jobPerformance: { title: string; views: number; applications: number }[];
  applicationsByStatus: { name: string; value: number }[];
  conversionRate: number;
}

const COLOURS = ['#1B4F72', '#2E86C1', '#F39C12', '#27AE60', '#E74C3C', '#9B59B6'];

export default function EmployerAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employers/analytics').then(({ data: res }) => setData(res.data)).catch(() => setData(MOCK_EMPLOYER_ANALYTICS_FULL)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: data?.activeJobs ?? 0, icon: Briefcase, colour: 'text-blue-600 bg-blue-50' },
          { label: 'Total Applications', value: data?.totalApplications ?? 0, icon: Users, colour: 'text-purple-600 bg-purple-50' },
          { label: 'Total Placements', value: data?.totalPlacements ?? 0, icon: TrendingUp, colour: 'text-green-600 bg-green-50' },
          { label: 'Conversion Rate', value: `${(data?.conversionRate ?? 0).toFixed(1)}%`, icon: Eye, colour: 'text-orange-600 bg-orange-50' },
        ].map(({ label, value, icon: Icon, colour }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-3 ${colour}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Performance Bar Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Job Performance</CardTitle></CardHeader>
          <CardContent>
            {(!data?.jobPerformance?.length) ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No job data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.jobPerformance} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="title" tick={{ fontSize: 11 }} tickFormatter={(v) => v.length > 12 ? `${v.slice(0, 12)}…` : v} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="views" name="Views" fill="#1B4F72" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="applications" name="Applications" fill="#F39C12" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Applications by Status Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Applications by Status</CardTitle></CardHeader>
          <CardContent>
            {(!data?.applicationsByStatus?.length) ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No application data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={data.applicationsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {data.applicationsByStatus.map((_, i) => (
                      <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
