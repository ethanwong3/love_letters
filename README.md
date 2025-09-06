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

npx create-next-app@latest
cd client
npx shadcn@latest init
npx shadcn@latest add button input form card

npm install framer-motion
npm install react-icons

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

- user, basic api endpoints, tested
- auth, register and login with jwt infrastructure for token generation, validation, and guarding, tested.
- letter, creation/updates/sending/scheudling/receiving/reading all guarded, tested.
- frontend done auth pages

# To Do (Next):

- in frontend, ensure register has password confirmation matching and secure password checks and trims json body data
- in frontend, replace alert errors in auth
- in frontend, implement SPA inbox with profile overlay, inbox, and letter writing feature

# To Do (Reminder):

These are ranked by priority!

- replace localhost placeholder domain with deployed vercel domain in deployment
- deploy backend and db

- token refreshes and logout feature
- friending / coupling features within user module

- onboarding codes to join as someones friend or partner?
- notifications + letter sending CRON job?
- allow users to search/filter between letters?