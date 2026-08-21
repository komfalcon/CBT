import { IsArray, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const SUBJECTS = [
  'english', 'mathematics', 'physics', 'chemistry', 'biology', 'geography',
  'economics', 'government', 'literature', 'commerce', 'accounting',
  'agriculture', 'civic_education', 'crk', 'irk', 'history', 'further_mathematics',
];

export class CreateHandoffDto {
  @IsIn(['library', 'cbt'])
  audience!: 'library' | 'cbt';

  @IsArray()
  @IsString({ each: true })
  scope!: string[];

  @IsOptional()
  @IsIn(SUBJECTS)
  subjectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  topicId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  conceptId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  returnUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\/(?!\/).*/)
  nextPath?: string;
}

export class ExchangeHandoffDto {
  @IsString()
  @MinLength(20)
  handoff!: string;
}

export class LearningEventDto {
  @IsString()
  @MinLength(8)
  eventId!: string;

  @IsIn(['topic_opened', 'topic_engaged', 'topic_reviewed', 'topic_practiced', 'topic_repaired'])
  eventType!: string;

  @IsString()
  subjectId!: string;

  @IsString()
  topicId!: string;

  @IsString()
  sourceProduct!: 'library' | 'cbt';

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  occurredAt?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
