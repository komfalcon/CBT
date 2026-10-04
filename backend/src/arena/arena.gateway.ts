import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ArenaService } from './arena.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowed = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
        : [
            'http://localhost:5173',
            'http://localhost:5174',
            'https://cbt.aurikrex.com',
            'https://www.cbt.aurikrex.com',
            'https://cbt.aurikrex.tech',
            'https://www.cbt.aurikrex.tech',
          ];
      if (!origin || allowed.includes(origin) || allowed.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('WebSocket origin not allowed by CORS'));
      }
    },
    credentials: true,
  },
})
export class ArenaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly arenaService: ArenaService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No token');
      const payload = this.jwtService.verify(token);
      this.arenaService.registerUser(client.id, payload.sub);
    } catch (err) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.arenaService.unregisterUser(client.id);
  }

  @SubscribeMessage('join_queue')
  async handleJoinQueue(client: Socket) {
    this.arenaService.joinQueue(client.id);
    client.emit('queue_status', { status: 'waiting' });

    const match = await this.arenaService.matchmake();
    if (match) {
      match.players.forEach(p => {
        this.server.to(p.socketId).emit('match_found', { matchId: match.matchId });
      });
    }
  }

  @SubscribeMessage('leave_queue')
  handleLeaveQueue(client: Socket) {
    this.arenaService.unregisterUser(client.id);
    // Re-register just the user without queue
    const userId = this.arenaService.getUserId(client.id);
    if (userId) {
      this.arenaService.registerUser(client.id, userId);
    }
    client.emit('queue_status', { status: 'idle' });
  }
}
