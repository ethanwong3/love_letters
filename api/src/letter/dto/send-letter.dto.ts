import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

enum LetterStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  OPENED = 'OPENED',
}

export class SendLetterDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deliveryDate?: Date;
}