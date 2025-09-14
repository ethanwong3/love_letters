import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateLetterDto {
  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsUrl()
  @IsOptional()
  songUrl?: string;

  @IsUrl()
  @IsOptional()
  photoUrl?: string;
}