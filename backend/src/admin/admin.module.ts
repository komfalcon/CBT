import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ExamSession, ExamSessionSchema } from '../exam/schemas/session.schema';
import { PaymentLog, PaymentLogSchema } from '../payments/schemas/payment-log.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ExamSession.name, schema: ExamSessionSchema },
      { name: PaymentLog.name, schema: PaymentLogSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
