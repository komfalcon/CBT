import { Controller, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
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

  @Post('chat')
  async chatWithTutor(
    @Request() req: any,
    @Body() body: { message: string; history: any[]; contextPayload?: string }
  ) {
    return this.aiService.chatWithTutor(
      req.user.sub,
      body.message,
      body.history || [],
      body.contextPayload
    );
  }
  @Post('generate-diagram/:questionId')
  async generateDiagram(@Param('questionId') questionId: string) {
    const svg = await this.aiService.generateDiagram(questionId);
    return { svg };
  }
}
