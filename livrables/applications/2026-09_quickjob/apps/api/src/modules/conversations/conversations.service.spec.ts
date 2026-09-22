import { NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ConversationsService } from './conversations.service';

function buildPrismaMock() {
  return {
    conversationParticipant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('ConversationsService', () => {
  let service: ConversationsService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new ConversationsService(prisma);
  });

  describe('findMine', () => {
    it('maps each conversation to the other participant, last message and unread count', async () => {
      (prisma.conversationParticipant.findMany as jest.Mock).mockResolvedValue([
        {
          lastReadAt: new Date('2026-01-01T00:00:00.000Z'),
          conversation: {
            id: 'conv-1',
            jobId: 'job-1',
            job: { id: 'job-1', title: 'Livraison de colis' },
            participants: [
              {
                user: {
                  id: 'worker-1',
                  email: 'worker@example.com',
                  workerProfile: { displayName: 'Awa K.' },
                  recruiterProfile: null,
                },
              },
            ],
            messages: [{ body: 'Salut !', senderId: 'worker-1', createdAt: new Date('2026-01-02T00:00:00.000Z') }],
          },
        },
      ]);
      (prisma.message.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findMine('recruiter-1');

      expect(result).toEqual([
        {
          id: 'conv-1',
          jobId: 'job-1',
          jobTitle: 'Livraison de colis',
          otherParticipant: { id: 'worker-1', email: 'worker@example.com', displayName: 'Awa K.' },
          lastMessage: { body: 'Salut !', senderId: 'worker-1', createdAt: new Date('2026-01-02T00:00:00.000Z') },
          unreadCount: 2,
        },
      ]);
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          senderId: { not: 'recruiter-1' },
          createdAt: { gt: new Date('2026-01-01T00:00:00.000Z') },
        },
      });
    });
  });

  describe('findMessages', () => {
    it('throws NotFoundException when the caller is not a participant', async () => {
      (prisma.conversationParticipant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findMessages('conv-1', 'stranger', { page: 1, limit: 30 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.message.findMany).not.toHaveBeenCalled();
    });

    it('returns messages oldest-first for a participant and marks lastReadAt', async () => {
      (prisma.conversationParticipant.findUnique as jest.Mock).mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'worker-1',
      });
      (prisma.message.findMany as jest.Mock).mockResolvedValue([
        { id: 'msg-2', createdAt: new Date('2026-01-02T00:00:00.000Z') },
        { id: 'msg-1', createdAt: new Date('2026-01-01T00:00:00.000Z') },
      ]);
      (prisma.message.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findMessages('conv-1', 'worker-1', { page: 1, limit: 30 });

      expect(result.items.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);
      expect(result.total).toBe(2);
      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId_userId: { conversationId: 'conv-1', userId: 'worker-1' } },
        }),
      );
    });
  });

  describe('sendMessage', () => {
    it('throws NotFoundException when the caller is not a participant', async () => {
      (prisma.conversationParticipant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.sendMessage('conv-1', 'stranger', { body: 'Hello' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('creates a TEXT message and marks lastReadAt for a participant', async () => {
      (prisma.conversationParticipant.findUnique as jest.Mock).mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'worker-1',
      });
      (prisma.message.create as jest.Mock).mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'worker-1',
        type: MessageType.TEXT,
        body: 'Hello',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const result = await service.sendMessage('conv-1', 'worker-1', { body: 'Hello' });

      expect(result.body).toBe('Hello');
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: { conversationId: 'conv-1', senderId: 'worker-1', type: MessageType.TEXT, body: 'Hello' },
      });
      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId_userId: { conversationId: 'conv-1', userId: 'worker-1' } },
        }),
      );
    });
  });
});
