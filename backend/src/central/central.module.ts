import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CentralService } from './central.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CentralService],
  exports: [CentralService],
})
export class CentralModule {}
