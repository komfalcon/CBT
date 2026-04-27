import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { FilterQuestionsDto } from './dto/filter-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = { sub?: string; userId?: string; role?: UserRole }>(
    err: unknown,
    user: TUser,
  ): TUser | null {
    if (err) {
      return null;
    }
    return user ?? null;
  }
}

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('examiner', 'admin', 'super_admin')
  create(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) payload: CreateQuestionDto,
    @CurrentUser() user: { sub?: string; userId?: string; role?: UserRole },
  ) {
    return this.questionsService.createQuestion(payload, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('examiner', 'admin', 'super_admin')
  list(@Query(new ValidationPipe({ whitelist: true, transform: true })) filters: FilterQuestionsDto) {
    return this.questionsService.listQuestions(filters);
  }

  @Get('search')
  search(
    @Query('q') q: string,
    @Query('subject') subject?: string,
    @Query('difficulty_level') difficultyLevel?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    if (!q) {
      throw new BadRequestException('q is required');
    }

    return this.questionsService.searchQuestions({
      q,
      subject,
      status,
      difficulty_level: difficultyLevel ? Number(difficultyLevel) : undefined,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
    });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'examiner')
  getStats() {
    return this.questionsService.getStats();
  }

  @Get('subjects')
  getSubjects() {
    return this.questionsService.getPublishedSubjectCounts();
  }

  @Post('bulk-tag')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  bulkTagUpdate(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    payload: { questionIds: string[]; tags: string[]; action: 'add' | 'remove' },
  ) {
    return this.questionsService.bulkTagUpdate(payload);
  }

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('examiner', 'admin', 'super_admin')
  versions(@Param('id') id: string) {
    return this.questionsService.getVersions(id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getById(
    @Param('id') id: string,
    @Req() req: Request & { user?: { sub?: string; userId?: string; role?: UserRole } },
  ) {
    return this.questionsService.getQuestionById(id, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('examiner', 'admin', 'super_admin')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) payload: UpdateQuestionDto,
    @CurrentUser() user: { sub?: string; userId?: string; role?: UserRole },
  ) {
    return this.questionsService.updateQuestion(id, payload, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  remove(@Param('id') id: string) {
    return this.questionsService.retireQuestion(id);
  }

  @Post(':id/rollback/:versionNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  rollback(
    @Param('id') id: string,
    @Param('versionNumber') versionNumber: string,
    @CurrentUser() user: { sub?: string; userId?: string; role?: UserRole },
  ) {
    return this.questionsService.rollbackQuestion(id, Number(versionNumber), user);
  }

  @Patch(':id/submit-for-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('examiner')
  submitForReview(
    @Param('id') id: string,
    @CurrentUser() user: { sub?: string; userId?: string; role?: UserRole },
  ) {
    return this.questionsService.submitForReview(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: { sub?: string; userId?: string; role?: UserRole },
  ) {
    return this.questionsService.approveQuestion(id, user);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  publish(@Param('id') id: string) {
    return this.questionsService.publishQuestion(id);
  }

  @Patch(':id/retire')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  retire(@Param('id') id: string) {
    return this.questionsService.retirePublishedQuestion(id);
  }
}
