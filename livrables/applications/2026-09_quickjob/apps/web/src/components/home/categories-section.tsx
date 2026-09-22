import { getTranslations } from 'next-intl/server';
import { Truck, Sparkles, Boxes, PartyPopper, Wrench } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const CATEGORIES = [
  { key: 'category_delivery', icon: Truck },
  { key: 'category_cleaning', icon: Sparkles },
  { key: 'category_moving', icon: Boxes },
  { key: 'category_events', icon: PartyPopper },
  { key: 'category_handyman', icon: Wrench },
] as const;

export async function CategoriesSection() {
  const t = await getTranslations('home');
  const tJobs = await getTranslations('jobs');

  return (
    <section className="bg-neutral-50 px-4 py-16">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{t('categoriesTitle')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-600">{t('categoriesBody')}</p>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {CATEGORIES.map(({ key, icon: Icon }) => (
            <Link
              key={key}
              href="/jobs"
              className="group flex flex-col items-center gap-3 rounded-xl border border-neutral-200 bg-white p-5 text-center transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-medium text-neutral-800">{tJobs(key)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
