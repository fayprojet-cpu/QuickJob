import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('common');

  return (
    <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-500">
      <p>
        {t('appName')} — {new Date().getFullYear()}
      </p>
    </footer>
  );
}
