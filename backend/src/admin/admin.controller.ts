import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats/overview')
  getOverviewStats() {
    return this.adminService.getOverviewStats();
  }

  @Get('users')
  listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.listUsers({
      search,
      role,
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Patch('users/:userId/status')
  updateUserStatus(
    @Param('userId') userId: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateUserStatus(userId, status);
  }

  @Post('cbt-keys/generate')
  generateBulkKeys(
    @Body('count') count: number,
  ) {
    return this.adminService.generateBulkKeys(count);
  }

  @Get('billing/logs')
  listBillingLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.listBillingLogs({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }
}
