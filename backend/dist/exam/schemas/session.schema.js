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
exports.ExamSessionSchema = exports.ExamSession = exports.SESSION_STATUSES = void 0;
const uuid_1 = require("uuid");
exports.SESSION_STATUSES = ['active', 'completed', 'expired'];
let ExamSession = class ExamSession {
};
exports.ExamSession = ExamSession;
__decorate([
    Prop({ default: uuid_1.v4, unique: true, index: true }),
    __metadata("design:type", String)
], ExamSession.prototype, "sessionId", void 0);
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", String)
], ExamSession.prototype, "userId", void 0);
__decorate([
    Prop({ required: true, enum: ['mock', 'drill'] }),
    __metadata("design:type", String)
], ExamSession.prototype, "type", void 0);
__decorate([
    Prop({ type: [String], required: true }),
    __metadata("design:type", Array)
], ExamSession.prototype, "subjects", void 0);
__decorate([
    Prop({ type: [Object], required: true }),
    __metadata("design:type", Array)
], ExamSession.prototype, "questions", void 0);
__decorate([
    Prop({ type: Map, of: String, default: {} }),
    __metadata("design:type", Map)
], ExamSession.prototype, "answers", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Number)
], ExamSession.prototype, "timeRemaining", void 0);
__decorate([
    Prop({ type: String, enum: exports.SESSION_STATUSES, default: 'active', index: true }),
    __metadata("design:type", String)
], ExamSession.prototype, "status", void 0);
__decorate([
    Prop({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], ExamSession.prototype, "startedAt", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], ExamSession.prototype, "completedAt", void 0);
__decorate([
    Prop({ type: [String], default: [] }),
    __metadata("design:type", Array)
], ExamSession.prototype, "warnings", void 0);
exports.ExamSession = ExamSession = __decorate([
    Schema({
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        toJSON: { getters: true },
        toObject: { getters: true },
    })
], ExamSession);
exports.ExamSessionSchema = SchemaFactory.createForClass(ExamSession);
exports.ExamSessionSchema.index({ userId: 1, type: 1, startedAt: -1 });
//# sourceMappingURL=session.schema.js.map