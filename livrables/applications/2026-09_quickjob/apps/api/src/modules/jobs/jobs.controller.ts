import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateJobDto } from './dto/create-job.dto';
import { JobResponseDto, PaginatedJobsResponseDto } from './dto/job.response.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste publique des missions publiées' })
  @ApiOkResponse({ type: PaginatedJobsResponseDto })
  findPublished(@Query() query: QueryJobsDto): Promise<PaginatedJobsResponseDto> {
    return this.jobsService.findPublished(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.RECRUITER)
  @Get('mine')
  @ApiOperation({ summary: 'Missions du recruteur authentifié, tous statuts' })
  @ApiOkResponse({ type: PaginatedJobsResponseDto })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryJobsDto,
  ): Promise<PaginatedJobsResponseDto> {
    return this.jobsService.findMine(user.id, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une mission publiée' })
  @ApiOkResponse({ type: JobResponseDto })
  findOnePublished(@Param('id', ParseUUIDPipe) id: string): Promise<JobResponseDto> {
    return this.jobsService.findOnePublished(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.RECRUITER)
  @Post()
  @ApiOperation({ summary: 'Crée une mission en brouillon (DRAFT)' })
  @ApiOkResponse({ type: JobResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateJobDto,
  ): Promise<JobResponseDto> {
    return this.jobsService.create(user.id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.RECRUITER)
  @Patch(':id')
  @ApiOperation({ summary: 'Met à jour une mission (DRAFT ou PUBLISHED) appartenant au recruteur' })
  @ApiOkResponse({ type: JobResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
  ): Promise<JobResponseDto> {
    return this.jobsService.update(id, user.id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.RECRUITER)
  @Post(':id/publish')
  @ApiOperation({ summary: 'Publie une mission DRAFT' })
  @ApiOkResponse({ type: JobResponseDto })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JobResponseDto> {
    return this.jobsService.publish(id, user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.RECRUITER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Annule (PUBLISHED) ou supprime (DRAFT) une mission' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.jobsService.cancel(id, user.id);
  }
}
