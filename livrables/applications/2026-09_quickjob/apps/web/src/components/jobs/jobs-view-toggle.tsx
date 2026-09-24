'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { List, Map as MapIcon } from 'lucide-react';
import { JobCard } from '@/components/jobs/job-card';
import { JobsMapDynamic } from '@/components/jobs/jobs-map-dynamic';
import type { Category, Job } from '@/types/api';

export function JobsViewToggle({
  jobs,
  categoryById,
  header,
  pagination,
}: {
  jobs: Job[];
  categoryById: Map<string, Category>;
  /** Titre + filtres de la page — masqués en mode Carte pour un effet plein écran. */
  header: ReactNode;
  /** Pagination de la liste — sans objet en mode Carte (chargement par zone visible). */
  pagination: ReactNode;
}) {
  const t = useTranslations('jobs');
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <div>
      {view === 'list' ? header : null}

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
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} category={categoryById.get(job.categoryId)} />
            ))}
          </div>
          {pagination}
        </>
      ) : (
        <div className="mt-4 h-[calc(100vh-260px)] min-h-[420px]">
          <JobsMapDynamic />
        </div>
      )}
    </div>
  );
}
