import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE_CONNECTION');

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');

        if (!url) {
          throw new Error('DATABASE_URL must be defined');
        }

        const client = postgres(url, { ssl: 'require', max: 10 });

        try {
          await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS aurikrex_id text UNIQUE;`;
          await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS auri_coins_balance integer DEFAULT 5000;`;
          await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS auri_coins_last_reset timestamp DEFAULT now();`;
          await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS auri_coins_monthly_allowance integer DEFAULT 5000;`;
          await client`
            CREATE TABLE IF NOT EXISTS auri_coin_ledger (
              id text PRIMARY KEY,
              user_id text NOT NULL,
              app_id text NOT NULL,
              feature_name text NOT NULL,
              amount integer NOT NULL,
              balance_after integer NOT NULL,
              metadata jsonb,
              created_at timestamp DEFAULT now()
            );
          `;
          await client`
            CREATE TABLE IF NOT EXISTS sso_clients (
              id text PRIMARY KEY,
              client_id text NOT NULL UNIQUE,
              client_name text NOT NULL,
              client_secret_hash text,
              redirect_uris jsonb NOT NULL,
              allowed_scopes jsonb NOT NULL,
              created_at timestamp DEFAULT now()
            );
          `;
          await client`
            CREATE TABLE IF NOT EXISTS sso_codes (
              id text PRIMARY KEY,
              code text NOT NULL UNIQUE,
              client_id text NOT NULL,
              aurikrex_id text NOT NULL,
              code_challenge text,
              code_challenge_method text,
              redirect_uri text NOT NULL,
              scope text,
              expires_at timestamp NOT NULL,
              created_at timestamp DEFAULT now()
            );
          `;
          console.log('[DATABASE] Auto-migration for aurikrex_id, Auri Coins, and SSO tables completed successfully.');
        } catch (err) {
          console.warn('[DATABASE] Auto-migration warning:', err);
        }

        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
