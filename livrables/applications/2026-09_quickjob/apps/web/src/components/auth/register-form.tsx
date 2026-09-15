'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useRegister } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
import { cn } from '@/lib/cn';

type Role = 'WORKER' | 'RECRUITER';

export function RegisterForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const router = useRouter();
  const register = useRegister();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('WORKER');
  const [countryCode, setCountryCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({
        email,
        password,
        roles: [role],
        locale,
        countryCode: countryCode ? countryCode.toUpperCase() : undefined,
      });
      router.push('/jobs');
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(t('emailTaken'));
      } else if (err instanceof ApiError && err.statusCode === 400) {
        setError(tErrors('validation'));
      } else {
        setError(tErrors('generic'));
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error ?? undefined} />

      <div>
        <Label>{t('roleLabel')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['WORKER', 'RECRUITER'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                role === option
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50',
              )}
              aria-pressed={role === option}
            >
              {option === 'WORKER' ? t('roleWorker') : t('roleRecruiter')}
            </button>
          ))}
        </div>
      </div>

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

      <div>
        <Label htmlFor="password">{t('password')}</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="mt-1 text-xs text-neutral-500">{t('passwordHint')}</p>
      </div>

      <div>
        <Label htmlFor="countryCode">
          {t('countryCode')} <span className="text-neutral-400">({t('countryCodeHint')})</span>
        </Label>
        <Input
          id="countryCode"
          maxLength={2}
          placeholder="FR"
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" isLoading={register.isPending}>
        {t('registerSubmit')}
      </Button>
    </form>
  );
}
