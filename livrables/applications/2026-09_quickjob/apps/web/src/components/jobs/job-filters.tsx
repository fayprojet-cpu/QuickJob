import { getTranslations } from 'next-intl/server';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { JobUrgency } from '@/types/api';

const URGENCIES: JobUrgency[] = ['FLEXIBLE', 'THIS_WEEK', 'TODAY', 'URGENT'];

/**
 * Formulaire GET natif (pas de JS requis) : soumettre navigue vers
 * `/jobs?search=...&city=...&urgency=...`, que la page relit via searchParams.
 */
export async function JobFilters({
  search,
  city,
  urgency,
}: {
  search?: string;
  city?: string;
  urgency?: string;
}) {
  const t = await getTranslations('jobs');

  return (
    <form method="get" className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
      <div>
        <Input
          type="search"
          name="search"
          defaultValue={search}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
        />
      </div>
      <div className="w-full sm:w-40">
        <Input
          type="text"
          name="city"
          defaultValue={city}
          placeholder={t('filterCity')}
          aria-label={t('filterCity')}
        />
      </div>
      <div className="w-full sm:w-44">
        <Select name="urgency" defaultValue={urgency ?? ''} aria-label={t('filterUrgency')}>
          <option value="">{t('filterAny')}</option>
          {URGENCIES.map((value) => (
            <option key={value} value={value}>
              {t(`urgency.${value}`)}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="outline" className="gap-1.5">
        <Search className="h-4 w-4" aria-hidden />
        {t('applyFilters')}
      </Button>
    </form>
  );
}
