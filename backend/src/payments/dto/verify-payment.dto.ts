import { IsNotEmpty, IsString } from 'class-validator';
export class VerifyPaymentDto {
  @IsString() @IsNotEmpty() reference!: string;
  @IsString() @IsNotEmpty() planCode!: string;
}
