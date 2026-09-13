import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test-push')
  async sendTestPush(@Body() body: { title?: string; message?: string }) {
    const title = body.title || 'Aurikrex Practice Alert 🔔';
    const message = body.message || 'It is time to brush up on your JAMB preparation! Take a quick 10-question drill today.';
    const success = await this.notificationsService.sendPushNotification(title, message);
    return {
      success,
      message: success ? 'Test push notification dispatched successfully!' : 'Failed to send notification. Check OneSignal API key configuration.',
    };
  }
}
