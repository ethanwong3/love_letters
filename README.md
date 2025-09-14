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

npm install framer-motion
npm install react-icons
npm install react-rmd

npm i @cloudinary/url-gen @cloudinary/react

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
- auth pages designed and implemented with api connection and error handling.

# To Do (Next):

- FIXES
- possible issues with time stamps, can only tell when scheduled one is set to deliver
- need to figure out how to do music and photos
- need to redesign inbox and write functionalities before considering letters and profile

- FRONTEND (HOME)
- redesign

- FRONTEND (WRITE)
- design
- combine letter editor and send scheduler 

- FRONTEND (INBOX)
- design
- allow for filter to unread
- add deliverydate below letter icon
- writing time: ? - ? instead of both created and finished at timestamps
- incorporate spotify track metadata, ensure full song not preview, and pause and mute.

- ADD ALL THE LETTERS YOU HAVE INTO THE DB THEN
- DEPLOY AND MAKE SURE IT WORKS FOR FRIENDS

# To Do (Reminder):

These are ranked by priority!

- replace localhost placeholder domain with deployed vercel domain in deployment
- deploy backend and db

- token refreshes and logout feature
- friending / coupling features within user module

- onboarding codes to join as someones friend or partner?
- notifications + letter sending CRON job?
- allow users to search/filter between letters?

Copilot Res:

To achieve the ability to extract track metadata (like album cover), use playback controls (e.g., volume, pause), and ensure the entire song gets played (not just a preview), you need to integrate the Spotify Web Playback SDK. This SDK allows you to control playback programmatically and play full tracks, provided the user is authenticated with a Spotify Premium account.

Here’s the step-by-step process to set up and integrate the Spotify Web Playback SDK with your LetterModal file:

1. Prerequisites
Spotify Developer Account: Create one at Spotify Developer Dashboard.
Spotify App: Create an app in the dashboard to get your Client ID and Client Secret.
Spotify Premium Account: The Web Playback SDK requires a Premium account to play full tracks.

2. Set Up Spotify Authorization
You need to authenticate the user and obtain an access token to interact with the Spotify API and SDK.

Steps:
Implement Spotify Authorization Flow:

Use the Authorization Code Flow to get an access token.
Redirect the user to Spotify's login page, and after successful login, Spotify will redirect back to your app with an authorization code.
Exchange the authorization code for an access token and refresh token using Spotify's /api/token endpoint.
Store the Access Token:

Save the access token in your app (e.g., in React state, context, or a global store).

3. Integrate the Spotify Web Playback SDK
The Web Playback SDK allows you to play full tracks, control playback, and fetch metadata.

Steps:
Load the SDK Script: Add the Spotify Web Playback SDK script to your app. You can load it dynamically in your component.

useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://sdk.scdn.co/spotify-player.js';
  script.async = true;
  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
}, []);

Initialize the Player: Once the SDK is loaded, initialize the player with the access token.

useEffect(() => {
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: 'LetterModal Player',
      getOAuthToken: (cb) => cb(accessToken), // Provide the access token
      volume: 0.5, // Initial volume
    });

    // Connect the player
    player.connect();

    // Set up event listeners
    player.addListener('ready', ({ device_id }) => {
      console.log('Player is ready with Device ID', device_id);
      setDeviceId(device_id); // Save the device ID for playback
    });

    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    player.addListener('player_state_changed', (state) => {
      console.log('Player state changed:', state);
      setPlayerState(state); // Save the player state
    });

    setPlayer(player); // Save the player instance
  };
}, [accessToken]);

Play a Track: Use the Spotify Web API to transfer playback to the Web Playback SDK and start playing a track.

const playTrack = async (trackUri) => {
  if (!deviceId) return;

  await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: [trackUri], // Spotify track URI
    }),
  });
};

4. Update LetterModal to Use the SDK
Modify your LetterModal component to use the Web Playback SDK for playback and metadata.

Example:

import { useEffect, useState } from 'react';

function LetterModal({ letter, onClose }) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const [accessToken, setAccessToken] = useState(''); // Replace with your token logic

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new Spotify.Player({
        name: 'LetterModal Player',
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      });

      player.connect();

      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
      });

      player.addListener('player_state_changed', (state) => {
        setPlayerState(state);
      });

      setPlayer(player);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [accessToken]);

  const playTrack = async () => {
    if (!deviceId) return;

    await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [letter.songUrl], // Spotify track URI
      }),
    });
  };

  const pauseTrack = () => {
    player.pause();
  };

  const setVolume = (volume) => {
    player.setVolume(volume);
  };

  return (
    <div>
      <h3>{letter.title}</h3>
      <button onClick={playTrack}>Play</button>
      <button onClick={pauseTrack}>Pause</button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        onChange={(e) => setVolume(parseFloat(e.target.value))}
      />
    </div>
  );
}
5. Ensure Full Track Playback
Full track playback requires a Spotify Premium account.
Ensure the user is authenticated and has granted the necessary permissions (user-modify-playback-state).
6. Fetch Metadata
You can fetch metadata (e.g., album cover, artist name) using the Spotify Web API.

Example:

const fetchTrackInfo = async (trackId) => {
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  return data;
};

7. Final Notes
Ensure you handle token expiration by refreshing the token when needed.
Test the integration thoroughly to ensure smooth playback and metadata fetching.
Let me know if you need help with any specific part!