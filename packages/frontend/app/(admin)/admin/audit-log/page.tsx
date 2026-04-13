'use client';

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { MOCK_ADMIN_AUDIT_LOG } from '@/lib/demo';
import { formatDateTime } from '@/lib/utils';
import { Search, ScrollText } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  user?: { email: string; role: string };
}

const ACTION_COLOURS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  LOGOUT: 'bg-gray-100 text-gray-700',
  PAYMENT: 'bg-green-100 text-green-800',
  PROFILE_UPDATE: 'bg-purple-100 text-purple-800',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-800',
  KYB_APPROVED: 'bg-green-100 text-green-800',
  KYB_REJECTED: 'bg-red-100 text-red-800',
  JOB_CREATED: 'bg-brand text-white',
  PLACEMENT_CONFIRMED: 'bg-orange-100 text-orange-800',
  PASSWORD_RESET: 'bg-red-100 text-red-800',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) q.set('userId', search);
      if (action) q.set('action', action);
      if (from) q.set('from', from);
      if (to) q.set('to', to);
      const { data } = await api.get(`/admin/audit-log?${q}`);
      setLogs(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch { setLogs(MOCK_ADMIN_AUDIT_LOG); setTotal(MOCK_ADMIN_AUDIT_LOG.length); }
    finally { setLoading(false); }
  }, [page, search, action, from, to]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ScrollText className="h-6 w-6" /> Audit Log</h1>
          <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString()} immutable audit entries</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filter by action..." value={action} onChange={(e) => setAction(e.target.value)} className="pl-9 w-48" />
        </div>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" placeholder="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" placeholder="To date" />
        <Button variant="outline" size="sm" onClick={() => { setPage(1); loadLogs(); }}>Filter</Button>
        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setAction(''); setFrom(''); setTo(''); setPage(1); }}>Clear</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No audit entries found.</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 mt-0.5 ${ACTION_COLOURS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                    <div className="min-w-0">
                      {log.entity && <p className="text-xs font-medium">{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}</p>}
                      {log.metadata && (
                        <p className="text-xs text-muted-foreground truncate">
                          {Object.entries(log.metadata).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.user?.email ?? 'System'} · {log.ipAddress ?? 'N/A'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{formatDateTime(log.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
