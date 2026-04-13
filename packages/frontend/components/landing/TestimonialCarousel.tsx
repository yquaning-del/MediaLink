'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, ChevronLeft, ChevronRight, Quote, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  initials: string;
  color: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Abena Mensah',
    role: 'Senior Media Sales Executive',
    company: 'Joy FM',
    quote: 'MediaLink Ghana helped me land my dream role at one of Ghana\'s top radio stations within 3 weeks of signing up. The matching was spot-on.',
    rating: 5,
    initials: 'AM',
    color: 'bg-brand-accent',
  },
  {
    name: 'Kwame Asante',
    role: 'HR Manager',
    company: 'TV3 Network',
    quote: 'We filled 4 sales positions in under a month. The candidate quality on MediaLink Ghana is exceptional — far better than general job boards.',
    rating: 5,
    initials: 'KA',
    color: 'bg-brand',
  },
  {
    name: 'Ama Boateng',
    role: 'Digital Advertising Executive',
    company: 'Pulse Ghana',
    quote: 'The matching algorithm found me roles I hadn\'t even considered. My career trajectory changed completely after joining MediaLink.',
    rating: 5,
    initials: 'AB',
    color: 'bg-brand-green',
  },
  {
    name: 'Samuel Ofori',
    role: 'Sales Director',
    company: 'Media General',
    quote: 'As an employer, the revenue share model is fair and transparent. We only pay when we successfully place a candidate. Game-changer for our hiring.',
    rating: 5,
    initials: 'SO',
    color: 'bg-brand-light',
  },
  {
    name: 'Efua Darko',
    role: 'Print Ad Sales Manager',
    company: 'Graphic Communications',
    quote: 'I was skeptical about paying GHC 50 to register, but within two weeks I had three interview invitations. Best investment I\'ve ever made.',
    rating: 4,
    initials: 'ED',
    color: 'bg-rose-500',
  },
];

export function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  const getVisible = () => {
    const items: number[] = [];
    for (let i = -1; i <= 1; i++) {
      items.push((active + i + TESTIMONIALS.length) % TESTIMONIALS.length);
    }
    return items;
  };

  const visible = getVisible();

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cards */}
      <div className="flex gap-6 justify-center items-stretch">
        {visible.map((idx, pos) => {
          const t = TESTIMONIALS[idx];
          const isCenter = pos === 1;
          return (
            <Card
              key={`${t.name}-${idx}`}
              className={cn(
                'transition-all duration-500 w-full max-w-sm flex-shrink-0',
                isCenter ? 'scale-100 opacity-100 shadow-lg' : 'scale-95 opacity-60 hidden lg:block',
              )}
            >
              <CardContent className="pt-6 pb-6 flex flex-col h-full">
                <Quote className="h-8 w-8 text-brand-accent/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < t.rating ? 'fill-brand-accent text-brand-accent' : 'fill-gray-200 text-gray-200',
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold', t.color)}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role} &middot; {t.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div aria-live="polite" className="sr-only">
        Showing testimonial from {TESTIMONIALS[active].name}, {TESTIMONIALS[active].role} at {TESTIMONIALS[active].company}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={prev}
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => setPaused(!paused)}
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label={paused ? 'Resume auto-play' : 'Pause auto-play'}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>

        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === active ? 'w-6 bg-brand' : 'w-2 bg-gray-300 hover:bg-gray-400',
              )}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
