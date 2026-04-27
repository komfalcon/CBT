import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { BLOOM_LEVELS, QUESTION_STATUSES, QUESTION_SUBJECTS, QUESTION_TYPES } from '../types/question.types';

export class FilterQuestionsDto {
  @IsOptional()
  @IsEnum(QUESTION_SUBJECTS)
  subject?: (typeof QUESTION_SUBJECTS)[number];

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  subtopic?: string;

  @IsOptional()
  @IsEnum(QUESTION_STATUSES)
  status?: (typeof QUESTION_STATUSES)[number];

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty_level?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1990)
  @Max(2024)
  year_sourced?: number;

  @IsOptional()
  @IsEnum(BLOOM_LEVELS)
  bloom_level?: (typeof BLOOM_LEVELS)[number];

  @IsOptional()
  @IsEnum(QUESTION_TYPES)
  question_type?: (typeof QUESTION_TYPES)[number];

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    return String(value)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Math.min(Number(value ?? 20), 100))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsIn(['created_at', 'difficulty_level', 'use_count'])
  sortBy: 'created_at' | 'difficulty_level' | 'use_count' = 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
