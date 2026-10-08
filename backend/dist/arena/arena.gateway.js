"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArenaGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const arena_service_1 = require("./arena.service");
const jwt_1 = require("@nestjs/jwt");
let ArenaGateway = class ArenaGateway {
    constructor(arenaService, jwtService) {
        this.arenaService = arenaService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token;
            if (!token)
                throw new Error('No token');
            const payload = this.jwtService.verify(token);
            this.arenaService.registerUser(client.id, payload.sub);
        }
        catch (err) {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.arenaService.unregisterUser(client.id);
    }
    async handleJoinQueue(client) {
        this.arenaService.joinQueue(client.id);
        client.emit('queue_status', { status: 'waiting' });
        const match = await this.arenaService.matchmake();
        if (match) {
            match.players.forEach(p => {
                this.server.to(p.socketId).emit('match_found', { matchId: match.matchId });
            });
        }
    }
    handleLeaveQueue(client) {
        this.arenaService.unregisterUser(client.id);
        const userId = this.arenaService.getUserId(client.id);
        if (userId) {
            this.arenaService.registerUser(client.id, userId);
        }
        client.emit('queue_status', { status: 'idle' });
    }
};
exports.ArenaGateway = ArenaGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ArenaGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_queue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ArenaGateway.prototype, "handleJoinQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_queue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ArenaGateway.prototype, "handleLeaveQueue", null);
exports.ArenaGateway = ArenaGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
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
                }
                else {
                    callback(new Error('WebSocket origin not allowed by CORS'));
                }
            },
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [arena_service_1.ArenaService,
        jwt_1.JwtService])
], ArenaGateway);
//# sourceMappingURL=arena.gateway.js.map