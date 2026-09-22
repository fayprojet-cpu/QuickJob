import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ConversationSummaryResponseDto } from './dto/conversation-summary.response.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message.response.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';

export interface PaginatedMessages {
  items: MessageResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mes conversations (où je suis participant), avec l'autre participant,
   * la mission liée, le dernier message et le nombre de messages non lus.
   */
  async findMine(userId: string): Promise<ConversationSummaryResponseDto[]> {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            job: { select: { id: true, title: true } },
            participants: {
              where: { userId: { not: userId } },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    workerProfile: { select: { displayName: true } },
                    recruiterProfile: { select: { companyName: true } },
                  },
                },
              },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    const summaries = await Promise.all(
      participations.map(async (participation) => {
        const { conversation } = participation;
        const otherUser = conversation.participants[0]?.user ?? null;
        const lastMessage = conversation.messages[0] ?? null;
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            ...(participation.lastReadAt ? { createdAt: { gt: participation.lastReadAt } } : {}),
          },
        });

        return {
          id: conversation.id,
          jobId: conversation.jobId,
          jobTitle: conversation.job?.title ?? null,
          otherParticipant: otherUser
            ? {
                id: otherUser.id,
                email: otherUser.email,
                displayName:
                  otherUser.firstName ??
                  otherUser.workerProfile?.displayName ??
                  otherUser.recruiterProfile?.companyName ??
                  null,
              }
            : null,
          lastMessage: lastMessage
            ? { body: lastMessage.body, senderId: lastMessage.senderId, createdAt: lastMessage.createdAt }
            : null,
          unreadCount,
        };
      }),
    );

    return summaries.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? new Date(0);
      const bTime = b.lastMessage?.createdAt ?? new Date(0);
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  /**
   * Messages d'une conversation (participant uniquement) — page 1 = les plus
   * récents, renvoyés du plus ancien au plus récent (prêt à afficher tel
   * quel, scroll en bas). Marque aussi mon `lastReadAt` à l'ouverture.
   */
  async findMessages(conversationId: string, userId: string, query: QueryMessagesDto): Promise<PaginatedMessages> {
    await this.assertParticipant(conversationId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 30;

    const [itemsDesc, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    return { items: itemsDesc.slice().reverse(), total, page, limit };
  }

  /** Envoie un message texte (participant uniquement). */
  async sendMessage(conversationId: string, userId: string, dto: CreateMessageDto): Promise<MessageResponseDto> {
    await this.assertParticipant(conversationId, userId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        type: MessageType.TEXT,
        body: dto.body,
      },
    });

    // Envoyer un message vaut aussi lecture de la conversation jusque-là.
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    return message;
  }

  /**
   * 404 générique (pas 403) que la conversation n'existe pas ou que
   * l'appelant n'y participe pas — évite de confirmer l'existence d'une
   * conversation à quelqu'un qui n'en fait pas partie.
   */
  private async assertParticipant(conversationId: string, userId: string): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }
  }
}
