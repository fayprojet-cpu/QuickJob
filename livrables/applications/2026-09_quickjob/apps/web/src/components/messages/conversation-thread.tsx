'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useConversationMessages, useMineConversations, useSendMessage } from '@/features/conversations/use-conversations';
import { findConversationById, resolveParticipantName } from '@/features/conversations/format';
import { ReputationBadge } from '@/components/reviews/reputation-badge';

function ThreadSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className={`h-10 w-2/3 rounded-2xl ${index % 2 === 0 ? '' : 'ml-auto'}`} />
      ))}
    </div>
  );
}

export function ConversationThread({ conversationId }: { conversationId: string }) {
  const t = useTranslations('messages');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const userId = useAuthStore((state) => state.user?.id);
  const messagesQuery = useConversationMessages(conversationId);
  const conversationsQuery = useMineConversations();
  const sendMutation = useSendMessage(conversationId);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = messagesQuery.data?.items ?? [];
  const conversation = findConversationById(conversationsQuery.data, conversationId);
  const otherName = resolveParticipantName(conversation?.otherParticipant ?? null, t('unknownParticipant'));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  function handleSend() {
    const body = draft.trim();
    if (!body || sendMutation.isPending) {
      return;
    }
    setDraft('');
    sendMutation.mutate(body);
  }

  if (messagesQuery.isLoading) {
    return <ThreadSkeleton />;
  }
  if (messagesQuery.isError) {
    return <p className="mt-8 text-center text-neutral-500">{tErrors('generic')}</p>;
  }

  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: 'short' });

  return (
    <div className="mt-4 flex h-[70vh] flex-col">
      <Link
        href={conversation?.otherParticipant?.id ? `/profile/${conversation.otherParticipant.id}` : '#'}
        className="flex items-center gap-3 border-b border-neutral-200 pb-3"
      >
        <Avatar url={conversation?.otherParticipant?.avatarUrl} name={otherName} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-neutral-900 hover:underline">{otherName}</p>
          {conversation?.jobTitle ? (
            <p className="truncate text-xs text-neutral-500">{conversation.jobTitle}</p>
          ) : null}
          <ReputationBadge userId={conversation?.otherParticipant?.id} />
        </div>
      </Link>

      <div className="flex-1 space-y-3 overflow-y-auto pb-3 pr-1 pt-3">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-neutral-400">{t('noMessagesYet')}</p>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === userId;
            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMine
                      ? 'rounded-br-sm bg-primary-500 text-white'
                      : 'rounded-bl-sm bg-neutral-100 text-neutral-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-neutral-400'}`}>
                    {timeFmt.format(new Date(message.createdAt))}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <Card className="flex items-center gap-2 p-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder={t('placeholder')}
          maxLength={2000}
          aria-label={t('placeholder')}
        />
        <Button
          size="sm"
          onClick={handleSend}
          isLoading={sendMutation.isPending}
          disabled={!draft.trim()}
          aria-label={t('send')}
        >
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </Card>
      {sendMutation.isError ? <p className="mt-2 text-xs text-danger-600">{t('sendError')}</p> : null}
    </div>
  );
}
