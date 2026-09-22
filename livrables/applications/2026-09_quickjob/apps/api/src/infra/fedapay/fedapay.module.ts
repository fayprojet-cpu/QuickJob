import { Global, Module } from '@nestjs/common';
import { FedapayService } from './fedapay.service';

@Global()
@Module({
  providers: [FedapayService],
  exports: [FedapayService],
})
export class FedapayModule {}
