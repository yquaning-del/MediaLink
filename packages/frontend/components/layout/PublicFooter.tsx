'use client';

import Link from 'next/link';
import { Linkedin, Twitter, Facebook, Instagram, Mail, Phone, Shield, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
  ],
  Platform: [
    { label: 'For Applicants', href: '/auth/register' },
    { label: 'For Employers', href: '/auth/register?role=employer' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Browse Jobs', href: '/auth/register' },
  ],
  Resources: [
    { label: 'Help Centre', href: '/help' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Contact Us', href: 'mailto:support@medialink.com.gh' },
    { label: 'System Status', href: '/status' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Data Protection', href: '/data-protection' },
  ],
};

const SOCIALS = [
  { icon: Linkedin, href: 'https://linkedin.com/company/medialink-ghana', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://twitter.com/medialinkghana', label: 'Twitter' },
  { icon: Facebook, href: 'https://facebook.com/medialinkghana', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/medialinkghana', label: 'Instagram' },
];

export function PublicFooter() {
  return (
    <footer className="bg-brand text-white">
      {/* Newsletter Strip */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Get weekly job alerts</h3>
              <p className="text-white/60 text-sm">Be the first to know about new media sales opportunities in Ghana.</p>
            </div>
            <form className="flex gap-2 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address for job alerts newsletter"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 w-full md:w-64 focus-visible:ring-brand-accent"
              />
              <Button type="submit" className="bg-brand-accent hover:bg-brand-accent/90 text-white shrink-0">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/20">
                <span className="text-white font-bold text-sm">ML</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-none">MediaLink</span>
                <span className="text-[10px] text-brand-accent font-semibold uppercase tracking-widest leading-none">Ghana</span>
              </div>
            </div>
            <p className="text-white/60 text-sm max-w-xs leading-relaxed mb-6">
              Ghana&apos;s #1 recruitment platform connecting top media sales talent with leading TV, radio, digital, print and outdoor media companies.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm mb-4 text-white/90">{category}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/50 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} MediaLink Ghana. All rights reserved.
            </p>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 text-white/40">
              <div className="flex items-center gap-1.5 text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Paystack Secured</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile Money</span>
              </div>
              <span className="text-sm">🇬🇭</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
