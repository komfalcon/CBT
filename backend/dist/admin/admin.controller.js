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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getOverviewStats() {
        return this.adminService.getOverviewStats();
    }
    getMaintenanceStatus() {
        return this.adminService.getMaintenanceStatus();
    }
    toggleMaintenance(user, password, enabled, isMaintenance) {
        const targetState = enabled !== undefined ? enabled : isMaintenance;
        return this.adminService.toggleMaintenance(user?.sub || 'admin', password, targetState);
    }
    listUsers(search, role, status, page = '1', limit = '20') {
        return this.adminService.listUsers({
            search,
            role,
            status,
            page: Number(page) || 1,
            limit: Number(limit) || 20,
        });
    }
    updateUserStatus(userId, status) {
        return this.adminService.updateUserStatus(userId, status);
    }
    generateBulkKeys(count) {
        return this.adminService.generateBulkKeys(count);
    }
    listBillingLogs(page = '1', limit = '20') {
        return this.adminService.listBillingLogs({
            page: Number(page) || 1,
            limit: Number(limit) || 20,
        });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getOverviewStats", null);
__decorate([
    (0, common_1.Get)('maintenance/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getMaintenanceStatus", null);
__decorate([
    (0, common_1.Post)('maintenance/toggle'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('password')),
    __param(2, (0, common_1.Body)('enabled')),
    __param(3, (0, common_1.Body)('isMaintenance')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean, Boolean]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "toggleMaintenance", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Patch)('users/:userId/status'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Post)('cbt-keys/generate'),
    __param(0, (0, common_1.Body)('count')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "generateBulkKeys", null);
__decorate([
    (0, common_1.Get)('billing/logs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listBillingLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map