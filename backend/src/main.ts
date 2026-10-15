import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { randomBytes } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AdminService } from './admin/admin.service';

import { json, urlencoded } from 'express';

let serverListening = false;

process.on('unhandledRejection', (reason: any) => {
  if (
    reason?.code === 'ECONNRESET' ||
    reason?.code === 'EPIPE' ||
    reason?.code === 'ETIMEDOUT' ||
    reason?.message?.includes('ECONNRESET') ||
    reason?.message?.includes('read ECONNRESET')
  ) {
    console.warn('[NETWORK WARNING] Non-fatal transient socket reset in unhandledRejection:', reason?.message || reason);
    return;
  }
  console.error('[CRITICAL SERVER ERROR] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err: any) => {
  // Transient network socket resets (ECONNRESET, EPIPE, etc.) are normal I/O stream drops
  // when idle connections are closed by load balancers or remote databases.
  // They do NOT corrupt memory state and must NOT kill the process in dev or prod.
  const isNetworkReset =
    err?.code === 'ECONNRESET' ||
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
  // A process that threw an unhandled runtime error is in an undefined state.
  // Exit so the hosting platform restarts a clean container instead of serving 502s.
  setTimeout(() => process.exit(1), 500);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

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

  const isAllowedDomain = (originStr?: string): boolean => {
    if (!originStr) return true;
    if (allowedOrigins.includes(originStr) || allowedOrigins.includes('*')) return true;
    try {
      const host = new URL(originStr).hostname;
      return (
        host.endsWith('.aurikrex.com') ||
        host.endsWith('.aurikrex.tech') ||
        host.endsWith('.pxxl.click') ||
        host === 'aurikrex.com' ||
        host === 'aurikrex.tech' ||
        host === 'pxxl.click' ||
        host === 'localhost' ||
        host === '127.0.0.1'
      );
    } catch {
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
  app.use(helmet({ crossOriginOpenerPolicy: false }));

  app.use((req: any, res: any, next: any) => {
    if (req.method === 'OPTIONS') return next();
    const cookieHeader = String(req.headers.cookie || '');
    const csrfCookie = cookieHeader.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('csrf_token='))?.slice('csrf_token='.length);
    const csrfToken = csrfCookie || randomBytes(24).toString('hex');
    if (!csrfCookie) res.setHeader('Set-Cookie', `csrf_token=${csrfToken}; Path=/; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const publicPath = /^\/auth\/(login|register|google|login\/cbt-key|forgot-password|reset-password|verify-email)$/.test(req.path || '');
    if (unsafe && !publicPath) {
      const origin = req.headers.origin;
      const originAllowed = !origin || isAllowedDomain(origin);
      if (req.headers['x-csrf-token'] !== csrfToken && !originAllowed) return res.status(403).json({ message: 'CSRF validation failed.' });
    }
    next();
  });

  const adminService = app.get(AdminService);
  app.use(async (req: any, res: any, next: any) => {
    if (req.method === 'OPTIONS') return next();
    const rawPath = String(req.path || req.originalUrl || '');
    const cleanPath = rawPath.replace(/^\/api/, '');
    const isExempt = /^\/($|admin|sys|health|system\/maintenance-status|sitemap\.xml|robots\.txt)/.test(cleanPath);
    const isAuthRoute = /^\/auth\/(login|refresh|logout|verify-otp|me)/.test(cleanPath);

    // If request contains a verified admin JWT in cookie or Authorization header, bypass maintenance
    try {
      const cookieHeader = String(req.headers.cookie || '');
      const token = cookieHeader.split(';').map((p: string) => p.trim()).find((p: string) => p.startsWith('cbt_access_token='))?.slice(17)
        || String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (token) {
        const jwt = require('jsonwebtoken');
        const publicKeyB64 = process.env.JWT_PUBLIC_KEY || '';
        const secretKey = publicKeyB64 ? Buffer.from(publicKeyB64, 'base64').toString('utf8') : (process.env.JWT_SECRET || 'aurikrex-sso-secret-key-2026');
        const payload: any = jwt.verify(token, secretKey, { algorithms: publicKeyB64 ? ['RS256', 'HS256'] : ['HS256', 'RS256'] });
        if (payload && (payload.role === 'admin' || payload.role === 'super_admin')) {
          return next();
        }
      }
    } catch {
      // Ignore invalid/unverified tokens and continue
    }

    if (!isExempt && !isAuthRoute) {
      try {
        const status = await adminService.getMaintenanceStatus();
        if (status.isMaintenance) {
          return res.status(503).json({
            statusCode: 503,
            error: 'Service Unavailable',
            message: 'The Falke AI CBT platform is currently under active development and scheduled maintenance. Please check back shortly.',
            isMaintenance: true,
          });
        }
      } catch {
        // Fallback to allow if error
      }
    }
    next();
  });
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

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
    } catch (err) {
      console.error(`[BOOTSTRAP] Startup attempt ${attempt}/${maxAttempts} failed:`, err);
      if (attempt === maxAttempts) break;
      await new Promise((r) => setTimeout(r, attempt * 3000));
    }
  }
  console.error('[BOOTSTRAP] All startup attempts failed. Exiting so the platform restarts the container.');
  process.exit(1);
}

void startWithRetry();

// Watchdog: if the HTTP server never comes up, don't sit there as a zombie returning 502s.
setTimeout(() => {
  if (!serverListening) {
    console.error('[BOOTSTRAP] Server not listening after 120s. Exiting for restart.');
    process.exit(1);
  }
}, 120_000).unref();
