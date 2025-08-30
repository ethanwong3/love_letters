import { Injectable, InternalServerErrorException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'; 
import { JwtUtil } from './utils/jwt.util';
import { PasswordUtil } from './utils/password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtUtil: JwtUtil,
    private readonly configService: ConfigService,
  ) {}

  // TODO: need to clean body before request send on frontend (trim, confirm matching, pw strength)
  async register(dto: RegisterDto) {

    // check if user email is already taken
    const isUserEmailTaken = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (isUserEmailTaken) {
      throw new BadRequestException('User with this email already exists!');
    }

    // hash password
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS');
    if (!saltRounds || isNaN(saltRounds)) {
      throw new Error('BCRYPT_SALT_ROUNDS environment variable is missing or invalid');
    }
    const hashedPassword = await PasswordUtil.hashPassword(dto.password, saltRounds);

    // create user and catch any db errs
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          displayName: dto.displayName
        }
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to create user: ' + err.message);
    }

    // create jwt
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is missing');
    }
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const token = this.jwtUtil.generateToken({ sub: user.id }, jwtSecret, jwtExpiresIn);

    // return user and token 
    return { user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    },
    token };
  }

  async login(dto: LoginDto) {
    // check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    // check if credentials are invalid
    const isPasswordValid = await PasswordUtil.comparePasswords(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // create jwt
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is missing');
    }
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const token = this.jwtUtil.generateToken({ sub: user.id }, jwtSecret, jwtExpiresIn);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      token,
    }
  }
}