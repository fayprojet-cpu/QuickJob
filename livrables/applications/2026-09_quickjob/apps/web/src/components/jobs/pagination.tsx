import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export async function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  const t = await getTranslations('jobs');

  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      {hasPrevious ? (
        <Link href={buildHref(page - 1)}>
          <Button variant="outline" size="sm">
            {t('previous')}
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          {t('previous')}
        </Button>
      )}
      <span className="text-sm text-neutral-600">{t('page', { page, total: totalPages })}</span>
      {hasNext ? (
        <Link href={buildHref(page + 1)}>
          <Button variant="outline" size="sm">
            {t('next')}
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          {t('next')}
        </Button>
      )}
    </div>
  );
}
