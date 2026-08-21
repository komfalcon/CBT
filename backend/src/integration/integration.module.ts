import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { Handoff, HandoffSchema } from './handoff.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Handoff.name, schema: HandoffSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
