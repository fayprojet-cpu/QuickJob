import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'category.delivery' }) key!: string;
  @ApiProperty({ example: 'category.delivery.label' }) labelKey!: string;
  @ApiPropertyOptional({ nullable: true }) iconUrl!: string | null;
  @ApiProperty() sortOrder!: number;
}
