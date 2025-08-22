import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';

@Module({
  // root modules connect global pieces
  imports: [
    AppConfigModule,            // env + validation
    ThrottlerModule.forRoot([{  // rate limit: 100req/60s/IP
      ttl: 60,
      limit: 100, // 100 requests per minute per IP (tweak per endpoint later)
    }]),
  ],
})
export class AppModule {}
