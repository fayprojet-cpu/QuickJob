import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthoredReviewDto, ReviewResponseDto, ReviewSummaryResponseDto } from './dto/review.response.dto';
import { ReviewsService } from './reviews.service';

/** Le recruteur note le travailleur accepté d'une mission terminée. */
@ApiTags('reviews')
@ApiBearerAuth()
@Controller('jobs/:jobId/review')
export class JobReviewController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Roles(UserRole.RECRUITER)
  @Post()
  @ApiOperation({ summary: 'Note le travailleur accepté d\'une mission terminée' })
  @ApiOkResponse({ type: ReviewResponseDto })
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.reviewWorkerForJob(jobId, user.id, dto);
  }
}

/** Le travailleur note le recruteur, via sa candidature acceptée sur une mission terminée. */
@ApiTags('reviews')
@ApiBearerAuth()
@Controller('applications/:id/review')
export class ApplicationReviewController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Note le recruteur d\'une mission terminée' })
  @ApiOkResponse({ type: ReviewResponseDto })
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.reviewRecruiterForApplication(id, user.id, dto);
  }
}

/** Avis déposés par le compte connecté — état des boutons "Noter" côté web. */
@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class MineReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Avis déjà déposés par le compte connecté' })
  @ApiOkResponse({ type: [AuthoredReviewDto] })
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<AuthoredReviewDto[]> {
    return this.reviewsService.findAuthoredByUser(user.id);
  }
}

/** Réputation publique d'un utilisateur (moyenne, nombre d'avis, avis reçus). */
@ApiTags('reviews')
@Controller('users/:userId/reviews')
export class UserReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Avis reçus par un utilisateur (moyenne + liste)' })
  @ApiOkResponse({ type: ReviewSummaryResponseDto })
  findReceived(@Param('userId', ParseUUIDPipe) userId: string): Promise<ReviewSummaryResponseDto> {
    return this.reviewsService.findReceivedByUser(userId);
  }
}
