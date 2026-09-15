import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category.response.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste publique des catégories de missions actives' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  findAllActive(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAllActive();
  }
}
