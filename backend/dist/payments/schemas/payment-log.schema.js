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
exports.PaymentLogSchema = exports.PaymentLog = void 0;
let PaymentLog = class PaymentLog {
};
exports.PaymentLog = PaymentLog;
__decorate([
    Prop({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], PaymentLog.prototype, "reference", void 0);
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", String)
], PaymentLog.prototype, "userId", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], PaymentLog.prototype, "planCode", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Number)
], PaymentLog.prototype, "amount", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], PaymentLog.prototype, "email", void 0);
__decorate([
    Prop({ default: Date.now }),
    __metadata("design:type", Date)
], PaymentLog.prototype, "verifiedAt", void 0);
exports.PaymentLog = PaymentLog = __decorate([
    Schema({
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    })
], PaymentLog);
exports.PaymentLogSchema = SchemaFactory.createForClass(PaymentLog);
//# sourceMappingURL=payment-log.schema.js.map