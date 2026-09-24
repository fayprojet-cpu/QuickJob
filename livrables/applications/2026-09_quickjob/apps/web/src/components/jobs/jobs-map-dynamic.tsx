'use client';

import dynamic from 'next/dynamic';

export const JobsMapDynamic = dynamic(() => import('./jobs-map').then((mod) => mod.JobsMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  ),
});
