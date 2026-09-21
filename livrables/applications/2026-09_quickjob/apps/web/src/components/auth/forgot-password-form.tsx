'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { useForgotPassword } from '@/features/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const forgotPassword = useForgotPassword();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await forgotPassword.mutateAsync(email);
      setSubmitted(true);
    } catch {
      setError(tErrors('generic'));
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary-500" aria-hidden />
        <p className="text-sm text-neutral-700">{t('forgotPasswordSuccess')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error ?? undefined} />

      <div>
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" isLoading={forgotPassword.isPending}>
        {t('forgotPasswordSubmit')}
      </Button>
    </form>
  );
}
