'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const PARTNERS = [
  'TV3 Network',
  'Joy FM',
  'Multimedia Group',
  'Citi FM',
  'GhOne TV',
  'Pulse Ghana',
  'Media General',
  'Starr FM',
  'Peace FM',
  'Adom TV',
  'UTV Ghana',
  'Angel FM',
];

export function LogoMarquee({ className }: { className?: string }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <div className={cn('relative overflow-hidden', className)} aria-label="Trusted partner companies">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

      <div className={cn('flex', reduceMotion ? 'flex-wrap justify-center gap-4' : 'animate-marquee')}>
        {(reduceMotion ? PARTNERS : [...PARTNERS, ...PARTNERS]).map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex-shrink-0 mx-8 flex items-center justify-center h-12 px-6 rounded-lg bg-gray-100 hover:bg-brand/5 transition-colors group"
          >
            <span className="text-sm font-semibold text-gray-400 group-hover:text-brand transition-colors whitespace-nowrap tracking-wide">
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
