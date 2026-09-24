'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useMyWorkerSettings, useSkillsCatalog, useUpdateWorkerSettings } from '@/features/users/use-users';
import { fetchCategories } from '@/features/jobs/api';
import { categoryTranslationKey } from '@/features/jobs/category-label';
import { skillTranslationKey } from '@/features/users/skill-label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

function TagToggle({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? 'border-primary-500 bg-primary-500 text-white'
          : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-200'
      }`}
    >
      {label}
    </button>
  );
}

export function WorkerSettingsView() {
  const t = useTranslations('workerSettings');
  const tJobs = useTranslations('jobs');
  const tSkills = useTranslations('skills');
  const user = useAuthStore((state) => state.user);

  const settingsQuery = useMyWorkerSettings();
  const skillsQuery = useSkillsCatalog();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const updateMutation = useUpdateWorkerSettings();

  const [editing, setEditing] = useState(false);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [canDoGeneral, setCanDoGeneral] = useState(false);
  const [acceptedCategoryKeys, setAcceptedCategoryKeys] = useState<string[]>([]);
  const [availableNow, setAvailableNow] = useState(false);
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState('');
  const { position: coords, status: geoStatus, request: requestLocation } = useGeolocation();

  const settings = settingsQuery.data;

  useEffect(() => {
    if (!settings || editing) return;
    setSkillIds(settings.skills.map((skill) => skill.id));
    setCanDoGeneral(settings.canDoGeneral);
    setAcceptedCategoryKeys(settings.acceptedCategoryKeys);
    setAvailableNow(settings.availableNow);
    setCity(settings.city ?? '');
    setRadius(settings.travelRadiusKm != null ? String(settings.travelRadiusKm) : '');
  }, [settings, editing]);

  if (!user) {
    return (
      <Card className="p-6 text-center text-sm text-neutral-600">{t('loginPrompt')}</Card>
    );
  }

  if (settingsQuery.isLoading) {
    return <Card className="p-6 text-center text-sm text-neutral-500">…</Card>;
  }

  if (!settings) {
    return null;
  }

  const isEmpty =
    settings.skills.length === 0 &&
    !settings.canDoGeneral &&
    !settings.availableNow &&
    !settings.city &&
    settings.travelRadiusKm == null;

  function toggleSkill(id: string) {
    setSkillIds((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]));
  }

  function toggleCategory(key: string) {
    setAcceptedCategoryKeys((current) =>
      current.includes(key) ? current.filter((v) => v !== key) : [...current, key],
    );
  }

  function handleCancel() {
    setEditing(false);
  }

  async function handleSave() {
    await updateMutation.mutateAsync({
      skillIds,
      canDoGeneral,
      acceptedCategoryKeys: canDoGeneral ? acceptedCategoryKeys : [],
      availableNow,
      city: city || undefined,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      ...(radius ? { travelRadiusKm: Number(radius) } : {}),
    });
    setEditing(false);
  }

  if (!editing) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{t('title')}</h2>
            <p className="mt-1 text-sm text-neutral-600">{t('subtitle')}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            {t('edit')}
          </Button>
        </div>

        {isEmpty ? (
          <p className="mt-6 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">{t('emptyState')}</p>
        ) : (
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-neutral-700">{t('skillsLabel')}</p>
              {settings.skills.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {settings.skills.map((skill) => (
                    <Badge key={skill.id} tone="primary">
                      {tSkills(skillTranslationKey(skill.key))}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-neutral-500">{t('skillsEmpty')}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-neutral-700">{t('canDoGeneralLabel')}</p>
              <p className="mt-1 text-sm text-neutral-600">
                {settings.canDoGeneral ? '✓' : '—'}
                {settings.canDoGeneral && settings.acceptedCategoryKeys.length > 0 ? (
                  <span className="ml-2">
                    {settings.acceptedCategoryKeys
                      .map((key) => tJobs(categoryTranslationKey(key)))
                      .join(', ')}
                  </span>
                ) : null}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-neutral-700">{t('availableNowLabel')}</p>
              <p className="mt-1 text-sm text-neutral-600">{settings.availableNow ? '✓' : '—'}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-neutral-700">{t('zoneLabel')}</p>
              <p className="mt-1 text-sm text-neutral-600">
                {settings.city ?? t('cityEmpty')}
                {settings.travelRadiusKm != null ? ` · ${settings.travelRadiusKm} km` : ''}
              </p>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-neutral-900">{t('title')}</h2>

      <div className="mt-5">
        <Label>{t('skillsLabel')}</Label>
        <p className="text-xs text-neutral-500">{t('skillsHint')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(skillsQuery.data ?? []).map((skill) => (
            <TagToggle
              key={skill.id}
              label={tSkills(skillTranslationKey(skill.key))}
              selected={skillIds.includes(skill.id)}
              onToggle={() => toggleSkill(skill.id)}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-neutral-200 pt-5">
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={canDoGeneral}
            onChange={(event) => setCanDoGeneral(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          {t('canDoGeneralLabel')}
        </label>
        <p className="mt-1 text-xs text-neutral-500">{t('canDoGeneralHint')}</p>

        {canDoGeneral ? (
          <div className="mt-3">
            <Label>{t('acceptedCategoriesLabel')}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(categoriesQuery.data ?? []).map((category) => (
                <TagToggle
                  key={category.id}
                  label={tJobs(categoryTranslationKey(category.key))}
                  selected={acceptedCategoryKeys.includes(category.key)}
                  onToggle={() => toggleCategory(category.key)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 border-t border-neutral-200 pt-5">
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={availableNow}
            onChange={(event) => setAvailableNow(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          {t('availableNowLabel')}
        </label>
        <p className="mt-1 text-xs text-neutral-500">{t('availableNowHint')}</p>
      </div>

      <div className="mt-5 border-t border-neutral-200 pt-5">
        <Label>{t('zoneLabel')}</Label>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="worker-city">{t('cityLabel')}</Label>
            <Input
              id="worker-city"
              value={city}
              placeholder={t('cityPlaceholder')}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="worker-radius">{t('radiusLabel')}</Label>
            <Input
              id="worker-radius"
              type="number"
              min={1}
              max={200}
              value={radius}
              onChange={(event) => setRadius(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={requestLocation}
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
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button type="button" onClick={handleSave} isLoading={updateMutation.isPending}>
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" onClick={handleCancel}>
          {t('cancel')}
        </Button>
      </div>
      {updateMutation.isSuccess ? (
        <p className="mt-2 text-sm font-medium text-primary-600">{t('saveSuccess')}</p>
      ) : null}
      {updateMutation.isError ? (
        <p className="mt-2 text-sm text-danger-600">{t('saveError')}</p>
      ) : null}
    </Card>
  );
}
