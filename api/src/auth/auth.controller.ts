import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
    console.log('🔐 AuthController initialized');
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    console.log('📝 POST /auth/register - REQUEST RECEIVED');
    console.log('  - Email:', dto.email);
    console.log('  - Display Name:', dto.displayName);
    console.log('  - Password provided:', !!dto.password);
    console.log('  - Request body keys:', Object.keys(dto));
    
    try {
      const result = await this.authService.register(dto);
      console.log('✅ Registration successful for:', dto.email);
      console.log('  - User ID created:', result.user.id);
      console.log('  - Token generated:', !!result.token);
      return result;
    } catch (error) {
      console.error('❌ Registration failed:');
      console.error('  - Email:', dto.email);
      console.error('  - Error type:', error.constructor.name);
      console.error('  - Error message:', error.message);
      console.error('  - Status code:', error.status || 'Unknown');
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    console.log('🔑 POST /auth/login - REQUEST RECEIVED');
    console.log('  - Email:', dto.email);
    console.log('  - Password provided:', !!dto.password);
    console.log('  - Request body keys:', Object.keys(dto));
    console.log('  - Request timestamp:', new Date().toISOString());
    
    try {
      const result = await this.authService.login(dto);
      console.log('✅ Login successful for:', dto.email);
      console.log('  - User ID:', result.user.id);
      console.log('  - Display Name:', result.user.displayName);
      console.log('  - Token generated:', !!result.token);
      console.log('  - Response timestamp:', new Date().toISOString());
      return result;
    } catch (error) {
      console.error('❌ Login failed:');
      console.error('  - Email:', dto.email);
      console.error('  - Error type:', error.constructor.name);
      console.error('  - Error message:', error.message);
      console.error('  - Status code:', error.status || 'Unknown');
      console.error('  - Error timestamp:', new Date().toISOString());
      throw error;
    }
  }
}