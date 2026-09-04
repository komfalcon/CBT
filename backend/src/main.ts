import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { randomBytes } from 'crypto';

import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins = configuredOrigins?.length ? configuredOrigins : [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://cbt.aurikrex.tech',
    'https://www.cbt.aurikrex.tech',
    'https://library.aurikrex.tech',
    'https://www.library.aurikrex.tech',
    'https://cbt-vl4x.onrender.com'
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
  });
  app.use(helmet({ crossOriginOpenerPolicy: false }));

  // Bind state-changing browser requests to the same-site session. Auth bootstrap routes are public;
  // all other unsafe methods require either a matching double-submit token or an allowed Origin.
  app.use((req: any, res: any, next: any) => {
    const cookieHeader = String(req.headers.cookie || '');
    const csrfCookie = cookieHeader.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('csrf_token='))?.slice('csrf_token='.length);
    const csrfToken = csrfCookie || randomBytes(24).toString('hex');
    if (!csrfCookie) res.setHeader('Set-Cookie', `csrf_token=${csrfToken}; Path=/; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const publicPath = /^\/auth\/(login|register|google|login\/cbt-key|forgot-password|reset-password|verify-email)$/.test(req.path || '');
    if (unsafe && !publicPath) {
      const origin = req.headers.origin;
      const originAllowed = !origin || allowedOrigins.includes(origin);
      if (req.headers['x-csrf-token'] !== csrfToken && !originAllowed) return res.status(403).json({ message: 'CSRF validation failed.' });
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
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
