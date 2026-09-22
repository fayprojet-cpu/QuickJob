import { getTranslations } from 'next-intl/server';
import { Check, Users, Building2 } from 'lucide-react';

export async function ForWhomSection() {
  const t = await getTranslations('home');

  const columns = [
    {
      icon: Users,
      title: t('forWorkersTitle'),
      body: t('forWorkersBody'),
      points: [t('forWorkersPoint1'), t('forWorkersPoint2'), t('forWorkersPoint3')],
      tone: 'neutral' as const,
    },
    {
      icon: Building2,
      title: t('forEmployersTitle'),
      body: t('forEmployersBody'),
      points: [t('forEmployersPoint1'), t('forEmployersPoint2'), t('forEmployersPoint3')],
      tone: 'brand' as const,
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="grid overflow-hidden rounded-2xl border border-neutral-200 sm:grid-cols-2">
        {columns.map(({ icon: Icon, title, body, points, tone }) => (
          <div
            key={title}
            className={
              tone === 'brand'
                ? 'bg-primary-500 p-6 text-white sm:p-8'
                : 'border-b border-neutral-200 bg-white p-6 sm:border-b-0 sm:p-8'
            }
          >
            <div className="flex items-center gap-3">
              <Icon className={tone === 'brand' ? 'h-6 w-6 text-white' : 'h-6 w-6 text-primary-600'} aria-hidden />
              <h3 className={tone === 'brand' ? 'text-lg font-bold' : 'text-lg font-bold text-neutral-900'}>
                {title}
              </h3>
            </div>
            <p className={tone === 'brand' ? 'mt-2 text-sm text-primary-50' : 'mt-2 text-sm text-neutral-600'}>
              {body}
            </p>
            <ul className="mt-4 space-y-2">
              {points.map((point) => (
                <li
                  key={point}
                  className={
                    tone === 'brand'
                      ? 'flex items-start gap-2 text-sm text-white'
                      : 'flex items-start gap-2 text-sm text-neutral-700'
                  }
                >
                  <Check
                    className={tone === 'brand' ? 'mt-0.5 h-4 w-4 shrink-0 text-primary-100' : 'mt-0.5 h-4 w-4 shrink-0 text-primary-500'}
                    aria-hidden
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
