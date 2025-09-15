import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { JwtStrategy } from './auth/jwt.strategy';
import { LetterModule } from './letter/letter.module';
import { SpotifyModule } from './spotify/spotify.module';

@Module({
  // root modules connect global pieces
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 100,
    }]), PrismaModule, HealthModule,
    PrismaModule,
    HealthModule,
    UserModule,
    AuthModule,
    LetterModule,
    SpotifyModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
