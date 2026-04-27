import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BLOOM_LEVELS,
  MEDIA_TYPES,
  OPTION_IDS,
  QUESTION_STATUSES,
  QUESTION_SUBJECTS,
  QUESTION_TYPES,
} from '../types/question.types';

class QuestionOptionDto {
  @IsEnum(OPTION_IDS)
  id!: 'A' | 'B' | 'C' | 'D' | 'E';

  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}

class QuestionMediaDto {
  @IsEnum(MEDIA_TYPES)
  type!: 'image' | 'audio' | 'video';

  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  alt_text?: string;
}

export class UpdateQuestionDto {
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
  @IsInt()
  @Min(1990)
  @Max(2024)
  year_sourced?: number;

  @IsOptional()
  @IsString()
  @MinLength(10)
  question_text?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @IsOptional()
  @IsEnum(OPTION_IDS)
  correct_option?: 'A' | 'B' | 'C' | 'D' | 'E';

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(QUESTION_TYPES)
  question_type?: (typeof QUESTION_TYPES)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty_level?: number;

  @IsOptional()
  @IsNumber()
  @Min(-3)
  @Max(3)
  irt_difficulty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3)
  irt_discrimination?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.35)
  irt_guessing?: number;

  @IsOptional()
  @IsEnum(BLOOM_LEVELS)
  bloom_level?: (typeof BLOOM_LEVELS)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  estimated_solve_time_seconds?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionMediaDto)
  media?: QuestionMediaDto[];

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(QUESTION_STATUSES)
  status?: (typeof QUESTION_STATUSES)[number];

  @IsString()
  change_reason!: string;
}
