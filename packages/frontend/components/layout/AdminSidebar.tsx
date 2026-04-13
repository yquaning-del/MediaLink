'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore, useToastStore } from '@/lib/store';
import api from '@/lib/api';
import {
  LayoutDashboard, Users, Building2, Briefcase, MapPin,
  CreditCard, BarChart2, Bell, Settings, ScrollText, LogOut, ChevronRight, Shield,
} from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users/applicants', label: 'Applicants', icon: Users },
  { href: '/admin/users/employers', label: 'Employers & KYB', icon: Building2 },
  { href: '/admin/jobs', label: 'Job Moderation', icon: Briefcase },
  { href: '/admin/placements', label: 'Placements', icon: MapPin },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/broadcast', label: 'Broadcast', icon: Bell },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    document.cookie = 'userRole=; path=/; Max-Age=0';
    router.push('/auth/login');
    addToast({ type: 'info', title: 'Signed out.' });
  };

  return (
    <aside className="w-64 shrink-0 border-r bg-white flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-brand flex items-center justify-center">
            <span className="text-white font-bold text-xs">ML</span>
          </div>
          <div>
            <span className="font-bold text-sm text-brand block">MediaLink Ghana</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Shield className="h-2.5 w-2.5" /> Admin Panel</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors', active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <div className="px-3 py-1 text-xs text-muted-foreground truncate">
          {user?.email} <span className="font-medium text-brand">({user?.role})</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 mt-1 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
