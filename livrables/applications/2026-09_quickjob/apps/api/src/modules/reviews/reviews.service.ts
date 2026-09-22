import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, JobStatus, ReviewDirection, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthoredReviewDto, ReviewResponseDto, ReviewSummaryResponseDto } from './dto/review.response.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Le recruteur note le travailleur accepté d'une mission TERMINÉE. S'il y a
   * plusieurs travailleurs acceptés sur la même mission (workersNeeded > 1),
   * on note le premier accepté (decidedAt le plus ancien) — simplification
   * assumée pour ce MVP, une mission "à plusieurs" pourra affiner plus tard.
   */
  async reviewWorkerForJob(jobId: string, recruiterId: string, dto: CreateReviewDto): Promise<ReviewResponseDto> {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, recruiterId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Seule une mission terminée peut être notée');
    }

    const acceptedApplication = await this.prisma.application.findFirst({
      where: { jobId, status: ApplicationStatus.ACCEPTED },
      orderBy: { decidedAt: 'asc' },
      select: { workerId: true },
    });
    if (!acceptedApplication) {
      throw new BadRequestException('Aucun travailleur accepté à noter sur cette mission');
    }

    return this.createReview({
      jobId,
      authorId: recruiterId,
      targetId: acceptedApplication.workerId,
      direction: ReviewDirection.RECRUITER_TO_WORKER,
      dto,
    });
  }

  /** Le travailleur note le recruteur d'une mission TERMINÉE, via sa propre candidature acceptée. */
  async reviewRecruiterForApplication(
    applicationId: string,
    workerId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, workerId },
      include: { job: { select: { id: true, status: true, recruiterId: true } } },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== ApplicationStatus.ACCEPTED) {
      throw new ForbiddenException('Seule une candidature acceptée peut donner lieu à un avis');
    }
    if (application.job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Seule une mission terminée peut être notée');
    }

    return this.createReview({
      jobId: application.job.id,
      authorId: workerId,
      targetId: application.job.recruiterId,
      direction: ReviewDirection.WORKER_TO_RECRUITER,
      dto,
    });
  }

  private async createReview(input: {
    jobId: string;
    authorId: string;
    targetId: string;
    direction: ReviewDirection;
    dto: CreateReviewDto;
  }): Promise<ReviewResponseDto> {
    // Structurellement impossible via les flux normaux (un recruteur ne peut
    // pas postuler à sa propre mission) — garde-fou explicite quand même,
    // demandé par la spec.
    if (input.authorId === input.targetId) {
      throw new BadRequestException('You cannot review yourself');
    }

    const existing = await this.prisma.review.findUnique({
      where: {
        jobId_authorId_targetId: { jobId: input.jobId, authorId: input.authorId, targetId: input.targetId },
      },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this person for this job');
    }

    const review = await this.prisma.review.create({
      data: {
        jobId: input.jobId,
        authorId: input.authorId,
        targetId: input.targetId,
        direction: input.direction,
        rating: input.dto.rating,
        comment: input.dto.comment,
      },
      include: { author: { select: { firstName: true } } },
    });

    await this.recalculateTrustScore(input.targetId);

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      authorFirstName: review.author.firstName,
      createdAt: review.createdAt,
    };
  }

  /** Moyenne des avis VISIBLE reçus, ramenée sur 100 (5 étoiles -> 100). */
  private async recalculateTrustScore(userId: string): Promise<void> {
    const { _avg } = await this.prisma.review.aggregate({
      where: { targetId: userId, status: ReviewStatus.VISIBLE },
      _avg: { rating: true },
    });
    const trustScore = _avg.rating ? Math.round(_avg.rating * 20) : 0;
    await this.prisma.user.update({ where: { id: userId }, data: { trustScore } });
  }

  /** Avis VISIBLE reçus par un utilisateur, avec moyenne et nombre — vue publique. */
  async findReceivedByUser(userId: string): Promise<ReviewSummaryResponseDto> {
    const [{ _avg, _count }, reviews] = await Promise.all([
      this.prisma.review.aggregate({
        where: { targetId: userId, status: ReviewStatus.VISIBLE },
        _avg: { rating: true },
        _count: true,
      }),
      this.prisma.review.findMany({
        where: { targetId: userId, status: ReviewStatus.VISIBLE },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { firstName: true } } },
        take: 50,
      }),
    ]);

    return {
      average: _avg.rating,
      count: _count,
      items: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        authorFirstName: review.author.firstName,
        createdAt: review.createdAt,
      })),
    };
  }

  /** Avis déjà déposés par l'utilisateur connecté — pour l'état des boutons "Noter" côté web. */
  async findAuthoredByUser(userId: string): Promise<AuthoredReviewDto[]> {
    return this.prisma.review.findMany({
      where: { authorId: userId },
      select: { jobId: true, targetId: true },
    });
  }
}
