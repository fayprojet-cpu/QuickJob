'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useResetPassword } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';

export function ResetPasswordForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const resetPassword = useResetPassword();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => router.push('/login'), 2500);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [success, router]);

  if (!token) {
    return <FormError message={t('invalidOrExpiredToken')} />;
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary-500" aria-hidden />
        <p className="text-sm text-neutral-700">{t('resetPasswordSuccess')}</p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    try {
      await resetPassword.mutateAsync({ token: token as string, newPassword });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError(t('invalidOrExpiredToken'));
      } else {
        setError(tErrors('generic'));
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error ?? undefined} />

      <div>
        <Label htmlFor="newPassword">{t('newPassword')}</Label>
        <Input
          id="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <p className="mt-1 text-xs text-neutral-500">{t('passwordHint')}</p>
      </div>

      <div>
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" isLoading={resetPassword.isPending}>
        {t('resetPasswordSubmit')}
      </Button>
    </form>
  );
}
