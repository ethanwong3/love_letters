import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// on boot, global module makes a single Prisma client globally available via constructor injection
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
