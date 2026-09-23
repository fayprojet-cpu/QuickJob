'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useRegister } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';

type Role = 'WORKER' | 'RECRUITER';

export function RegisterForm({ role, onBack }: { role: Role; onBack: () => void }) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const router = useRouter();
  const register = useRegister();

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({
        firstName,
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
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {tCommon('back')}
      </button>

      <FormError message={error ?? undefined} />

      <div>
        <Label htmlFor="firstName">{t('firstName')}</Label>
        <Input
          id="firstName"
          type="text"
          required
          maxLength={60}
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
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
          {t('countryCode')} <span className="text-neutral-500">({t('countryCodeHint')})</span>
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
