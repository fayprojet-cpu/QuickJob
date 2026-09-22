'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { useMineConversations } from '@/features/conversations/use-conversations';
import { resolveParticipantName } from '@/features/conversations/format';

function ConversationsSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="flex items-center gap-3 p-4">
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ConversationsList() {
  const t = useTranslations('messages');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const query = useMineConversations();

  if (query.isLoading) {
    return <ConversationsSkeleton />;
  }
  if (query.isError) {
    return <p className="mt-8 text-center text-neutral-500">{tErrors('generic')}</p>;
  }

  const conversations = query.data ?? [];

  if (conversations.length === 0) {
    return <p className="mt-8 text-center text-neutral-500">{t('empty')}</p>;
  }

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="mt-6 space-y-3">
      {conversations.map((conversation) => {
        const name = resolveParticipantName(conversation.otherParticipant, t('unknownParticipant'));
        const hasUnread = conversation.unreadCount > 0;

        return (
          <Link key={conversation.id} href={`/messages/${conversation.id}`}>
            <Card
              className={`flex items-center gap-3 p-4 transition hover:border-primary-200 hover:shadow-sm ${
                hasUnread ? 'border-primary-200 bg-primary-50/40' : ''
              }`}
            >
              <Avatar url={conversation.otherParticipant?.avatarUrl} name={name} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-medium text-neutral-900">{name}</p>
                    {hasUnread ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-hidden />
                    ) : null}
                  </div>
                  {conversation.lastMessage ? (
                    <span className="shrink-0 text-xs text-neutral-400">
                      {dateFmt.format(new Date(conversation.lastMessage.createdAt))}
                    </span>
                  ) : null}
                </div>
                {conversation.jobTitle ? (
                  <p className="truncate text-xs text-neutral-500">{conversation.jobTitle}</p>
                ) : null}
                {conversation.lastMessage ? (
                  <p className="mt-1 truncate text-sm text-neutral-600">{conversation.lastMessage.body}</p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-400">{t('noMessagesYet')}</p>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
