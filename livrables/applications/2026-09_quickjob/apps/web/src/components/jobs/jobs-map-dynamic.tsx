'use client';

import dynamic from 'next/dynamic';

export const JobsMapDynamic = dynamic(() => import('./jobs-map').then((mod) => mod.JobsMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
      …
    </div>
  ),
});
