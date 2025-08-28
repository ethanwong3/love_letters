// decorators for data validation
import { IsString, IsOptional, IsEmail } from 'class-validator';

// DTO class that defines expected data structure sent in HTTP requests to update a user
export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  passwordHash?: string;

  @IsString()
  @IsOptional()
  displayName?: string;
}