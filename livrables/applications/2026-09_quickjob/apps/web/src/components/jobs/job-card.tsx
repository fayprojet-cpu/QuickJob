import { MapPin, Users } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/money';
import { categoryTranslationKey } from '@/features/jobs/category-label';
import type { Category, Job } from '@/types/api';

export function JobCard({ job, category }: { job: Job; category?: Category }) {
  const t = useTranslations('jobs');
  const locale = useLocale();
  const { salaryAmount, salaryCurrency } = job;

  return (
    <Link href={`/jobs/${job.id}`} className="group block">
      <Card className="flex h-full flex-col gap-3 p-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-primary-200">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900">{job.title}</h3>
          <Badge tone={job.urgency === 'URGENT' ? 'danger' : 'primary'} className="shrink-0">
            {t(`urgency.${job.urgency}`)}
          </Badge>
        </div>

        {category ? (
          <Badge tone="neutral" className="w-fit">
            {t(categoryTranslationKey(category.key))}
          </Badge>
        ) : null}

        <p className="line-clamp-2 text-sm text-neutral-600">{job.description}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-sm">
          <span className="font-semibold text-primary-600">
            {salaryAmount && salaryCurrency ? (
              <>
                {formatMoney(salaryAmount, salaryCurrency, locale)}{' '}
                <span className="font-normal text-neutral-500">{t(`salaryType.${job.salaryType}`)}</span>
              </>
            ) : (
              t('negotiable')
            )}
          </span>

          {job.city ? (
            <span className="flex items-center gap-1 text-neutral-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {job.city}
            </span>
          ) : null}
        </div>

        <span className="flex items-center gap-1 text-xs text-neutral-500">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {t('workersNeeded', { count: job.workersNeeded })}
        </span>
      </Card>
    </Link>
  );
}
