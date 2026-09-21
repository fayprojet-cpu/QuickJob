'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AccordionItem {
  question: string;
  answer: ReactNode;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `accordion-panel-${index}`;
        return (
          <div key={item.question}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-50 sm:px-6"
            >
              {item.question}
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 text-neutral-500 transition-transform', isOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
            {isOpen ? (
              <div id={panelId} className="px-4 pb-4 text-sm leading-relaxed text-neutral-600 sm:px-6">
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
