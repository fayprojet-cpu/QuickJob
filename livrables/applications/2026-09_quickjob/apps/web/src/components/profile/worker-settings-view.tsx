'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useMyWorkerSettings, useSkillsCatalog, useUpdateWorkerSettings } from '@/features/users/use-users';
import { fetchCategories } from '@/features/jobs/api';
import { categoryTranslationKey } from '@/features/jobs/category-label';
import { groupSkillSlugs, skillTranslationKey } from '@/features/users/skill-label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Skill } from '@/types/api';

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

/**
 * Statut "disponible maintenant" — une action rapide à part entière (comme
 * un statut en ligne/hors ligne), pas un champ enterré dans le formulaire
 * d'édition complet. Sauvegarde immédiate au clic.
 */
function AvailabilityQuickToggle({ availableNow }: { availableNow: boolean }) {
  const t = useTranslations('workerSettings');
  const updateMutation = useUpdateWorkerSettings();

  function handleToggle() {
    updateMutation.mutate({ availableNow: !availableNow });
  }

  return (
    <Card className="flex items-center justify-between p-4">
      <div>
        <p className="text-sm font-semibold text-neutral-900">{t('availableNowQuickLabel')}</p>
        <p className="text-xs text-neutral-500">
          {availableNow ? t('availableNowOn') : t('availableNowOff')}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={availableNow}
        aria-label={t('availableNowLabel')}
        onClick={handleToggle}
        disabled={updateMutation.isPending}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          availableNow ? 'bg-accent-600' : 'bg-neutral-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            availableNow ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </Card>
  );
}

function GroupedSkillPicker({
  skills,
  selectedIds,
  onToggle,
}: {
  skills: Skill[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const tSkills = useTranslations('skills');
  const tGroups = useTranslations('workerSettings.skillGroups');

  const bySlug = useMemo(() => new Map(skills.map((skill) => [skillTranslationKey(skill.key), skill])), [skills]);
  const groups = useMemo(() => groupSkillSlugs(skills.map((skill) => skillTranslationKey(skill.key))), [skills]);

  return (
    <div className="mt-2 space-y-2">
      {groups.map(({ groupKey, slugs }) => {
        const selectedCount = slugs.filter((slug) => {
          const skill = bySlug.get(slug);
          return skill && selectedIds.includes(skill.id);
        }).length;

        return (
          <details key={groupKey} className="rounded-lg border border-neutral-200" open={selectedCount > 0}>
            <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2 text-sm font-medium text-neutral-700">
              <span>{tGroups(groupKey)}</span>
              {selectedCount > 0 ? (
                <span className="text-xs font-semibold text-primary-600">{selectedCount}</span>
              ) : null}
            </summary>
            <div className="flex flex-wrap gap-2 border-t border-neutral-200 p-3">
              {slugs.map((slug) => {
                const skill = bySlug.get(slug);
                if (!skill) return null;
                return (
                  <TagToggle
                    key={skill.id}
                    label={tSkills(slug)}
                    selected={selectedIds.includes(skill.id)}
                    onToggle={() => onToggle(skill.id)}
                  />
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
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
  const [city, setCity] = useState('');
  const { position: coords, status: geoStatus, request: requestLocation } = useGeolocation();

  const settings = settingsQuery.data;

  useEffect(() => {
    if (!settings || editing) return;
    setSkillIds(settings.skills.map((skill) => skill.id));
    setCanDoGeneral(settings.canDoGeneral);
    setAcceptedCategoryKeys(settings.acceptedCategoryKeys);
    setCity(settings.city ?? '');
  }, [settings, editing]);

  if (!user) {
    return <Card className="p-6 text-center text-sm text-neutral-600">{t('loginPrompt')}</Card>;
  }

  if (settingsQuery.isLoading) {
    return <Card className="p-6 text-center text-sm text-neutral-500">…</Card>;
  }

  if (!settings) {
    return null;
  }

  const isEmpty =
    settings.skills.length === 0 && !settings.canDoGeneral && !settings.city;

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
      city: city || undefined,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
    });
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      <AvailabilityQuickToggle availableNow={settings.availableNow} />

      {!editing ? (
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
                <p className="text-sm font-semibold text-neutral-700">{t('zoneLabel')}</p>
                <p className="mt-1 text-sm text-neutral-600">{settings.city ?? t('cityEmpty')}</p>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-neutral-900">{t('title')}</h2>

          <div className="mt-5">
            <Label>{t('skillsLabel')}</Label>
            <p className="text-xs text-neutral-500">{t('skillsHint')}</p>
            <GroupedSkillPicker skills={skillsQuery.data ?? []} selectedIds={skillIds} onToggle={toggleSkill} />
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
            <Label htmlFor="worker-city">{t('cityLabel')}</Label>
            <Input
              id="worker-city"
              value={city}
              placeholder={t('cityPlaceholder')}
              onChange={(event) => setCity(event.target.value)}
            />
            <div className="mt-2">
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
      )}
    </div>
  );
}
