'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Briefcase, LogOut, Menu, MessageCircle, Plus, User, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/use-auth';
import { useMineConversations } from '@/features/conversations/use-conversations';
import { LinkButton } from '@/components/ui/link-button';
import { Avatar } from '@/components/ui/avatar';
import { LocaleSwitcher } from './locale-switcher';
import { ModeSwitcher } from './mode-switcher';
import { getDefaultMode } from '@/lib/mode';

export function Header() {
  const t = useTranslations('nav');
  const user = useAuthStore((state) => state.user);
  const activeMode = useAuthStore((state) => state.activeMode);
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentMode = activeMode ?? (user ? getDefaultMode(user.roles) : null);
  const isRecruiterMode = currentMode === 'RECRUITER';
  const conversationsQuery = useMineConversations(Boolean(user));
  const unreadCount = conversationsQuery.data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        {/* Logo + menu — regroupés à gauche, façon apps pro (menu toujours accessible, pas seulement sur mobile). */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white">
              <Briefcase className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-neutral-900">
              Quick<span className="text-primary-600">Job</span>
            </span>
          </Link>
        </div>

        {/* Toujours visible à droite : accès rapide au profil, ou incitation à s'inscrire. */}
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center rounded-full ring-offset-2 transition hover:ring-2 hover:ring-primary-300"
              title={t('myProfile')}
              aria-label={t('myProfile')}
            >
              <Avatar url={user.avatarUrl} name={user.firstName ?? t('myProfile')} size="sm" />
            </Link>
          ) : (
            <LinkButton href="/register" size="sm">
              {t('register')}
            </LinkButton>
          )}
        </div>
      </div>

      {/* Panneau de navigation — tout le reste (liens, mode, connexion) vit ici, ouvert depuis le menu à gauche. */}
      {menuOpen ? (
        <nav className="border-t border-neutral-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-5xl flex-col gap-1">
            <Link
              href="/jobs"
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              {t('jobs')}
            </Link>
            <Link
              href="/about"
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              {t('about')}
            </Link>
            {!user || isRecruiterMode ? (
              <>
                <LinkButton
                  href="/jobs/new"
                  onClick={closeMenu}
                  variant="outline"
                  className="mt-1 w-full justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {t('postJob')}
                </LinkButton>
                {user ? (
                  <Link
                    href="/jobs/mine"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {t('myJobs')}
                  </Link>
                ) : null}
              </>
            ) : null}

            {user && !isRecruiterMode ? (
              <Link
                href="/applications"
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {t('myApplications')}
              </Link>
            ) : null}

            {user ? (
              <Link
                href="/messages"
                onClick={closeMenu}
                className="flex items-center gap-1.5 rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t('messages')}
                {unreadCount > 0 ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </Link>
            ) : null}

            {user ? (
              <div className="px-3 py-2">
                <ModeSwitcher />
              </div>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  logout.mutate();
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {t('logout')}
              </button>
            ) : (
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex items-center gap-1.5 rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                <User className="h-4 w-4" aria-hidden />
                {t('login')}
              </Link>
            )}

            <div className="mt-2 border-t border-neutral-200 pt-3">
              <LocaleSwitcher />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
