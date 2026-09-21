import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ApplicationsService } from './applications.service';
import { ApplyToJobDto } from './dto/apply-to-job.dto';
import { ApplicationResponseDto } from './dto/application.response.dto';

/** Candidature d'un travailleur à une mission publiée. */
@ApiTags('applications')
@ApiBearerAuth()
@Controller('jobs/:jobId/applications')
export class JobApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Roles(UserRole.WORKER)
  @Post()
  @ApiOperation({ summary: 'Postuler à une mission publiée' })
  @ApiOkResponse({ type: ApplicationResponseDto })
  apply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: ApplyToJobDto,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.apply(jobId, user.id, dto);
  }

  @Roles(UserRole.RECRUITER)
  @Get()
  @ApiOperation({ summary: 'Liste les candidatures reçues pour une mission (son auteur uniquement)' })
  @ApiOkResponse({ type: [ApplicationResponseDto] })
  findForJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ): Promise<ApplicationResponseDto[]> {
    return this.applicationsService.findForJob(jobId, user.id);
  }
}

/** Décisions du recruteur + vue du travailleur sur ses propres candidatures. */
@ApiTags('applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Roles(UserRole.WORKER)
  @Get('mine')
  @ApiOperation({ summary: 'Candidatures du travailleur authentifié, tous statuts' })
  @ApiOkResponse({ type: [ApplicationResponseDto] })
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<ApplicationResponseDto[]> {
    return this.applicationsService.findMine(user.id);
  }

  @Roles(UserRole.RECRUITER)
  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accepte une candidature reçue sur une de ses missions' })
  @ApiOkResponse({ type: ApplicationResponseDto })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.accept(id, user.id);
  }

  @Roles(UserRole.RECRUITER)
  @Patch(':id/reject')
  @ApiOperation({ summary: 'Refuse une candidature reçue sur une de ses missions' })
  @ApiOkResponse({ type: ApplicationResponseDto })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.reject(id, user.id);
  }
}
