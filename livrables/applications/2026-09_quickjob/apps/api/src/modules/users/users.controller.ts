import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AddRoleDto } from './dto/add-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { UsersService } from './users.service';

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
}
