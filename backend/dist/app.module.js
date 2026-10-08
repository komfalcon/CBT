"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./db/database.module");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const exam_module_1 = require("./exam/exam.module");
const questions_module_1 = require("./questions/questions.module");
const results_module_1 = require("./results/results.module");
const analytics_module_1 = require("./analytics/analytics.module");
const notifications_module_1 = require("./notifications/notifications.module");
const ai_module_1 = require("./ai/ai.module");
const payments_module_1 = require("./payments/payments.module");
const admin_module_1 = require("./admin/admin.module");
const study_module_1 = require("./study/study.module");
const arena_module_1 = require("./arena/arena.module");
const leaderboard_module_1 = require("./leaderboard/leaderboard.module");
const integration_module_1 = require("./integration/integration.module");
const upload_module_1 = require("./upload/upload.module");
const sso_module_1 = require("./auth/sso/sso.module");
const coins_module_1 = require("./coins/coins.module");
const central_module_1 = require("./central/central.module");
const app_controller_1 = require("./app.controller");
const health_service_1 = require("./health.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60_000,
                    limit: 100,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            database_module_1.DatabaseModule,
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                autoSchemaFile: true,
                playground: process.env.NODE_ENV !== 'production',
                context: ({ req }) => ({ req }),
            }),
            auth_module_1.AuthModule,
            sso_module_1.SsoModule,
            coins_module_1.CoinsModule,
            central_module_1.CentralModule,
            exam_module_1.ExamModule,
            questions_module_1.QuestionsModule,
            results_module_1.ResultsModule,
            analytics_module_1.AnalyticsModule,
            notifications_module_1.NotificationsModule,
            ai_module_1.AiModule,
            payments_module_1.PaymentsModule,
            admin_module_1.AdminModule,
            study_module_1.StudyModule,
            arena_module_1.ArenaModule,
            leaderboard_module_1.LeaderboardModule,
            integration_module_1.IntegrationModule,
            upload_module_1.UploadModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            health_service_1.HealthService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map