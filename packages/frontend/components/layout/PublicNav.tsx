'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileOpen(false);
      return;
    }
    if (e.key !== 'Tab' || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus(), 100);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, handleKeyDown]);

  return (
    <>
      {/* Announcement Bar */}
      {!bannerDismissed && (
        <div className="bg-brand-accent text-white text-center text-sm py-2 px-4 relative">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 hidden sm:block" />
            <span className="font-medium">
              <span className="hidden sm:inline">New: </span>120+ media houses now hiring across all 16 regions
            </span>
            <Link
              href="/auth/register"
              className="underline underline-offset-2 font-semibold hover:no-underline ml-1"
            >
              Browse Jobs <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Nav */}
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-300',
          scrolled
            ? 'bg-white shadow-md border-b'
            : 'bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-transparent',
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-sm">ML</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-brand leading-none">MediaLink</span>
              <span className="text-[10px] text-brand-accent font-semibold uppercase tracking-widest leading-none">Ghana</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/#for-seekers" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
              For Job Seekers
            </Link>
            <Link href="/#for-employers" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
              For Employers
            </Link>
            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
              About
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-brand-accent hover:bg-brand-accent/90 text-white animate-pulse-gold">
              <Link href="/auth/register">Get Started Free</Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in-up"
            style={{ animationDuration: '0.2s' }}
            onClick={() => setMobileOpen(false)}
          />
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation menu" className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b">
              <span className="font-bold text-brand">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4 flex-1">
              {[
                { label: 'For Job Seekers', href: '/#for-seekers' },
                { label: 'For Employers', href: '/#for-employers' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'About', href: '/about' },
                { label: 'Sign In', href: '/auth/login' },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t">
              <Button asChild className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white">
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
