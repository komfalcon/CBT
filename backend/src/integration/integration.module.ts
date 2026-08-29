import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
