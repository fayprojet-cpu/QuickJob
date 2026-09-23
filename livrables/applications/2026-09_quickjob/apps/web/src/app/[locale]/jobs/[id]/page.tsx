import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MapPin, Users, CalendarClock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchCategories, fetchJob } from '@/features/jobs/api';
import { categoryTranslationKey } from '@/features/jobs/category-label';
import { formatMoney } from '@/lib/money';
import { ApiError } from '@/lib/api-error';
import { ApplyButton } from '@/components/jobs/apply-button';
import { WhatsAppShareButton } from '@/components/jobs/whatsapp-share-button';

export default async function JobDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('jobs');

  let job;
  try {
    job = await fetchJob(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  const categories = await fetchCategories();
  const category = categories.find((item) => item.id === job.categoryId);

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' });
  const { salaryAmount, salaryCurrency } = job;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/jobs" className="text-sm font-medium text-primary-600 hover:underline">
        ← {t('backToJobs')}
      </Link>

      <Card className="mt-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-neutral-900">{job.title}</h1>
          <Badge tone={job.urgency === 'URGENT' ? 'danger' : 'primary'} className="shrink-0">
            {t(`urgency.${job.urgency}`)}
          </Badge>
        </div>

        {category ? (
          <Badge tone="neutral" className="mt-3 w-fit">
            {t(categoryTranslationKey(category.key))}
          </Badge>
        ) : null}

        <p className="mt-4 text-2xl font-bold text-primary-600">
          {salaryAmount && salaryCurrency ? (
            <>
              {formatMoney(salaryAmount, salaryCurrency, locale)}{' '}
              <span className="text-base font-normal text-neutral-500">
                {t(`salaryType.${job.salaryType}`)}
              </span>
            </>
          ) : (
            t('negotiable')
          )}
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-3 text-sm text-neutral-600 sm:grid-cols-2">
          {job.city ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neutral-400" aria-hidden />
              <span>
                {job.city}
                {job.countryCode ? `, ${job.countryCode}` : ''}
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-400" aria-hidden />
            <span>{t('workersNeeded', { count: job.workersNeeded })}</span>
          </div>

          {job.publishedAt ? (
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-neutral-400" aria-hidden />
              <span>{t('postedOn', { date: formatter.format(new Date(job.publishedAt)) })}</span>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 border-t border-neutral-200 pt-6">
          <h2 className="font-semibold text-neutral-900">{t('description')}</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
            {job.description}
          </p>
        </div>
      </Card>

      <div className="mt-4 flex justify-end">
        <WhatsAppShareButton job={job} />
      </div>

      <ApplyButton jobId={job.id} recruiterId={job.recruiterId} />
    </div>
  );
}
