import { Module } from '@nestjs/common';
import {
  ApplicationReviewController,
  JobReviewController,
  MineReviewsController,
  UserReviewsController,
} from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [JobReviewController, ApplicationReviewController, MineReviewsController, UserReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
