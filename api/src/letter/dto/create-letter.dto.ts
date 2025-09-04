import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDate, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { LetterStatus } from '@prisma/client';

export class CreateLetterDto {
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUrl()
  @IsOptional()
  songUrl?: string;

  @IsEnum(LetterStatus)
  @IsOptional()
  status?: LetterStatus = LetterStatus.DRAFT;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deliveryDate?: Date;
}