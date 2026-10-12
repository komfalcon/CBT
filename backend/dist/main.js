"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const helmet_1 = __importDefault(require("helmet"));
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const admin_service_1 = require("./admin/admin.service");
const express_1 = require("express");
let serverListening = false;
process.on('unhandledRejection', (reason) => {
    if (reason?.code === 'ECONNRESET' ||
        reason?.code === 'EPIPE' ||
        reason?.code === 'ETIMEDOUT' ||
        reason?.message?.includes('ECONNRESET') ||
        reason?.message?.includes('read ECONNRESET')) {
        console.warn('[NETWORK WARNING] Non-fatal transient socket reset in unhandledRejection:', reason?.message || reason);
        return;
    }
    console.error('[CRITICAL SERVER ERROR] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
    const isNetworkReset = err?.code === 'ECONNRESET' ||
        err?.code === 'EPIPE' ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ECONNREFUSED' ||
        err?.syscall === 'read' ||
        err?.message?.includes('ECONNRESET') ||
        err?.message?.includes('read ECONNRESET');
    if (isNetworkReset) {
        console.warn('[NETWORK WARNING] Non-fatal transient socket reset caught:', err?.message || err);
        return;
    }
    console.error('[CRITICAL SERVER ERROR] Uncaught Exception:', err);
    setTimeout(() => process.exit(1), 500);
});
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' }));
    const configuredOrigins = process.env.ALLOWED_ORIGINS
        ?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const allowedOrigins = configuredOrigins?.length ? configuredOrigins : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'https://cbt.aurikrex.com',
        'https://www.cbt.aurikrex.com',
        'https://library.aurikrex.com',
        'https://www.library.aurikrex.com',
        'https://bytes.aurikrex.com',
        'https://www.bytes.aurikrex.com',
        'https://phorynt.aurikrex.com',
        'https://www.phorynt.aurikrex.com',
        'https://vault.aurikrex.com',
        'https://aurikrex.com',
        'https://www.aurikrex.com',
        'https://cbt.aurikrex.tech',
        'https://www.cbt.aurikrex.tech',
        'https://library.aurikrex.tech',
        'https://www.library.aurikrex.tech',
        'https://cbt-vl4x.onrender.com',
        'https://cbt.pxxl.click',
    ];
    const isAllowedDomain = (originStr) => {
        if (!originStr)
            return true;
        if (allowedOrigins.includes(originStr) || allowedOrigins.includes('*'))
            return true;
        try {
            const host = new URL(originStr).hostname;
            return (host.endsWith('.aurikrex.com') ||
                host.endsWith('.aurikrex.tech') ||
                host.endsWith('.pxxl.click') ||
                host === 'aurikrex.com' ||
                host === 'aurikrex.tech' ||
                host === 'pxxl.click' ||
                host === 'localhost' ||
                host === '127.0.0.1');
        }
        catch {
            return false;
        }
    };
    app.enableCors({
        origin: (origin, callback) => {
            callback(null, !origin || isAllowedDomain(origin));
        },
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-CSRF-Token',
            'X-Aurikrex-Internal-Key',
            'x-central-api-key',
            'Accept',
            'X-Requested-With',
        ],
        credentials: true,
    });
    app.use((0, helmet_1.default)({ crossOriginOpenerPolicy: false }));
    app.use((req, res, next) => {
        if (req.method === 'OPTIONS')
            return next();
        const cookieHeader = String(req.headers.cookie || '');
        const csrfCookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith('csrf_token='))?.slice('csrf_token='.length);
        const csrfToken = csrfCookie || (0, crypto_1.randomBytes)(24).toString('hex');
        if (!csrfCookie)
            res.setHeader('Set-Cookie', `csrf_token=${csrfToken}; Path=/; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
        const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
        const publicPath = /^\/auth\/(login|register|google|login\/cbt-key|forgot-password|reset-password|verify-email)$/.test(req.path || '');
        if (unsafe && !publicPath) {
            const origin = req.headers.origin;
            const originAllowed = !origin || isAllowedDomain(origin);
            if (req.headers['x-csrf-token'] !== csrfToken && !originAllowed)
                return res.status(403).json({ message: 'CSRF validation failed.' });
        }
        next();
    });
    const adminService = app.get(admin_service_1.AdminService);
    app.use(async (req, res, next) => {
        if (req.method === 'OPTIONS')
            return next();
        const rawPath = String(req.path || req.originalUrl || '');
        const cleanPath = rawPath.replace(/^\/api/, '');
        const isExempt = /^\/($|admin|sys|health|system\/maintenance-status|sitemap\.xml|robots\.txt)/.test(cleanPath);
        const isAuthRoute = /^\/auth\/(login|refresh|logout|verify-otp|me)/.test(cleanPath);
        try {
            const cookieHeader = String(req.headers.cookie || '');
            const token = cookieHeader.split(';').map((p) => p.trim()).find((p) => p.startsWith('cbt_access_token='))?.slice(17)
                || String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
            if (token) {
                const jwt = require('jsonwebtoken');
                const publicKeyB64 = process.env.JWT_PUBLIC_KEY || '';
                const secretKey = publicKeyB64 ? Buffer.from(publicKeyB64, 'base64').toString('utf8') : (process.env.JWT_SECRET || 'aurikrex-sso-secret-key-2026');
                const payload = jwt.verify(token, secretKey, { algorithms: publicKeyB64 ? ['RS256', 'HS256'] : ['HS256', 'RS256'] });
                if (payload && (payload.role === 'admin' || payload.role === 'super_admin')) {
                    return next();
                }
            }
        }
        catch {
        }
        if (!isExempt && !isAuthRoute) {
            try {
                const status = await adminService.getMaintenanceStatus();
                if (status.isMaintenance) {
                    return res.status(503).json({
                        statusCode: 503,
                        error: 'Service Unavailable',
                        message: 'The Aurikrex CBT platform is currently undergoing scheduled maintenance. Please check back shortly.',
                        isMaintenance: true,
                    });
                }
            }
            catch {
            }
        }
        next();
    });
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    console.log(`[BOOTSTRAP] Starting server on port ${port}`);
    await app.listen(port);
    serverListening = true;
    console.log(`[BOOTSTRAP] NestJS Application listening on port ${port}`);
}
async function startWithRetry(maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await bootstrap();
            return;
        }
        catch (err) {
            console.error(`[BOOTSTRAP] Startup attempt ${attempt}/${maxAttempts} failed:`, err);
            if (attempt === maxAttempts)
                break;
            await new Promise((r) => setTimeout(r, attempt * 3000));
        }
    }
    console.error('[BOOTSTRAP] All startup attempts failed. Exiting so the platform restarts the container.');
    process.exit(1);
}
void startWithRetry();
setTimeout(() => {
    if (!serverListening) {
        console.error('[BOOTSTRAP] Server not listening after 120s. Exiting for restart.');
        process.exit(1);
    }
}, 120_000).unref();
//# sourceMappingURL=main.js.map