import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { AddAdminDto, UpdateUserRoleDto } from './admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users', description: 'Retrieves a list of all users.' })
  async getUsers() {
    return this.authService.findAll();
  }

  @Post('users')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new admin user', description: 'Promotes a user to an admin role. If the user does not exist, a new user with admin role will be created.' })
  async addAdmin(@Body() addAdminDto: AddAdminDto) {
    return this.authService.createAdmin(addAdminDto.email);
  }

  @Patch('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user role', description: 'Updates the role of a specific user.' })
  async updateUserRole(@Param('id') id: number, @Body() updateUserRoleDto: UpdateUserRoleDto) {
    return this.authService.updateUserRole(id, updateUserRoleDto.role);
  }

  @Delete('users/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user', description: 'Deletes a specific user from the system.' })
  async deleteUser(@Param('id') id: number) {
    await this.authService.deleteUser(id);
  }
}
