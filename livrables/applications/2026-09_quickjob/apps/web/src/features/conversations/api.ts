import { authApiFetch } from '@/lib/auth-api-client';
import { toQueryString } from '@/lib/api-client';
import type { ConversationSummary, Message, PaginatedResult } from '@/types/api';

export function fetchMineConversations(): Promise<ConversationSummary[]> {
  return authApiFetch<ConversationSummary[]>('/conversations');
}

export function fetchConversationMessages(
  conversationId: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<Message>> {
  return authApiFetch<PaginatedResult<Message>>(
    `/conversations/${conversationId}/messages${toQueryString(params)}`,
  );
}

export function sendConversationMessage(conversationId: string, body: string): Promise<Message> {
  return authApiFetch<Message>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}
