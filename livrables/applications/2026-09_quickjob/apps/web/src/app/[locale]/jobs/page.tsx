import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchCategories, fetchPublishedJobs } from '@/features/jobs/api';
import { JobCard } from '@/components/jobs/job-card';
import { JobFilters } from '@/components/jobs/job-filters';
import { Pagination } from '@/components/jobs/pagination';
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

      <div className="mt-4">
        <JobFilters
          search={searchParams.search}
          city={searchParams.city}
          urgency={searchParams.urgency}
        />
      </div>

      {jobsResult.items.length === 0 ? (
        <p className="mt-12 text-center text-neutral-500">{t('noResults')}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobsResult.items.map((job) => (
            <JobCard key={job.id} job={job} category={categoryById.get(job.categoryId)} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
