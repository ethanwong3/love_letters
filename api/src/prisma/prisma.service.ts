import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// prisma DI wrapper
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    // connect once on boot
  async onModuleInit() {
    await this.$connect();
  }

  // close db connection cleanly on shutdown
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
