import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';

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
        <LinkButton href={buildHref(page - 1)} variant="outline" size="sm">
          {t('previous')}
        </LinkButton>
      ) : (
        <Button variant="outline" size="sm" disabled>
          {t('previous')}
        </Button>
      )}
      <span className="text-sm text-neutral-600">{t('page', { page, total: totalPages })}</span>
      {hasNext ? (
        <LinkButton href={buildHref(page + 1)} variant="outline" size="sm">
          {t('next')}
        </LinkButton>
      ) : (
        <Button variant="outline" size="sm" disabled>
          {t('next')}
        </Button>
      )}
    </div>
  );
}
