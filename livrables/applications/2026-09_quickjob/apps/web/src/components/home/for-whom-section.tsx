import { getTranslations } from 'next-intl/server';
import { Check, Users, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export async function ForWhomSection() {
  const t = await getTranslations('home');

  const columns = [
    {
      icon: Users,
      title: t('forWorkersTitle'),
      body: t('forWorkersBody'),
      points: [t('forWorkersPoint1'), t('forWorkersPoint2'), t('forWorkersPoint3')],
    },
    {
      icon: Building2,
      title: t('forEmployersTitle'),
      body: t('forEmployersBody'),
      points: [t('forEmployersPoint1'), t('forEmployersPoint2'), t('forEmployersPoint3')],
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="grid gap-6 sm:grid-cols-2">
        {columns.map(({ icon: Icon, title, body, points }) => (
          <Card key={title} className="p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-bold text-neutral-900">{title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{body}</p>
            <ul className="mt-4 space-y-2">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-neutral-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}
