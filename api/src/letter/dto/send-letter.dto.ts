import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SendLetterDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deliveryDate?: Date;
}