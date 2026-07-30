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
    origin: '*',
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
