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
  ) {
    console.log('🔐 AuthService initialized');
    console.log('  - Prisma service:', !!this.prisma);
    console.log('  - JWT util:', !!this.jwtUtil);
    console.log('  - Config service:', !!this.configService);
  }

  async register(dto: RegisterDto) {
    console.log('📝 AuthService.register() called');
    console.log('  - Email:', dto.email);
    console.log('  - Display Name:', dto.displayName);

    try {
      // Check if user email is already taken
      console.log('🔍 Checking if email already exists...');
      const isUserEmailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      
      if (isUserEmailTaken) {
        console.log('❌ Email already exists:', dto.email);
        throw new BadRequestException('User with this email already exists!');
      }
      console.log('✅ Email is available');

      // Hash password
      console.log('🔒 Hashing password...');
      const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS');
      console.log('  - Salt rounds from config:', saltRounds);
      console.log('  - Salt rounds type:', typeof saltRounds);
      
      if (!saltRounds || isNaN(saltRounds)) {
        console.error('❌ BCRYPT_SALT_ROUNDS is missing or invalid');
        throw new Error('BCRYPT_SALT_ROUNDS environment variable is missing or invalid');
      }
      
      const hashedPassword = await PasswordUtil.hashPassword(dto.password, saltRounds);
      console.log('✅ Password hashed successfully');

      // Create user
      console.log('👤 Creating user in database...');
      let user;
      try {
        user = await this.prisma.user.create({
          data: {
            email: dto.email,
            passwordHash: hashedPassword,
            displayName: dto.displayName
          }
        });
        console.log('✅ User created successfully');
        console.log('  - User ID:', user.id);
        console.log('  - Email:', user.email);
        console.log('  - Display Name:', user.displayName);
      } catch (err) {
        console.error('❌ Database error creating user:');
        console.error('  - Error name:', err.name);
        console.error('  - Error message:', err.message);
        console.error('  - Error code:', err.code);
        throw new InternalServerErrorException('Failed to create user: ' + err.message);
      }

      // Create JWT
      console.log('🎟️  Generating JWT token...');
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      console.log('  - JWT secret exists:', !!jwtSecret);
      console.log('  - JWT secret length:', jwtSecret?.length || 0);
      
      if (!jwtSecret) {
        console.error('❌ JWT_SECRET is missing');
        throw new Error('JWT_SECRET environment variable is missing');
      }
      
      const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
      console.log('  - JWT expires in:', jwtExpiresIn);
      
      const token = this.jwtUtil.generateToken({ sub: user.id }, jwtSecret, jwtExpiresIn);
      console.log('✅ JWT token generated successfully');

      const result = {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName
        },
        token
      };

      console.log('🎉 Registration completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Registration process failed:');
      console.error('  - Error type:', error.constructor.name);
      console.error('  - Error message:', error.message);
      console.error('  - Stack trace:', error.stack);
      throw error;
    }
  }

  async login(dto: LoginDto) {
    console.log('🔑 AuthService.login() called');
    console.log('  - Email:', dto.email);

    try {
      // Check if user exists
      console.log('🔍 Looking up user by email...');
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      
      if (!user) {
        console.log('❌ User not found:', dto.email);
        throw new BadRequestException('User with this email does not exist');
      }
      
      console.log('✅ User found:');
      console.log('  - User ID:', user.id);
      console.log('  - Display Name:', user.displayName);
      console.log('  - Created At:', user.createdAt);

      // Check password
      console.log('🔒 Validating password...');
      const isPasswordValid = await PasswordUtil.comparePasswords(dto.password, user.passwordHash);
      console.log('  - Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password for user:', dto.email);
        throw new UnauthorizedException('Invalid credentials');
      }
      console.log('✅ Password validation successful');
      
      // Create JWT
      console.log('🎟️  Generating JWT token...');
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      console.log('  - JWT secret exists:', !!jwtSecret);
      
      if (!jwtSecret) {
        console.error('❌ JWT_SECRET is missing');
        throw new Error('JWT_SECRET environment variable is missing');
      }
      
      const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
      console.log('  - JWT expires in:', jwtExpiresIn);
      
      const token = this.jwtUtil.generateToken({ sub: user.id }, jwtSecret, jwtExpiresIn);
      console.log('✅ JWT token generated successfully');

      const result = {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName
        },
        token,
      };

      console.log('🎉 Login completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Login process failed:');
      console.error('  - Error type:', error.constructor.name);
      console.error('  - Error message:', error.message);
      console.error('  - Stack trace:', error.stack);
      throw error;
    }
  }
}