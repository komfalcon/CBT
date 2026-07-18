import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResultsService } from './results.service';

@Controller('results')
@UseGuards(JwtAuthGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  async listResults(@CurrentUser() user: any) {
    return this.resultsService.listResults(user.sub);
  }

  @Get('topic-stats')
  async getTopicStats(@CurrentUser() user: any) {
    return this.resultsService.getTopicStats(user.sub);
  }

  @Get(':resultId')
  async getResult(@CurrentUser() user: any, @Param('resultId') resultId: string) {
    return this.resultsService.getResult(resultId, user.sub);
  }
}
