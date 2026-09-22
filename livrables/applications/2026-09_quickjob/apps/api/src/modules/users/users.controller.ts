import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AddRoleDto } from './dto/add-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { UsersService } from './users.service';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Profil de l\'utilisateur authentifié' })
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService.findSafeById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Met à jour les préférences de l\'utilisateur authentifié' })
  @ApiOkResponse({ type: UserResponseDto })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateMe(user.id, dto);
  }

  @Post('me/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Ajoute un rôle self-service (WORKER/RECRUITER) au compte connecté",
    description:
      "Idempotent — permet à un compte de devenir à la fois travailleur et recruteur. Jamais ADMIN/SUPER_ADMIN.",
  })
  @ApiOkResponse({ type: UserResponseDto })
  addRole(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddRoleDto,
  ): Promise<UserResponseDto> {
    return this.usersService.addRole(user.id, dto.role);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_SIZE_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Change la photo de profil du compte connecté (jpg/png/webp, 5 Mo max)' })
  @ApiOkResponse({ type: UserResponseDto })
  updateAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.usersService.updateAvatar(user.id, file);
  }

  @Public()
  @Get(':id/profile')
  @ApiOperation({ summary: "Profil public d'un utilisateur (nom, réputation, avis)" })
  @ApiOkResponse({ type: UserProfileResponseDto })
  getPublicProfile(@Param('id', ParseUUIDPipe) id: string): Promise<UserProfileResponseDto> {
    return this.usersService.findPublicProfile(id);
  }
}
