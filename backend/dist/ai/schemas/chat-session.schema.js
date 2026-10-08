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
exports.ChatSessionSchema = exports.ChatSession = exports.ChatMessage = void 0;
class ChatMessage {
}
exports.ChatMessage = ChatMessage;
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "role", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "content", void 0);
__decorate([
    Prop({ default: Date.now }),
    __metadata("design:type", Date)
], ChatMessage.prototype, "timestamp", void 0);
let ChatSession = class ChatSession {
};
exports.ChatSession = ChatSession;
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", String)
], ChatSession.prototype, "userId", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], ChatSession.prototype, "title", void 0);
__decorate([
    Prop({ type: [ChatMessage], default: [] }),
    __metadata("design:type", Array)
], ChatSession.prototype, "messages", void 0);
exports.ChatSession = ChatSession = __decorate([
    Schema({ timestamps: true })
], ChatSession);
exports.ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
//# sourceMappingURL=chat-session.schema.js.map