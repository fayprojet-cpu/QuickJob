import { Module } from '@nestjs/common';
import { FedapayModule } from '../../infra/fedapay/fedapay.module';
import { ApplicationFundingController, PaymentsWebhookController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [FedapayModule],
  controllers: [ApplicationFundingController, PaymentsWebhookController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
