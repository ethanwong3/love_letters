# love_letters

# App Summary:

Right now this app is a skeleton containing several dependencies awaiting for implementation. The backend currently hosts an empty nest app with global DTO validation and placeholder CORS connection. Furthermore, a PostgreSQL database and a Prisma ORM have been connected to the project.

Love Letters in the future will reflect fullstack journaling app designed for couples (with potential extensions for friends and families). The core idea is to bring back the intimacy of letters, photo albums, and milestones in a digital format.

Features:
- Write and send letters (with photos, songs, and scheduled sends).
- Maintain an inbox of opened/unopened letters.
- Keep a streak of daily letters exchanged.
- View a timeline of milestones (letters, dates, photos).
- Manage a shared gallery (all media attached to letters).
- Relationship linking: send and accept an invitation request.

# Dependencies:

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

testing
npm install --save-dev jest @types/jest ts-jest
npx ts-jest config:init

# Set Up:

Requirements: node.js / pnpm / psql 16

cd api
pnpm install
brew services start postgresql@16
createdb -U postgres letters
pnpm exec prisma migrate dev
pnpm start:dev
curl http://localhost:4000/health/db

# Structure:

love_letters/
├── api/                      # NestJS backend
│   ├── src/
│   │   ├── main.ts           # Entry point (bootstrap, pipes, CORS, shutdown hooks)
│   │   ├── app.module.ts     # Root module (imports shared + domain modules)
│   │   ├── config/           # Env config & validation (Zod + @nestjs/config)
│   │   ├── prisma/           # PrismaModule + PrismaService (DB DI wrapper)
│   │   ├── health/           # HealthModule + Controller (/health endpoints)
│   │   └── modules/          # Domain modules
│   │       ├── users/        # UsersModule (UserService, UserController, DTOs)
│   │       ├── auth/         # AuthModule (Passport, JWT strategy, login/register)
│   │       ├── relationships/# RelationshipModule (linking requests/acceptance)
│   │       ├── letters/      # LettersModule (send/read letters, media)
│   │       ├── gallery/      # GalleryModule (albums, all photos)
│   │       └── timeline/     # TimelineModule (milestones, streaks)
│   ├── prisma/schema.prisma  # Prisma schema (models + migrations)
│   └── .env                  # Environment variables
└── frontend/                 # Next.js frontend (planned)

# Architecture:

Backend (NestJS + TypeScript):

Modules: Group related features (Users, Auth, Letters, etc.).
Controllers: Define HTTP routes (/users, /auth/login).
Services: Contain business logic (call Prisma, apply rules).
DTOs: Validate incoming requests (class-validator + ValidationPipe).
Prisma DI Wrapper: One global PrismaService shared across modules.
Config Module: Env vars validated at boot via Zod.
Health Endpoints: /health/db verifies runtime DB connectivity.

Database (PostgreSQL + Prisma):

Normalized schema with models for User, Relationship, Letter, Media, TimelineEvent.
Prisma migrations manage schema evolution.

Frontend (Next.js + Tailwind):

React Query for API data fetching.
shadcn/ui for components.
Routes: /dashboard, /inbox, /timeline, /gallery, /profile.

Deployment:

Frontend → Vercel.
Backend → Railway or Render.
Database → Neon or Supabase.
Env config managed via platform dashboards.

# Stack:

Frontend:
    NextJS
    Typescript
    Tailwindcss (shadcn/ui)

Auth:
    JWT
    Bcrypt
    Passport

Backend:
    NestJS
    Typescript
    PostgreSQL
    Prisma
    Jest

DevOps:
    Vercel (Frontend Host)
    Railway/Render (Backend Host)
    Github (CI/CD)
    pnpm (Package Management)

*LOGS*

# Completed:

- installed baseline dependencies listed above
- configured environment variables and implemented zod schema validation to fail-fast on boot if errors occur
- created the skeleton of the backend app (NestJS + TS) and implemented global DTO validation pipelines
- added basic API rate limiting with throttler
- set up PSQL DB and connected via Prisma ORM
- added draft user model
- created Prisma DI wrapper to handle safe connect/disconnect on boot/shutdown
- exposed Prisma globally (prisma client created by DI wrapper can access db in any module)
- created health check module 
- exposed health/db endpoint to verify runtime db connection

# To Do (Next):

- finalise drafted user model
- create user module
- add basic CRUD endpoints for testing
- prepare implementation to develop and test auth

# To Do (Reminder):

- replace localhost placeholder domain with deployed vercel domain in deployment
- deploy backend and db
- notifications?
- write unit and e2e tests using jest or supertest
