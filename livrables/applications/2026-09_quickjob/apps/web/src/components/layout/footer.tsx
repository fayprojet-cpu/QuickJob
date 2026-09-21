import { getTranslations } from 'next-intl/server';
import { Briefcase } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';

export async function Footer() {
  const t = await getTranslations('footer');
  const tCommon = await getTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-base font-extrabold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-500 text-white">
                <Briefcase className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="text-neutral-900">
                Quick<span className="text-primary-600">Job</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-neutral-500">{t('tagline')}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{t('linksTitle')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li>
                <Link href="/about" className="hover:text-primary-600">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-primary-600">
                  {t('howItWorks')}
                </Link>
              </li>
              <li>
                <Link href="/about#contact" className="hover:text-primary-600">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="/about#legal" className="hover:text-primary-600">
                  {t('legal')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{t('languageTitle')}</h3>
            <div className="mt-3">
              <LocaleSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-6 text-center text-sm text-neutral-500">
          {tCommon('appName')} — {year}. {t('rights')}
        </div>
      </div>
    </footer>
  );
}
