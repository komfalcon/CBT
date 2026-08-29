import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE_CONNECTION');

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const url = configService.get<string>('TURSO_DATABASE_URL');
        const authToken = configService.get<string>('TURSO_AUTH_TOKEN');

        if (!url || !authToken) {
          throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be defined');
        }

        const client = createClient({ url, authToken });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
