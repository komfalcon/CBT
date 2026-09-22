import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthStatus } from './health.service';
import { AdminService } from './admin/admin.service';

@Controller()
export class AppController {
  constructor(
    private readonly healthService: HealthService,
    private readonly adminService: AdminService,
  ) {}

  @Get('health')
  health(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  @Get(['system/maintenance-status', 'api/system/maintenance-status'])
  async getMaintenanceStatus() {
    return this.adminService.getMaintenanceStatus();
  }
}
