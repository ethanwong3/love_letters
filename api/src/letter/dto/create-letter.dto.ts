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

  @IsOptional()
  @IsUrl()
  songUrl?: string | null;

  @IsOptional()
  @IsUrl()
  photoUrl?: string | null;

  @IsEnum(LetterStatus)
  @IsOptional()
  status?: LetterStatus = LetterStatus.DRAFT;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deliveryDate?: Date;
}