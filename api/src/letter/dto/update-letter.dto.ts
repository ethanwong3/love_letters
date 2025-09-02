import { IsDate, IsOptional, IsString, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  finishedAt?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deliveryDate?: Date;
}