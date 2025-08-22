# love_letters

Dependencies:

ensure incoming api requests are type safe
pnpm add class-validator class-transformer

enforce correct env vars
pnpm add @nestjs/config zod

provide secure auth framework with jwt and hashing adapted for nest, 
pnpm add @nestjs/passport passport @nestjs/jwt passport-jwt bcrypt
pnpm add -D @types/bcrypt

database ORM to define schema and migrations with PGSQL
pnpm add prisma @prisma/client
pnpm dlx prisma init

ensure app performance and security with rate limiter
pnpm add @nestjs/throttler

Completed:
- set up backend foundation (NestJS and TS) with global DTO validation and CORS connection
- added baseline dependencies
- configured environment
- added basic rate limiting

To Do:
- connect backend to prisma
- user and auth modules/controllers/services
- user model and mmigration
- add PrismaModule, AuthModule, UsersModule, etc to app.module.ts in future
- replace localhost placeholder domain with deployed vercel domain in deployment

