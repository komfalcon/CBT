import { Module } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { CoinsController } from './coins.controller';
import { DatabaseModule } from '../db/database.module';
import { CentralModule } from '../central/central.module';

@Module({
  imports: [DatabaseModule, CentralModule],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
