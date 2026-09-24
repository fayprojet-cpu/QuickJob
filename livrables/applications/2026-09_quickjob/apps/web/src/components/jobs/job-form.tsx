'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useGeolocation } from '@/hooks/use-geolocation';
import { createJob, fetchCategories, publishJob } from '@/features/jobs/api';
import { categoryTranslationKey } from '@/features/jobs/category-label';
import { toMinorUnits } from '@/lib/money';
import { CURRENCY_CODES, currencyLabel } from '@/lib/currencies';
import { ApiError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
import type { JobUrgency, SalaryType } from '@/types/api';

const SALARY_TYPES: SalaryType[] = ['FIXED', 'HOURLY', 'DAILY'];
const URGENCIES: JobUrgency[] = ['FLEXIBLE', 'THIS_WEEK', 'TODAY', 'URGENT'];

export function JobForm() {
  const t = useTranslations('jobs.new');
  const tJobs = useTranslations('jobs');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState(user?.currency ?? 'EUR');
  const [salaryType, setSalaryType] = useState<SalaryType>('FIXED');
  const [urgency, setUrgency] = useState<JobUrgency>('FLEXIBLE');
  const [workersNeeded, setWorkersNeeded] = useState('1');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState(user?.countryCode ?? '');
  const [publishNow, setPublishNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { position: coords, status: geoStatus, request: handleUseLocation } = useGeolocation();

  const currencyOptions = useMemo(() => {
    const codes = CURRENCY_CODES.includes(salaryCurrency)
      ? CURRENCY_CODES
      : [salaryCurrency, ...CURRENCY_CODES];
    return codes.map((code) => ({ code, label: currencyLabel(code, locale) }));
  }, [locale, salaryCurrency]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const job = await createJob({
        title,
        description,
        categoryId,
        ...(negotiable
          ? {}
          : {
              salaryAmount: toMinorUnits(salaryAmount, salaryCurrency, locale) ?? '',
              salaryCurrency: salaryCurrency.toUpperCase(),
              salaryType,
            }),
        urgency,
        workersNeeded: Number(workersNeeded),
        city: city || undefined,
        countryCode: countryCode ? countryCode.toUpperCase() : undefined,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      });
      if (publishNow) {
        return publishJob(job.id);
      }
      return job;
    },
    onSuccess: (job) => {
      router.push(job.status === 'PUBLISHED' ? `/jobs/${job.id}` : '/jobs');
    },
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await submitMutation.mutateAsync();
    } catch (err) {
      if (err instanceof ApiError && (err.statusCode === 400 || err.statusCode === 422)) {
        setError(err.details?.join(' ') ?? tErrors('validation'));
      } else {
        setError(tErrors('generic'));
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error ?? undefined} />

      <div>
        <Label htmlFor="title">{t('jobTitle')}</Label>
        <Input
          id="title"
          required
          maxLength={150}
          placeholder={t('jobTitlePlaceholder')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="description">{tJobs('description')}</Label>
        <Textarea
          id="description"
          required
          rows={5}
          placeholder={t('descriptionPlaceholder')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="categoryId">{t('categoryLabel')}</Label>
        <Select
          id="categoryId"
          required
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="" disabled>
            {t('categoryPlaceholder')}
          </option>
          {(categoriesQuery.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {tJobs(categoryTranslationKey(category.key))}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={negotiable}
            onChange={(event) => setNegotiable(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          {t('negotiableLabel')}
        </label>

        {!negotiable ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="salaryAmount">{t('salaryAmount')}</Label>
                <Input
                  id="salaryAmount"
                  required
                  inputMode="decimal"
                  placeholder="1000"
                  value={salaryAmount}
                  onChange={(event) => setSalaryAmount(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="salaryCurrency">{t('salaryCurrency')}</Label>
                <Select
                  id="salaryCurrency"
                  required
                  value={salaryCurrency}
                  onChange={(event) => setSalaryCurrency(event.target.value)}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <p className="-mt-1 text-xs text-neutral-500">{t('salaryAmountHint')}</p>

            <div>
              <Label htmlFor="salaryType">{t('salaryType')}</Label>
              <Select
                id="salaryType"
                value={salaryType}
                onChange={(event) => setSalaryType(event.target.value as SalaryType)}
              >
                {SALARY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {tJobs(`salaryType.${value}`)}
                  </option>
                ))}
              </Select>
            </div>
          </>
        ) : null}
      </div>

      <div>
        <Label htmlFor="urgency">{t('urgencyLabel')}</Label>
        <Select
          id="urgency"
          value={urgency}
          onChange={(event) => setUrgency(event.target.value as JobUrgency)}
        >
          {URGENCIES.map((value) => (
            <option key={value} value={value}>
              {tJobs(`urgency.${value}`)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="workersNeeded">{t('workersNeededLabel')}</Label>
          <Input
            id="workersNeeded"
            type="number"
            min={1}
            required
            value={workersNeeded}
            onChange={(event) => setWorkersNeeded(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="city">
            {t('cityLabel')} <span className="text-neutral-500">({tCommon('optional')})</span>
          </Label>
          <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="countryCode">{t('countryCodeLabel')}</Label>
        <Input
          id="countryCode"
          maxLength={2}
          placeholder="FR"
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
        />
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseLocation}
          isLoading={geoStatus === 'loading'}
        >
          {t('useLocation')}
        </Button>
        {geoStatus === 'success' ? (
          <p className="mt-1 text-xs text-primary-600">{t('locationAdded')}</p>
        ) : null}
        {geoStatus === 'error' ? (
          <p className="mt-1 text-xs text-neutral-500">{t('locationError')}</p>
        ) : null}
      </div>

      <div className="border-t border-neutral-200 pt-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(event) => setPublishNow(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          {t('publishAfterCreate')}
        </label>

        <Button type="submit" className="mt-4 w-full" isLoading={submitMutation.isPending}>
          {publishNow ? t('publishAfterCreate') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
