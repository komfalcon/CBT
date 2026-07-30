import { Module } from '@nestjs/common';
import { ArenaGateway } from './arena.gateway';
import { ArenaService } from './arena.service';
import { QuestionsModule } from '../questions/questions.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    QuestionsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
        verifyOptions: { algorithms: ['RS256'] },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ArenaGateway, ArenaService],
})
export class ArenaModule {}
