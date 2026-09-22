'use client';

import type { ElementType, ReactNode } from 'react';
import { useReveal } from '@/hooks/use-reveal';
import { cn } from '@/lib/cn';

export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Décalage en ms, pour un effet en cascade sur une liste d'éléments frères. */
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'reveal-in', className)}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  );
}
