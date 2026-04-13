'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useToastStore } from '@/lib/store';
import api from '@/lib/api';
import {
  LayoutDashboard, Briefcase, FileText, MapPin, CreditCard,
  MessageSquare, Settings, LogOut, User, ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/applicant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applicant/profile', label: 'My Profile', icon: User },
  { href: '/applicant/jobs', label: 'Browse Jobs', icon: Briefcase },
  { href: '/applicant/applications', label: 'My Applications', icon: FileText },
  { href: '/applicant/placements', label: 'My Placement', icon: MapPin },
  { href: '/applicant/payments', label: 'Payments', icon: CreditCard },
  { href: '/applicant/messages', label: 'Messages', icon: MessageSquare },
  { href: '/applicant/settings', label: 'Settings', icon: Settings },
];

export function ApplicantSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    clearAuth();
    document.cookie = 'userRole=; path=/; Max-Age=0';
    router.push('/auth/login');
    addToast({ type: 'info', title: 'Signed out successfully.' });
  };

  return (
    <aside className="w-64 shrink-0 border-r bg-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-brand flex items-center justify-center">
            <span className="text-white font-bold text-xs">ML</span>
          </div>
          <span className="font-bold text-sm text-brand">MediaLink Ghana</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t">
        <div className="px-3 py-2 text-xs text-muted-foreground truncate mb-1">{user?.email}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
