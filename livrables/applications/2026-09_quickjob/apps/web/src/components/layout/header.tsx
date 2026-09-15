'use client';

import { useTranslations } from 'next-intl';
import { Briefcase, LogOut, Plus, User } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/use-auth';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from './locale-switcher';

export function Header() {
  const t = useTranslations('nav');
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary-600">
          <Briefcase className="h-5 w-5" aria-hidden />
          QuickJob
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/jobs"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 sm:inline-flex"
          >
            {t('jobs')}
          </Link>

          <Link href="/jobs/new">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t('postJob')}</span>
            </Button>
          </Link>

          {user ? (
            <button
              type="button"
              onClick={() => logout.mutate()}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              title={t('logout')}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              <User className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t('login')}</span>
            </Link>
          )}

          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
