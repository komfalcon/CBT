import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSessionDto {
  @IsIn(['mock', 'drill']) type!: 'mock' | 'drill';
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) subjects?: string[];
  @IsOptional() @IsInt() @Min(1) @Max(200) count?: number;
  @IsOptional() @IsString() difficultyLevel?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) topics?: string[];
  @IsOptional() subjectConfigs?: Record<string, { mode: 'random' | 'specific'; topics: string[] }>;
}

export class CreateMockSessionDto {
  @IsArray() @IsString({ each: true }) subjects!: string[];
  @IsOptional() @IsString() difficultyLevel?: string;
  @IsOptional() subjectConfigs?: Record<string, { mode: 'random' | 'specific'; topics: string[] }>;
}

export class CreateDrillSessionDto {
  @IsString() subject!: string;
  @IsOptional() @IsInt() @Min(5) @Max(100) count?: number;
  @IsOptional() @IsString() difficultyLevel?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) topics?: string[];
}
