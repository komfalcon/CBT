import { Controller, Get, Header } from '@nestjs/common';
import { HealthService, HealthStatus } from './health.service';
import { AdminService } from './admin/admin.service';

@Controller()
export class AppController {
  constructor(
    private readonly healthService: HealthService,
    private readonly adminService: AdminService,
  ) {}

  @Get(['', 'health', 'api/health', 'api/v1/health', 'api/v1'])
  health(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  @Get(['system/maintenance-status', 'api/system/maintenance-status'])
  async getMaintenanceStatus() {
    return this.adminService.getMaintenanceStatus();
  }

  @Get(['sitemap.xml', 'api/sitemap.xml'])
  @Header('Content-Type', 'application/xml; charset=utf-8')
  getSitemap(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cbt.aurikrex.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://cbt.aurikrex.com/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://cbt.aurikrex.com/register</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://cbt.aurikrex.com/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://cbt.aurikrex.com/help</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
  }

  @Get(['robots.txt', 'api/robots.txt'])
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getRobots(): string {
    return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://cbt.aurikrex.com/sitemap.xml`;
  }
}

