import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../db/database.module';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

@Injectable()
export class StudyService {
  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  // ---- Syllabus Methods ----

  async getSyllabusProgress(userId: string, subject: string) {
    let tracker = await this.db.select().from(schema.syllabus_trackers)
      .where(and(eq(schema.syllabus_trackers.userId, userId), eq(schema.syllabus_trackers.subject, subject)))
      .limit(1)
      .then(res => res[0]);

    if (!tracker) {
      tracker = await this.db.insert(schema.syllabus_trackers).values({
        id: randomUUID(),
        userId: userId,
        subject,
        completedTopics: [],
        progress: 0,
      }).returning().then(res => res[0]);
    }
    return tracker;
  }

  async getAllSyllabusProgress(userId: string) {
    return this.db.select().from(schema.syllabus_trackers).where(eq(schema.syllabus_trackers.userId, userId));
  }

  async updateTopicStatus(userId: string, subject: string, topic: string, completed: boolean) {
    let tracker = await this.getSyllabusProgress(userId, subject);

    let completedTopics = (tracker.completedTopics as string[]) || [];

    if (completed && !completedTopics.includes(topic)) {
      completedTopics.push(topic);
    } else if (!completed && completedTopics.includes(topic)) {
      completedTopics = completedTopics.filter(t => t !== topic);
    }

    tracker = await this.db.update(schema.syllabus_trackers).set({
      completedTopics
    }).where(eq(schema.syllabus_trackers.id, tracker.id)).returning().then(res => res[0]);

    return tracker;
  }

  // ---- Timetable Methods ----

  async getTimetable(userId: string) {
    let timetable = await this.db.select().from(schema.timetables)
      .where(eq(schema.timetables.userId, userId))
      .limit(1)
      .then(res => res[0]);

    if (!timetable) {
      timetable = await this.db.insert(schema.timetables).values({
        id: randomUUID(),
        userId: userId,
        sessions: [],
      }).returning().then(res => res[0]);
    }
    
    if (!timetable.sessions) {
      timetable.sessions = [];
    }

    return timetable;
  }

  async addSession(userId: string, sessionData: any) {
    const timetable = await this.getTimetable(userId);
    const sessions = (timetable.sessions as any[]) || [];
    sessions.push({
      _id: randomUUID(),
      ...sessionData,
    });
    return await this.db.update(schema.timetables)
      .set({ sessions })
      .where(eq(schema.timetables.id, timetable.id))
      .returning()
      .then(res => {
        const t = res[0];
        if (!t.sessions) t.sessions = [];
        return t;
      });
  }

  async updateSession(userId: string, sessionId: string, updateData: any) {
    const timetable = await this.getTimetable(userId);
    const sessions = (timetable.sessions as any[]) || [];
    const sessionIndex = sessions.findIndex(s => s._id === sessionId);
    
    if (sessionIndex === -1) {
      throw new NotFoundException('Session not found');
    }

    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      ...updateData,
    };

    return await this.db.update(schema.timetables)
      .set({ sessions })
      .where(eq(schema.timetables.id, timetable.id))
      .returning()
      .then(res => {
        const t = res[0];
        if (!t.sessions) t.sessions = [];
        return t;
      });
  }

  async deleteSession(userId: string, sessionId: string) {
    const timetable = await this.getTimetable(userId);
    let sessions = (timetable.sessions as any[]) || [];
    sessions = sessions.filter(s => s._id !== sessionId);
    return await this.db.update(schema.timetables)
      .set({ sessions })
      .where(eq(schema.timetables.id, timetable.id))
      .returning()
      .then(res => {
        const t = res[0];
        if (!t.sessions) t.sessions = [];
        return t;
      });
  }
}
