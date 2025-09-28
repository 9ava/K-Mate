import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { AddAdminDto, UpdateUserRoleDto } from './admin.dto';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService
  ) {}

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

  @Get('statistics')
  @Roles('admin')
  @ApiOperation({ summary: 'Get system statistics', description: 'Retrieves comprehensive system statistics for admin dashboard.' })
  async getStatistics(@Query('period') period?: string) {
    return this.adminService.getSystemStatistics(period);
  }

  @Get('statistics/daily')
  @Roles('admin')
  @ApiOperation({ summary: 'Get daily statistics', description: 'Retrieves daily activity statistics.' })
  async getDailyStatistics(@Query('period') period?: string) {
    return this.adminService.getDailyStatistics(period);
  }

  @Get('statistics/categories')
  @Roles('admin')
  @ApiOperation({ summary: 'Get category statistics', description: 'Retrieves post category distribution statistics.' })
  async getCategoryStatistics() {
    return this.adminService.getCategoryStatistics();
  }

  @Get('statistics/top-content')
  @Roles('admin')
  @ApiOperation({ summary: 'Get top content', description: 'Retrieves top posts and courses statistics.' })
  async getTopContent() {
    return this.adminService.getTopContent();
  }

  @Post('demo/kpop-course')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create K-pop demo course', description: 'Creates a demo course based on K-pop Demon Hunters filming locations in Seoul.' })
  async createKpopDemoCourse(@Req() req: any) {
    const adminUser = req.user;
    const course = await this.adminService.createKpopDemoCourse(adminUser);
    return {
      success: true,
      data: {
        id: course.id,
        title: course.title
      },
      message: 'K-pop Demon Hunters demo course created successfully'
    };
  }
}
