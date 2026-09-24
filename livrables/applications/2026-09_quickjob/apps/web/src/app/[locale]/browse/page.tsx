import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ChevronRight } from 'lucide-react';
import { fetchCategories } from '@/features/jobs/api';
import { fetchSkillsCatalog } from '@/features/users/api';
import { categoryTranslationKey } from '@/features/jobs/category-label';
import { groupSkillSlugs, skillTranslationKey } from '@/features/users/skill-label';
import { Link } from '@/i18n/navigation';

export default async function BrowsePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('browse');
  const tJobs = await getTranslations('jobs');
  const tSkills = await getTranslations('skills');
  const tGroups = await getTranslations('workerSettings.skillGroups');

  const [categories, skills] = await Promise.all([fetchCategories(), fetchSkillsCatalog()]);

  const groups = groupSkillSlugs(skills.map((skill) => skillTranslationKey(skill.key)));
  const skillBySlug = new Map(skills.map((skill) => [skillTranslationKey(skill.key), skill]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
      <p className="mt-1 text-sm text-neutral-600">{t('subtitle')}</p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t('professionalTitle')}
      </h2>
      <div className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {groups.map(({ groupKey, slugs }) => (
          <details key={groupKey} className="group">
            <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
              {tGroups(groupKey)}
              <ChevronRight className="h-4 w-4 text-neutral-400 transition-transform group-open:rotate-90" aria-hidden />
            </summary>
            <div className="flex flex-wrap gap-2 border-t border-neutral-200 bg-neutral-50 p-4">
              {slugs.map((slug) => {
                const skill = skillBySlug.get(slug);
                if (!skill) return null;
                const label = tSkills(slug);
                return (
                  <Link
                    key={skill.id}
                    href={`/jobs?search=${encodeURIComponent(label)}`}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:border-primary-300 hover:text-primary-600"
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </details>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">{t('simpleTitle')}</h2>
      <p className="mt-1 text-xs text-neutral-500">{t('simpleHint')}</p>
      <div className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {categories.map((category) => {
          const label = tJobs(categoryTranslationKey(category.key));
          return (
            <Link
              key={category.id}
              href={`/jobs?search=${encodeURIComponent(label)}`}
              className="flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              {label}
              <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
