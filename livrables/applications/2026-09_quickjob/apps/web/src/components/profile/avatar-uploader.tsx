'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera } from 'lucide-react';
import { useUploadAvatar } from '@/features/users/use-users';
import { compressImage } from '@/lib/image-resize';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Petit bouton caméra superposé à l'avatar — visible uniquement sur son propre profil. */
export function AvatarUploader() {
  const t = useTranslations('profile');
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadAvatar();
  const [localError, setLocalError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setLocalError(null);
    if (!file) {
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError(t('uploadError'));
      return;
    }

    // On compresse avant de vérifier la taille : une photo de téléphone
    // (souvent 10-20 Mo à pleine résolution) redescend largement sous la
    // limite une fois ramenée à 512px, pas besoin de la rejeter d'entrée.
    setCompressing(true);
    const compressed = await compressImage(file);
    setCompressing(false);

    if (compressed.size > MAX_SIZE_BYTES) {
      setLocalError(t('uploadError'));
      return;
    }
    uploadMutation.mutate(compressed);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-50"
        aria-label={t('changePhoto')}
        disabled={uploadMutation.isPending || compressing}
      >
        <Camera className="h-4 w-4" aria-hidden />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleChange}
      />
      {compressing || uploadMutation.isPending ? (
        <span className="text-xs text-neutral-500">{t('uploading')}</span>
      ) : null}
      {localError || uploadMutation.isError ? (
        <span className="text-xs text-danger-600">{localError ?? t('uploadError')}</span>
      ) : null}
    </div>
  );
}
