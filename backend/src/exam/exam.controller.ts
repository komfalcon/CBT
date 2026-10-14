import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExamService } from './exam.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SaveAnswersDto } from './dto/save-answers.dto';
import { ClefDecisionService } from '../ai/clef-decision.service';

@Controller('exam')
@UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly clefDecisionService: ClefDecisionService,
  ) { }

  @Post('sessions')
  async createSession(
    @CurrentUser() user: any,
    @Body() body: CreateSessionDto,
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
    @Body() body: SaveAnswersDto,
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
  async submitSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
    @Body() body?: { reason?: 'time_expired' | 'tab_switch' | 'cheating_disqualification' | 'user_submitted' },
  ) {
    return this.examService.submitSession(sessionId, user.sub, body?.reason);
  }

  /**
   * Feature 2: Visual AI Proctoring with Clef & Strike Enforcement
   * Evaluates webcam frame snapshots for multiple people, cell phones, or looking away.
   * Enforces 3-strike disqualification rule.
   */
  @Post('sessions/:sessionId/proctor')
  async evaluateProctoring(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
    @Body() body: { image: string },
  ) {
    if (!body?.image) {
      const strikes = await this.examService.getSessionStrikes(sessionId, user.sub);
      return { violationFlagged: false, strikes, disqualified: false };
    }
    const result = await this.clefDecisionService.evaluateProctoringFrame(body.image);
    if (result.violationFlagged) {
      const strikeData = await this.examService.recordProctorViolation(sessionId, user.sub, result.reasons);
      return {
        ...result,
        ...strikeData,
      };
    }
    const strikes = await this.examService.getSessionStrikes(sessionId, user.sub);
    return {
      ...result,
      strikes,
      disqualified: false,
    };
  }

  /**
   * Feature 4: Adaptive Exam Routing with Clef
   * Dynamically evaluates candidate performance metrics and recommends difficulty progression.
   */
  @Post('sessions/:sessionId/adaptive-evaluate')
  async evaluateAdaptive(
    @CurrentUser() _user: any,
    @Param('sessionId') _sessionId: string,
    @Body() body: {
      recentAccuracyPercent: number;
      avgTimeSeconds: number;
      currentDifficulty: string;
      unansweredStreak: number;
    },
  ) {
    return this.clefDecisionService.evaluateAdaptiveRouting({
      recentAccuracyPercent: body.recentAccuracyPercent ?? 50,
      avgTimeSeconds: body.avgTimeSeconds ?? 45,
      currentDifficulty: body.currentDifficulty ?? 'medium',
      unansweredStreak: body.unansweredStreak ?? 0,
    });
  }
}

