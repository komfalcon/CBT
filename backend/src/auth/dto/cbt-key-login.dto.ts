import { IsNotEmpty, IsString } from 'class-validator';

export class CbtKeyLoginDto {
  @IsString()
  @IsNotEmpty()
  cbtKey!: string;
}
