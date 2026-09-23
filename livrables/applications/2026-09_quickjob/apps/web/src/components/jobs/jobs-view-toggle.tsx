'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { List, Map as MapIcon } from 'lucide-react';
import { JobCard } from '@/components/jobs/job-card';
import { JobsMapDynamic } from '@/components/jobs/jobs-map-dynamic';
import type { Category, Job } from '@/types/api';

export function JobsViewToggle({
  jobs,
  categoryById,
}: {
  jobs: Job[];
  categoryById: Map<string, Category>;
}) {
  const t = useTranslations('jobs');
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <div>
      <div className="mt-6 inline-flex rounded-lg border border-neutral-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setView('list')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === 'list' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:text-neutral-900'
          }`}
          aria-pressed={view === 'list'}
        >
          <List className="h-4 w-4" aria-hidden />
          {t('viewList')}
        </button>
        <button
          type="button"
          onClick={() => setView('map')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === 'map' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:text-neutral-900'
          }`}
          aria-pressed={view === 'map'}
        >
          <MapIcon className="h-4 w-4" aria-hidden />
          {t('viewMap')}
        </button>
      </div>

      {view === 'list' ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} category={categoryById.get(job.categoryId)} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <JobsMapDynamic jobs={jobs} />
        </div>
      )}
    </div>
  );
}
