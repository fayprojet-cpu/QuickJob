import { ApiProperty } from '@nestjs/swagger';

export class FundApplicationResponseDto {
  @ApiProperty({ description: 'URL de la page de paiement sécurisée FedaPay vers laquelle rediriger le recruteur' })
  checkoutUrl!: string;
}
