import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class InviteWorkerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workerId!: string;
}
