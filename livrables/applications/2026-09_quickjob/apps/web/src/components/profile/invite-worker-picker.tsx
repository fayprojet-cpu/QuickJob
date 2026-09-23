'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { fetchMineJobs } from '@/features/jobs/api';
import { useInviteWorker } from '@/features/applications/use-applications';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

/** Choisit une de ses missions ouvertes (brouillon ou publiée) pour y inviter directement un travailleur déjà connu. */
export function InviteWorkerPicker({ workerId, onDone }: { workerId: string; onDone: () => void }) {
  const t = useTranslations('activity');
  const jobsQuery = useQuery({ queryKey: ['jobs', 'mine'], queryFn: () => fetchMineJobs() });
  const inviteMutation = useInviteWorker();
  const [jobId, setJobId] = useState('');

  const invitableJobs = (jobsQuery.data?.items ?? []).filter(
    (job) => job.status === 'DRAFT' || job.status === 'PUBLISHED',
  );

  function handleInvite() {
    if (!jobId) {
      return;
    }
    inviteMutation.mutate({ jobId, workerId }, { onSuccess: onDone });
  }

  if (jobsQuery.isLoading) {
    return null;
  }

  if (invitableJobs.length === 0) {
    return <p className="mt-2 text-xs text-neutral-500">{t('noInvitableJobs')}</p>;
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:flex-row sm:items-center">
      <Select value={jobId} onChange={(event) => setJobId(event.target.value)} className="flex-1">
        <option value="">{t('pickJob')}</option>
        {invitableJobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.title}
          </option>
        ))}
      </Select>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleInvite} isLoading={inviteMutation.isPending} disabled={!jobId}>
          {t('sendInvite')}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>
          {t('cancel')}
        </Button>
      </div>
      {inviteMutation.isError ? <p className="text-xs text-danger-600">{t('inviteError')}</p> : null}
    </div>
  );
}
