import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Search } from 'lucide-react';
import { fetchCategories, fetchPublishedJobs } from '@/features/jobs/api';
import { JobFilters } from '@/components/jobs/job-filters';
import { Pagination } from '@/components/jobs/pagination';
import { JobsViewToggle } from '@/components/jobs/jobs-view-toggle';
import type { JobUrgency } from '@/types/api';

const PAGE_SIZE = 12;

export default async function JobsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; search?: string; city?: string; urgency?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('jobs');

  const page = Math.max(1, Number(searchParams.page) || 1);
  const [jobsResult, categories] = await Promise.all([
    fetchPublishedJobs({
      page,
      limit: PAGE_SIZE,
      search: searchParams.search,
      city: searchParams.city,
      urgency: searchParams.urgency as JobUrgency | undefined,
    }),
    fetchCategories(),
  ]);

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const totalPages = Math.max(1, Math.ceil(jobsResult.total / jobsResult.limit));
  const hasFilters = Boolean(searchParams.search || searchParams.city || searchParams.urgency);

  function buildHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.city) params.set('city', searchParams.city);
    if (searchParams.urgency) params.set('urgency', searchParams.urgency);
    if (targetPage > 1) params.set('page', String(targetPage));
    const query = params.toString();
    return query ? `/jobs?${query}` : '/jobs';
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>

      {/* Filtres repliables : les missions restent l'élément principal de la page. */}
      <details className="mt-4 rounded-lg border border-neutral-200 bg-white" open={hasFilters}>
        <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-medium text-neutral-700">
          <Search className="h-4 w-4 text-neutral-400" aria-hidden />
          {t('filterToggle')}
        </summary>
        <div className="border-t border-neutral-200 p-4">
          <JobFilters
            search={searchParams.search}
            city={searchParams.city}
            urgency={searchParams.urgency}
          />
        </div>
      </details>

      {jobsResult.items.length === 0 ? (
        <p className="mt-12 text-center text-neutral-500">
          {hasFilters ? t('noResults') : t('noJobsYet')}
        </p>
      ) : (
        <JobsViewToggle jobs={jobsResult.items} categoryById={categoryById} />
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
