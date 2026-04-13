'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api, { extractError } from '@/lib/api';
import { MOCK_ADMIN_APPLICANT_USERS } from '@/lib/demo';
import { useToastStore } from '@/lib/store';
import { formatDate, getStatusBadgeVariant } from '@/lib/utils';
import { Search, Users, MoreVertical, Lock, Key, Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  applicantProfile?: { fullName: string; completionScore: number; region?: string };
}

export default function ApplicantsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actioning, setActioning] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ role: 'APPLICANT', page: String(page), limit: '20' });
      if (search) q.set('search', search);
      if (statusFilter) q.set('status', statusFilter);
      const { data } = await api.get(`/admin/users?${q}`);
      setUsers(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch { setUsers(MOCK_ADMIN_APPLICANT_USERS); setTotal(MOCK_ADMIN_APPLICANT_USERS.length); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleStatusChange = async (userId: string, status: string) => {
    setActioning(true);
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status } : u));
      addToast({ type: 'success', title: `User ${status.toLowerCase()}.` });
      setActionUser(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Action failed', description: extractError(err) });
    } finally { setActioning(false); }
  };

  const handleResetPassword = async (userId: string) => {
    setActioning(true);
    try {
      const { data } = await api.post(`/admin/users/${userId}/reset-password`);
      addToast({ type: 'success', title: 'Password reset', description: `Temp password: ${data.data.tempPassword}` });
      setActionUser(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Reset failed', description: extractError(err) });
    } finally { setActioning(false); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Applicants</h1>
          <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString()} registered applicant{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadUsers()} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadUsers}>Search</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No applicants found.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4">
                      <div className="sm:col-span-2">
                        <p className="font-medium text-sm truncate">{user.applicantProfile?.fullName ?? user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                        {user.applicantProfile?.region && <p className="text-xs text-muted-foreground">{user.applicantProfile.region}</p>}
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(user.status)} className="text-xs">{user.status}</Badge>
                        {user.applicantProfile && (
                          <span className="text-xs text-muted-foreground">{user.applicantProfile.completionScore}% profile</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setActionUser(user)}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </>
      )}

      {/* User Actions Dialog */}
      <Dialog open={!!actionUser} onOpenChange={() => setActionUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm font-medium mb-1">{actionUser?.applicantProfile?.fullName ?? actionUser?.email}</p>
            <p className="text-xs text-muted-foreground mb-4">{actionUser?.email} · Status: <strong>{actionUser?.status}</strong></p>
            <div className="space-y-2">
              {actionUser?.status === 'ACTIVE' && (
                <Button variant="outline" className="w-full justify-start" onClick={() => handleStatusChange(actionUser.id, 'SUSPENDED')} loading={actioning}>
                  <Lock className="h-4 w-4 mr-2" /> Suspend Account
                </Button>
              )}
              {actionUser?.status === 'SUSPENDED' && (
                <Button className="w-full justify-start" onClick={() => handleStatusChange(actionUser.id, 'ACTIVE')} loading={actioning}>
                  <Lock className="h-4 w-4 mr-2" /> Reactivate Account
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" onClick={() => actionUser && handleResetPassword(actionUser.id)} loading={actioning}>
                <Key className="h-4 w-4 mr-2" /> Reset Password
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => actionUser && handleStatusChange(actionUser.id, 'DELETED')} loading={actioning}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
