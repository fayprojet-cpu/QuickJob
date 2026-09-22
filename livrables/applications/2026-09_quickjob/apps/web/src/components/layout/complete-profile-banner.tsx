'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile } from '@/features/users/use-users';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Bannière discrète pour les comptes créés avant l'ajout du prénom
 * (obligatoire pour les nouvelles inscriptions). Un seul champ, pas de blocage
 * de navigation — disparaît dès que le prénom est enregistré.
 */
export function CompleteProfileBanner() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateProfile();
  const [firstName, setFirstName] = useState('');

  if (!user || user.firstName) {
    return null;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = firstName.trim();
    if (!trimmed || updateProfile.isPending) {
      return;
    }
    updateProfile.mutate({ firstName: trimmed });
  }

  return (
    <div className="border-b border-primary-100 bg-primary-50">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-5xl flex-col items-stretch gap-2 px-4 py-3 sm:flex-row sm:items-center"
      >
        <p className="flex-1 text-sm text-primary-800">{t('completeProfilePrompt')}</p>
        <div className="flex gap-2">
          <Input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder={t('firstName')}
            maxLength={60}
            className="h-9"
            aria-label={t('firstName')}
          />
          <Button type="submit" size="sm" isLoading={updateProfile.isPending} disabled={!firstName.trim()}>
            {tCommon('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
