'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore, useToastStore } from '@/lib/store';
import api from '@/lib/api';
import { LayoutDashboard, Briefcase, Users, FileText, MapPin, BarChart2, MessageSquare, CreditCard, Settings, LogOut, ChevronRight } from 'lucide-react';

const NAV = [
  { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employer/jobs', label: 'Job Listings', icon: Briefcase },
  { href: '/employer/candidates', label: 'Candidates', icon: Users },
  { href: '/employer/applications', label: 'Applications', icon: FileText },
  { href: '/employer/placements', label: 'Placements', icon: MapPin },
  { href: '/employer/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/employer/messages', label: 'Messages', icon: MessageSquare },
  { href: '/employer/billing', label: 'Billing', icon: CreditCard },
  { href: '/employer/settings', label: 'Settings', icon: Settings },
];

export function EmployerSidebar() {
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
          <span className="font-bold text-sm text-brand">MediaLink Ghana</span>
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
        <div className="px-3 py-2 text-xs text-muted-foreground truncate mb-1">{user?.email}</div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
