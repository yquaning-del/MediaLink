'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Direction = 'up' | 'left' | 'right' | 'scale';

const ANIMATION_MAP: Record<Direction, string> = {
  up: 'animate-fade-in-up',
  left: 'animate-fade-in-left',
  right: 'animate-fade-in-right',
  scale: 'animate-scale-in',
};

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: string;
  className?: string;
  threshold?: number;
  id?: string;
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay,
  className,
  threshold = 0.15,
  id,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    if (mq.matches) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  if (prefersReducedMotion) {
    return <div id={id} className={className}>{children}</div>;
  }

  return (
    <div
      id={id}
      ref={ref}
      className={cn(
        visible ? ANIMATION_MAP[direction] : 'opacity-0',
        delay,
        className,
      )}
    >
      {children}
    </div>
  );
}
