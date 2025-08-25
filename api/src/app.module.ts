import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  // root modules connect global pieces
  imports: [
    AppConfigModule,                // loads and validates env vars (fail fast on bad config)
    ThrottlerModule.forRoot([{      // rate limit: 100req/60s/IP
      ttl: 60,
      limit: 100,
    }]), PrismaModule, HealthModule,
    PrismaModule,                   // provides connected db client via DI globally
    HealthModule,                   // provides verification that nest, prisma, and postgres work during runtime
  ],
})
export class AppModule {}
