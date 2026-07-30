import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SyllabusTracker } from './schemas/syllabus.schema';
import { Timetable, StudySession } from './schemas/timetable.schema';

@Injectable()
export class StudyService {
  constructor(
    @InjectModel(SyllabusTracker.name) private syllabusModel: Model<SyllabusTracker>,
    @InjectModel(Timetable.name) private timetableModel: Model<Timetable>,
  ) {}

  // ---- Syllabus Methods ----

  async getSyllabusProgress(userId: string, subject: string): Promise<SyllabusTracker> {
    let tracker = await this.syllabusModel.findOne({ user: userId, subject });
    if (!tracker) {
      tracker = await this.syllabusModel.create({
        user: userId,
        subject,
        completedTopics: [],
        progress: 0,
      });
    }
    return tracker;
  }

  async getAllSyllabusProgress(userId: string): Promise<SyllabusTracker[]> {
    return this.syllabusModel.find({ user: userId });
  }

  async updateTopicStatus(userId: string, subject: string, topic: string, completed: boolean): Promise<SyllabusTracker> {
    let tracker = await this.getSyllabusProgress(userId, subject);

    if (completed && !tracker.completedTopics.includes(topic)) {
      tracker.completedTopics.push(topic);
    } else if (!completed && tracker.completedTopics.includes(topic)) {
      tracker.completedTopics = tracker.completedTopics.filter(t => t !== topic);
    }

    // Optionally calculate progress % if you know total topics per subject
    // For now we just save the array
    await tracker.save();
    return tracker;
  }

  // ---- Timetable Methods ----

  async getTimetable(userId: string): Promise<Timetable> {
    let timetable = await this.timetableModel.findOne({ user: userId });
    if (!timetable) {
      timetable = await this.timetableModel.create({
        user: userId,
        sessions: [],
      });
    }
    return timetable;
  }

  async addSession(userId: string, sessionData: any): Promise<Timetable> {
    const timetable = await this.getTimetable(userId);
    timetable.sessions.push({
      _id: new Types.ObjectId().toHexString(),
      ...sessionData,
    });
    await timetable.save();
    return timetable;
  }

  async updateSession(userId: string, sessionId: string, updateData: any): Promise<Timetable> {
    const timetable = await this.getTimetable(userId);
    const sessionIndex = timetable.sessions.findIndex(s => s._id === sessionId);
    
    if (sessionIndex === -1) {
      throw new NotFoundException('Session not found');
    }

    timetable.sessions[sessionIndex] = {
      ...timetable.sessions[sessionIndex],
      ...updateData,
    };

    // Mongoose array markModified
    timetable.markModified('sessions');
    await timetable.save();
    return timetable;
  }

  async deleteSession(userId: string, sessionId: string): Promise<Timetable> {
    const timetable = await this.getTimetable(userId);
    timetable.sessions = timetable.sessions.filter(s => s._id !== sessionId);
    await timetable.save();
    return timetable;
  }
}
