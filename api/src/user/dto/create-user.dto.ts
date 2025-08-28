// decorators for validating incoming data
import { IsString, IsEmail } from 'class-validator';

// DTO class that defines expected data structure sent in HTTP requests to create a new user
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  passwordHash: string;

  @IsString()
  displayName: string;
}