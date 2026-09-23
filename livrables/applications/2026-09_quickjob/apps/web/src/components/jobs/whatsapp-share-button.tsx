'use client';

import { Share2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import type { Job } from '@/types/api';

export function WhatsAppShareButton({ job }: { job: Job }) {
  const t = useTranslations('jobs');
  const locale = useLocale();

  function handleShare() {
    const pay =
      job.salaryAmount && job.salaryCurrency
        ? formatMoney(job.salaryAmount, job.salaryCurrency, locale)
        : t('negotiable');
    const parts = [job.title, pay];
    if (job.city) parts.push(job.city);
    parts.push(window.location.href);
    const text = encodeURIComponent(parts.join(' — '));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <Button type="button" variant="outline" onClick={handleShare}>
      <Share2 className="h-4 w-4" aria-hidden />
      {t('shareWhatsApp')}
    </Button>
  );
}
