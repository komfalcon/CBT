import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';
import { SyllabusTracker, SyllabusTrackerSchema } from './schemas/syllabus.schema';
import { Timetable, TimetableSchema } from './schemas/timetable.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SyllabusTracker.name, schema: SyllabusTrackerSchema },
      { name: Timetable.name, schema: TimetableSchema },
    ]),
  ],
  controllers: [StudyController],
  providers: [StudyService],
  exports: [StudyService],
})
export class StudyModule {}
