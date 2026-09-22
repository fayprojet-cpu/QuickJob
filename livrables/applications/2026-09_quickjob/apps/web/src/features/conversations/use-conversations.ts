'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConversationSummary } from '@/types/api';
import { fetchConversationMessages, fetchMineConversations, sendConversationMessage } from './api';

const POLL_INTERVAL_MS = 4000;

export function useMineConversations(enabled = true) {
  return useQuery({
    queryKey: ['conversations', 'mine'],
    queryFn: fetchMineConversations,
    refetchInterval: POLL_INTERVAL_MS,
    enabled,
  });
}

/**
 * Retrouve, parmi des conversations déjà chargées (un seul appel à
 * useMineConversations au niveau du composant liste), celle liée à une
 * mission donnée — fonction pure, pas un hook, pour rester utilisable dans
 * une boucle .map() sans enfreindre les règles des hooks React.
 */
export function findConversationForJob(
  conversations: ConversationSummary[] | undefined,
  jobId: string | null | undefined,
): ConversationSummary | null {
  if (!jobId || !conversations) {
    return null;
  }
  return conversations.find((c) => c.jobId === jobId) ?? null;
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: () => fetchConversationMessages(conversationId, { limit: 50 }),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendConversationMessage(conversationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'mine'] });
    },
  });
}
