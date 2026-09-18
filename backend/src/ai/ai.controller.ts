import { Controller, Post, Body, UseGuards, Request, Param, Get, Delete } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('explain')
  async explainQuestion(
    @Request() req: any,
    @Body() body: { questionId?: string; questionText: string; correctAnswer: string; studentAnswer: string }
  ) {
    return this.aiService.generateExplanation(
      req.user.sub,
      body.questionText,
      body.correctAnswer,
      body.studentAnswer,
      body.questionId
    );
  }

  @Get('sessions')
  async getChatSessions(@Request() req: any) {
    return this.aiService.getChatSessions(req.user.sub);
  }

  @Post('sessions')
  async createChatSession(@Request() req: any, @Body() body: { title: string }) {
    return this.aiService.createChatSession(req.user.sub, body.title);
  }

  @Get('sessions/:sessionId')
  async getChatSession(@Request() req: any, @Param('sessionId') sessionId: string) {
    return this.aiService.getChatSession(req.user.sub, sessionId);
  }

  @Delete('sessions/:sessionId')
  async deleteChatSession(@Request() req: any, @Param('sessionId') sessionId: string) {
    return this.aiService.deleteChatSession(req.user.sub, sessionId);
  }

  @Post('chat')
  async chatWithTutor(
    @Request() req: any,
    @Body() body: { message: string; history: any[]; contextPayload?: string; sessionId?: string }
  ) {
    return this.aiService.chatWithTutor(
      req.user.sub,
      body.message,
      body.history || [],
      body.contextPayload,
      body.sessionId
    );
  }
  @Post('generate-diagram/:questionId')
  async generateDiagram(@Param('questionId') questionId: string) {
    const svg = await this.aiService.generateDiagram(questionId);
    return { svg };
  }
}
