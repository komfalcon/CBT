import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StudyService } from './study.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('study')
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  // ---- Syllabus Routes ----

  @Get('syllabus')
  async getAllSyllabus(@Request() req: any) {
    return this.studyService.getAllSyllabusProgress(req.user.id || req.user.sub);
  }

  @Get('syllabus/:subject')
  async getSyllabus(@Request() req: any, @Param('subject') subject: string) {
    return this.studyService.getSyllabusProgress(req.user.id || req.user.sub, subject);
  }

  @Post('syllabus/:subject/topic')
  async updateTopic(
    @Request() req: any, 
    @Param('subject') subject: string,
    @Body() body: { topic: string, completed: boolean }
  ) {
    return this.studyService.updateTopicStatus(req.user.id || req.user.sub, subject, body.topic, body.completed);
  }

  // ---- Timetable Routes ----

  @Get('timetable')
  async getTimetable(@Request() req: any) {
    return this.studyService.getTimetable(req.user.id || req.user.sub);
  }

  @Post('timetable/session')
  async addSession(@Request() req: any, @Body() body: any) {
    return this.studyService.addSession(req.user.id || req.user.sub, body);
  }

  @Put('timetable/session/:id')
  async updateSession(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.studyService.updateSession(req.user.id || req.user.sub, id, body);
  }

  @Delete('timetable/session/:id')
  async deleteSession(@Request() req: any, @Param('id') id: string) {
    return this.studyService.deleteSession(req.user.id || req.user.sub, id);
  }
}
