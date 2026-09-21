import { Module } from '@nestjs/common';
import { MailModule } from '../../infra/mail/mail.module';
import { ApplicationsController, JobApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [MailModule],
  controllers: [JobApplicationsController, ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
