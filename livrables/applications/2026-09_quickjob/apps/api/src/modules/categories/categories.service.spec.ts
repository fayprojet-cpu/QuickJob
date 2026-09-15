import { PrismaService } from '../../infra/prisma/prisma.service';
import { CategoriesService } from './categories.service';

function buildPrismaMock() {
  return {
    jobCategory: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('CategoriesService', () => {
  it('lists only active categories ordered by sortOrder', async () => {
    const prisma = buildPrismaMock();
    (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue([]);
    const service = new CategoriesService(prisma);

    await service.findAllActive();

    expect(prisma.jobCategory.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  });
});
