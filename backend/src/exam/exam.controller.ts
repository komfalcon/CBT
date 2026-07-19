import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExamService } from './exam.service';

@Controller('exam')
@UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('sessions')
  async createSession(
    @CurrentUser() user: any,
    @Body() body: { 
      type: 'mock' | 'drill'
      subject?: string
      subjects?: string[]
      subjectConfigs?: Record<string, { mode: 'random' | 'specific'; topics: string[] }>
      count?: number
      difficultyLevel?: string
      topics?: string[]
    },
  ) {
    const session = await this.examService.createSession(
      user.sub,
      body.type,
      body.subject,
      body.subjects,
      body.subjectConfigs,
      body.count,
      body.difficultyLevel,
      body.topics
    );
    return this.examService.sanitizeSession(session);
  }

  @Get('sessions/:sessionId')
  async getSession(@CurrentUser() user: any, @Param('sessionId') sessionId: string) {
    const session = await this.examService.getSession(sessionId, user.sub);
    
    // If the session is already completed, we can return the raw version or refer them to results.
    // If it's active, sanitize it to strip correct options.
    if (session.status === 'active') {
      return this.examService.sanitizeSession(session);
    }
    return session;
  }

  @Post('sessions/:sessionId/answers')
  async saveAnswers(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
    @Body() body: { answers: Record<string, string>; timeRemaining: number },
  ) {
    const session = await this.examService.saveAnswers(
      sessionId,
      user.sub,
      body.answers,
      body.timeRemaining,
    );
    return this.examService.sanitizeSession(session);
  }

  @Post('sessions/:sessionId/submit')
  async submitSession(@CurrentUser() user: any, @Param('sessionId') sessionId: string) {
    return this.examService.submitSession(sessionId, user.sub);
  }
}
