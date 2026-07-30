import { Injectable } from '@nestjs/common';
import { QuestionsService } from '../questions/questions.service';
interface Match {
  matchId: string;
  players: { userId: string, socketId: string, score: number }[];
  questions: any[];
  status: 'waiting' | 'active' | 'finished';
}

@Injectable()
export class ArenaService {
  private queue: string[] = []; // Socket IDs waiting
  private matches: Map<string, Match> = new Map();
  private userSocketMap: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    private readonly questionsService: QuestionsService,
  ) {}

  registerUser(socketId: string, userId: string) {
    this.userSocketMap.set(socketId, userId);
  }

  unregisterUser(socketId: string) {
    this.userSocketMap.delete(socketId);
    this.queue = this.queue.filter(id => id !== socketId);
  }

  getUserId(socketId: string) {
    return this.userSocketMap.get(socketId);
  }

  // Simplified matchmaking logic
  joinQueue(socketId: string) {
    if (!this.queue.includes(socketId)) {
      this.queue.push(socketId);
    }
  }

  async matchmake(): Promise<Match | null> {
    if (this.queue.length >= 2) {
      const p1 = this.queue.shift();
      const p2 = this.queue.shift();
      
      const matchId = `match_${Date.now()}`;
      
      // Fetch some random questions for the battle
      // Using existing questionsService but we just need a few
      const questions: any[] = []; // We will populate this from questionsService in a real implementation
      
      const match: Match = {
        matchId,
        players: [
          { userId: this.getUserId(p1!) || 'unknown', socketId: p1!, score: 0 },
          { userId: this.getUserId(p2!) || 'unknown', socketId: p2!, score: 0 },
        ],
        questions,
        status: 'active',
      };
      
      this.matches.set(matchId, match);
      return match;
    }
    return null;
  }
}
