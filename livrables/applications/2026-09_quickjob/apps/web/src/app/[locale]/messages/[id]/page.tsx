'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConversationThread } from '@/components/messages/conversation-thread';

export default function ConversationPage({ params }: { params: { id: string } }) {
  const t = useTranslations('messages');
  const tAuth = useTranslations('auth');
  const user = useAuthStore((state) => state.user);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/messages" className="text-sm font-medium text-primary-600 hover:underline">
        ← {t('backToList')}
      </Link>

      {user ? (
        <ConversationThread conversationId={params.id} />
      ) : (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm text-neutral-600">{t('loginPrompt')}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/login">
              <Button variant="outline">{tAuth('loginSubmit')}</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
