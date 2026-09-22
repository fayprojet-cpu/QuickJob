import type { ConversationSummary } from '@/types/api';

type Participant = Pick<NonNullable<ConversationSummary['otherParticipant']>, 'email' | 'displayName'> | null;

/**
 * Nom à afficher pour l'autre participant. Priorité au vrai nom (displayName,
 * renseigné dans le profil travailleur/recruteur) ; à défaut, on dérive
 * quelque chose de lisible de l'email plutôt que d'afficher l'adresse brute
 * (ex. "hounto.gbesteve@gmail.com" -> "Hounto Gbesteve").
 */
export function resolveParticipantName(participant: Participant, fallback: string): string {
  if (!participant) {
    return fallback;
  }
  if (participant.displayName) {
    return participant.displayName;
  }
  if (!participant.email) {
    return fallback;
  }
  const localPart = participant.email.split('@')[0] ?? '';
  const words = localPart.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) {
    return fallback;
  }
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function participantInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function findConversationById(
  conversations: ConversationSummary[] | undefined,
  conversationId: string,
): ConversationSummary | null {
  return conversations?.find((c) => c.id === conversationId) ?? null;
}
