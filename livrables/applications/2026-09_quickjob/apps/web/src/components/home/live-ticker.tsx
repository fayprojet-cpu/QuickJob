import { Zap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatMoney } from '@/lib/money';
import type { Job } from '@/types/api';

/**
 * Bandeau défilant des dernières missions publiées — de vraies données (les
 * plus récentes via l'API), pas un décor inventé. Rendu en pur CSS
 * (@keyframes marquee dans globals.css), dupliqué une fois pour boucler sans
 * saut visible. S'arrête au survol et respecte prefers-reduced-motion.
 */
export async function LiveTicker({ jobs, locale }: { jobs: Job[]; locale: string }) {
  if (jobs.length === 0) {
    return null;
  }

  const t = await getTranslations('home');
  const items = [...jobs, ...jobs];

  return (
    <div className="border-y border-neutral-200 bg-white py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
          </span>
          {t('liveTickerTitle')}
        </span>

        <div className="pause-on-hover overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
          <div className="animate-marquee flex w-max gap-6 whitespace-nowrap">
            {items.map((job, index) => (
              <Link
                key={`${job.id}-${index}`}
                href={`/jobs/${job.id}`}
                className="flex items-center gap-1.5 text-sm text-neutral-700 hover:text-primary-600"
              >
                <Zap className="h-3.5 w-3.5 shrink-0 text-primary-400" aria-hidden />
                <span className="font-medium">{job.title}</span>
                {job.city ? <span className="text-neutral-500">· {job.city}</span> : null}
                {job.salaryAmount && job.salaryCurrency ? (
                  <span className="text-primary-600">
                    · {formatMoney(job.salaryAmount, job.salaryCurrency, locale)}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
