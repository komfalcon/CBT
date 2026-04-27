import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class ImportQuestionsDto {
  @IsString()
  importId!: string;

  @IsObject()
  columnMapping!: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  async?: boolean;
}
