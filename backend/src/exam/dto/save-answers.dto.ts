import { IsInt, IsObject, IsOptional, Min } from 'class-validator';
export class SaveAnswersDto {
  @IsObject() answers!: Record<string, string>;
  @IsInt() @Min(0) timeRemaining!: number;
}
