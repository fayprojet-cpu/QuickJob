'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LOCALE_LABELS: Record<string, string> = { fr: 'FR', en: 'EN' };

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 rounded-full border border-neutral-200 p-0.5 text-xs">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          aria-current={loc === locale}
          className={
            loc === locale
              ? 'rounded-full bg-primary-500 px-2 py-1 font-semibold text-white'
              : 'rounded-full px-2 py-1 text-neutral-600 hover:bg-neutral-100'
          }
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
