import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) email!: string | null;
  @ApiPropertyOptional({ nullable: true }) phone!: string | null;
  @ApiProperty({ enum: UserRole, isArray: true }) roles!: UserRole[];
  @ApiProperty({ enum: UserStatus }) status!: UserStatus;
  @ApiProperty() locale!: string;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional({ nullable: true }) countryCode!: string | null;
  @ApiProperty() timezone!: string;
  @ApiProperty() trustScore!: number;
  @ApiProperty() createdAt!: Date;
}
