import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards, ValidationPipe } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateHandoffDto, ExchangeHandoffDto, LearningEventDto } from './handoff.dto';
import { IntegrationService } from './integration.service';

@Controller('v1')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('auth/handoffs')
  @UseGuards(JwtAuthGuard)
  createHandoff(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateHandoffDto,
  ) {
    return this.integrationService.createHandoff(req.user.sub, dto);
  }

  @Post('auth/handoffs/exchange')
  exchangeHandoff(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: ExchangeHandoffDto,
  ) {
    return this.integrationService.exchangeHandoff(dto.handoff);
  }

  @Get('topics/:subjectId/:topicId')
  resolveTopic(@Param('subjectId') subjectId: string, @Param('topicId') topicId: string) {
    return this.integrationService.resolveTopic(subjectId, topicId);
  }

  @Post('events/learning')
  async ingestEvent(
    @Req() req: Request,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: LearningEventDto,
  ) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('Integration session required.');
    const userId = await this.integrationService.verifyIntegrationSession(token);
    return this.integrationService.ingestEvent(userId, dto);
  }
}
