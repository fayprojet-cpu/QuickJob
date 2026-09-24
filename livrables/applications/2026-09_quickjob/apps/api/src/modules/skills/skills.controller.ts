import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SkillResponseDto } from './dto/skill.response.dto';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Catalogue public des compétences (métiers) actives' })
  @ApiOkResponse({ type: [SkillResponseDto] })
  findAllActive(): Promise<SkillResponseDto[]> {
    return this.skillsService.findAllActive();
  }
}
