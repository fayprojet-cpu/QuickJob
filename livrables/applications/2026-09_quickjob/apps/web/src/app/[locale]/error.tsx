'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors');
  const tCommon = useTranslations('common');

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-lg font-semibold text-neutral-900">{tCommon('error')}</h1>
      <p className="mt-2 text-sm text-neutral-600">{t('network')}</p>
      <Button className="mt-6" onClick={reset}>
        {tCommon('retry')}
      </Button>
    </div>
  );
}
