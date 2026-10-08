"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const health_service_1 = require("./health.service");
const admin_service_1 = require("./admin/admin.service");
let AppController = class AppController {
    constructor(healthService, adminService) {
        this.healthService = healthService;
        this.adminService = adminService;
    }
    health() {
        return this.healthService.check();
    }
    async getMaintenanceStatus() {
        return this.adminService.getMaintenanceStatus();
    }
    getSitemap() {
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
    getRobots() {
        return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://cbt.aurikrex.com/sitemap.xml`;
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(['', 'health', 'api/health', 'api/v1/health', 'api/v1']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "health", null);
__decorate([
    (0, common_1.Get)(['system/maintenance-status', 'api/system/maintenance-status']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMaintenanceStatus", null);
__decorate([
    (0, common_1.Get)(['sitemap.xml', 'api/sitemap.xml']),
    (0, common_1.Header)('Content-Type', 'application/xml; charset=utf-8'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getSitemap", null);
__decorate([
    (0, common_1.Get)(['robots.txt', 'api/robots.txt']),
    (0, common_1.Header)('Content-Type', 'text/plain; charset=utf-8'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getRobots", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [health_service_1.HealthService,
        admin_service_1.AdminService])
], AppController);
//# sourceMappingURL=app.controller.js.map