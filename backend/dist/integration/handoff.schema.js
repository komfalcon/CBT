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
exports.HandoffSchema = exports.Handoff = void 0;
let Handoff = class Handoff {
};
exports.Handoff = Handoff;
__decorate([
    Prop({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Handoff.prototype, "jti", void 0);
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", String)
], Handoff.prototype, "userId", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Handoff.prototype, "audience", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Array)
], Handoff.prototype, "scope", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Handoff.prototype, "returnUrl", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Handoff.prototype, "nextPath", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Date)
], Handoff.prototype, "expiresAt", void 0);
__decorate([
    Prop({ default: false }),
    __metadata("design:type", Boolean)
], Handoff.prototype, "exchanged", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Handoff.prototype, "state", void 0);
exports.Handoff = Handoff = __decorate([
    Schema({ timestamps: true, collection: 'integration_handoffs' })
], Handoff);
exports.HandoffSchema = SchemaFactory.createForClass(Handoff);
exports.HandoffSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
//# sourceMappingURL=handoff.schema.js.map