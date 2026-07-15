import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('verify')
  async verifyPayment(
    @CurrentUser() user: any,
    @Body() body: { reference: string; planCode: string },
  ) {
    const updatedUser = await this.paymentsService.verifyTransaction(user.sub, body.reference, body.planCode);
    return {
      message: 'Subscription successfully upgraded.',
      subscription_tier: updatedUser.subscription_tier,
      ai_messages_remaining: updatedUser.ai_messages_remaining,
    };
  }
}
