import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExamSession, ExamSessionDocument } from './schemas/session.schema';
import { ExamResult, ExamResultDocument } from '../results/schemas/result.schema';
import { Question, QuestionDocument } from '../questions/schemas/question.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(ExamSession.name) private readonly sessionModel: Model<ExamSessionDocument>,
    @InjectModel(ExamResult.name) private readonly resultModel: Model<ExamResultDocument>,
    @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createSession(
    userId: string,
    type: 'mock' | 'drill',
    subject?: string,
    count?: number,
    difficultyLevel?: string,
    topics?: string[]
  ): Promise<ExamSessionDocument> {
    let subjectsList: string[] = [];
    const questionsList: Question[] = [];
    let timeRemaining = 7200; // default 2 hours (120 mins) for mock

    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (type === 'mock') {
      const tier = user.subscription_tier || 'free';
      let limit = 0;
      if (tier === 'plus') {
        limit = 1;
      } else if (tier === 'pro') {
        limit = 2;
      } else if (tier === 'max') {
        limit = 5;
      }

      if (tier === 'free' || limit === 0) {
        throw new BadRequestException('Mock exams are not available on the Free plan. Please upgrade to a Plus, Pro, or Max plan to take mock exams.');
      }

      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);

      const mockCount = await this.sessionModel.countDocuments({
        userId,
        type: 'mock',
        startedAt: { $gte: startOfToday }
      }).exec();

      if (mockCount >= limit) {
        throw new BadRequestException(`You have reached your daily limit of ${limit} mock exam(s) for the ${tier.toUpperCase()} plan. Please upgrade your plan to take more mock exams.`);
      }

      const combination = user.exam_subject_combination || [];
      if (combination.length !== 4 || !combination.includes('english')) {
        throw new BadRequestException('Configure a valid 4-subject combination including English first.');
      }
      subjectsList = combination;

      // Fetch questions: English (60), other 3 subjects (40 each)
      for (const sub of subjectsList) {
        const targetCount = sub === 'english' ? 60 : 40;
        const subQuestions = await this.getUniqueQuestionsForSubject(sub, targetCount, difficultyLevel, topics);
        questionsList.push(...subQuestions);
      }
    } else {
      // Drill
      if (!subject) {
        throw new BadRequestException('Subject is required for individual drills.');
      }
      const finalCount = count && [10, 20, 40].includes(count) ? count : 20;
      subjectsList = [subject];
      timeRemaining = finalCount * 60; // 1 minute per question

      const subQuestions = await this.getUniqueQuestionsForSubject(subject, finalCount, difficultyLevel, topics);

      if (subQuestions.length === 0) {
        throw new BadRequestException(`No published questions found for subject: ${subject}`);
      }

      questionsList.push(...subQuestions);
    }

    const session = await this.sessionModel.create({
      userId,
      type,
      subjects: subjectsList,
      questions: questionsList,
      answers: new Map<string, string>(),
      timeRemaining,
      status: 'active',
      startedAt: new Date(),
    });

    return session;
  }

  async getSession(sessionId: string, userId: string): Promise<ExamSessionDocument> {
    const session = await this.sessionModel.findOne({ sessionId, userId }).exec();
    if (!session) {
      throw new NotFoundException('Exam session not found.');
    }
    return session;
  }

  async saveAnswers(
    sessionId: string,
    userId: string,
    answers: Record<string, string>,
    timeRemaining: number,
  ): Promise<ExamSessionDocument> {
    const session = await this.sessionModel.findOne({ sessionId, userId, status: 'active' }).exec();
    if (!session) {
      throw new NotFoundException('Active exam session not found.');
    }

    // Update time remaining
    session.timeRemaining = Math.max(0, timeRemaining);

    // Update answers Map
    if (answers) {
      const answersMap = new Map<string, string>();
      Object.entries(answers).forEach(([qId, val]) => {
        if (val) {
          answersMap.set(qId, val);
        }
      });
      session.answers = answersMap;
    }

    await session.save();
    return session;
  }

  async submitSession(sessionId: string, userId: string): Promise<ExamResultDocument> {
    const session = await this.sessionModel.findOne({ sessionId, userId, status: 'active' }).exec();
    if (!session) {
      throw new NotFoundException('Active exam session not found or already submitted.');
    }

    const durationLimit = session.type === 'mock' ? 7200 : session.questions.length * 60;
    const timeSpentSeconds = Math.max(0, durationLimit - session.timeRemaining);

    const subjectScoresList: Array<{
      subject: string;
      score: number;
      correctCount: number;
      incorrectCount: number;
      unansweredCount: number;
    }> = [];

    // Calculate score per subject
    for (const sub of session.subjects) {
      const subQuestions = session.questions.filter((q) => q.subject === sub);
      const totalInSub = subQuestions.length;

      let correct = 0;
      let incorrect = 0;
      let unanswered = 0;

      for (const question of subQuestions) {
        const userChoice = session.answers.get(question.questionId);
        if (!userChoice) {
          unanswered += 1;
        } else if (userChoice.toUpperCase() === question.correct_option.toUpperCase()) {
          correct += 1;
        } else {
          incorrect += 1;
        }
      }

      // JAMB standard mock score is standardized out of 100 points
      const standardizedScore = totalInSub > 0 ? Math.round((correct / totalInSub) * 100) : 0;

      subjectScoresList.push({
        subject: sub,
        score: standardizedScore,
        correctCount: correct,
        incorrectCount: incorrect,
        unansweredCount: unanswered,
      });
    }

    // Overall Score
    let totalScore = 0;
    if (session.type === 'mock') {
      // Mock score is sum of standardized subject scores (0 - 400 scale)
      totalScore = subjectScoresList.reduce((acc, val) => acc + val.score, 0);
    } else {
      // Drill score is out of 100
      totalScore = subjectScoresList[0]?.score || 0;
    }

    // Create Result Snapshot
    const result = await this.resultModel.create({
      sessionId: session.sessionId,
      userId: session.userId,
      type: session.type,
      subjectScores: subjectScoresList,
      totalScore,
      timeSpentSeconds,
      answers: session.answers,
      questionsSnapshot: session.questions,
      completedAt: new Date(),
    });

    // Close session
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Award progression points to Candidate
    const xpReward = session.type === 'mock' ? 150 : 35;
    const user = await this.userModel.findOne({ userId }).exec();
    if (user) {
      user.xp_points = (user.xp_points || 0) + xpReward;
      
      // Streak tracking
      user.streak_count = (user.streak_count || 0) + 1;

      // Simple levelling formula
      while (user.xp_points >= user.level * 400) {
        user.level += 1;
      }
      await user.save();
    }

    return result;
  }

  sanitizeSession(session: ExamSessionDocument) {
    const plain = session.toObject();
    plain.questions = plain.questions.map((q: any) => {
      const { correct_option, explanation, embedding_vector, ...rest } = q;
      return rest;
    });
    return plain;
  }

  private async getUniqueQuestionsForSubject(subject: string, targetCount: number, difficultyLevel?: string, topics?: string[]): Promise<Question[]> {
    const matchStage: any = { subject, status: 'published' };
    
    if (difficultyLevel && difficultyLevel !== 'any') {
      matchStage.difficulty_level = Number(difficultyLevel);
    }
    
    if (topics && topics.length > 0) {
      matchStage.topic = { $in: topics };
    }

    const uniqueQuestions = await this.questionModel
      .aggregate<Question>([
        { $match: matchStage },
        { $group: { _id: "$question_text", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sample: { size: targetCount } }
      ])
      .exec();

    if (uniqueQuestions.length === 0) {
      return [];
    }

    let result = uniqueQuestions;
    if (result.length < targetCount) {
      // Repeat questions up to 3 times to fill to targetCount
      const repeated: Question[] = [];
      for (let r = 0; r < 3 && repeated.length < targetCount; r++) {
        // Shuffle each pass to mix up order
        const pass = [...result].sort(() => Math.random() - 0.5);
        repeated.push(...pass);
      }
      result = repeated.slice(0, targetCount);
    }
    return result;
  }
}
