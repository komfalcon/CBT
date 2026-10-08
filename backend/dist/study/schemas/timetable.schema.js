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
exports.TimetableSchema = exports.Timetable = exports.StudySession = void 0;
class StudySession {
}
exports.StudySession = StudySession;
__decorate([
    Prop({ type: String, default: () => new Types.ObjectId().toHexString() }),
    __metadata("design:type", String)
], StudySession.prototype, "_id", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], StudySession.prototype, "subject", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], StudySession.prototype, "topic", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Date)
], StudySession.prototype, "startTime", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Date)
], StudySession.prototype, "endTime", void 0);
__decorate([
    Prop({ default: false }),
    __metadata("design:type", Boolean)
], StudySession.prototype, "completed", void 0);
let Timetable = class Timetable extends Document {
};
exports.Timetable = Timetable;
__decorate([
    Prop({ type: String, ref: 'User', required: true }),
    __metadata("design:type", String)
], Timetable.prototype, "user", void 0);
__decorate([
    Prop({ type: [StudySession], default: [] }),
    __metadata("design:type", Array)
], Timetable.prototype, "sessions", void 0);
exports.Timetable = Timetable = __decorate([
    Schema({ timestamps: true })
], Timetable);
exports.TimetableSchema = SchemaFactory.createForClass(Timetable);
//# sourceMappingURL=timetable.schema.js.map