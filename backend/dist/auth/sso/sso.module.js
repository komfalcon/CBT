"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsoModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const sso_service_1 = require("./sso.service");
const sso_controller_1 = require("./sso.controller");
const database_module_1 = require("../../db/database.module");
let SsoModule = class SsoModule {
};
exports.SsoModule = SsoModule;
exports.SsoModule = SsoModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'aurikrex-sso-secret-key-2026',
                    signOptions: { expiresIn: '24h' },
                }),
            }),
        ],
        controllers: [sso_controller_1.SsoController],
        providers: [sso_service_1.SsoService],
        exports: [sso_service_1.SsoService],
    })
], SsoModule);
//# sourceMappingURL=sso.module.js.map