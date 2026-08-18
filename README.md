# AutoMinutes — Backend

GraphQL API server for AutoMinutes. Owns meetings, transcripts, AI processing, action items, and attendees, and exposes auth over a small REST surface for cookie- and multipart-based flows.

Client: [AutoMinutes frontend](../frontend), a React SPA that consumes this API.

## What it does

**Meetings & transcripts**

- Meeting CRUD, owner-scoped, with pagination, search, sort, and status filtering.
- Status lifecycle: `PENDING` → `PROCESSING` → `COMPLETED` / `FAILED`.
- Transcript upload is versioned — re-uploading keeps prior versions, each queryable and restorable as the active one.

**AI processing**

- Sends the active transcript to a local LLM via **Ollama**, requesting structured JSON output: summary, decisions, detailed notes, follow-ups, action items, and attendees.
- Extracted attendees are matched/merged into the meeting's attendee list by email; extracted action items are matched to attendees by name.
- Regenerating results wipes prior AI-generated action items/attendees but preserves anything a user added or reassigned by hand.

**Action items & attendees**

- Action items: create, partial update (title, description, deadline, status, assignee), delete — scoped to the owning meeting.
- Attendees: create, delete, linked to a meeting with a role (`ORGANIZER` / `PARTICIPANT` / `UNKNOWN`).

**Auth**

- JWT access + refresh tokens; refresh token lives in an `httpOnly` cookie, access token is returned to the client for use as a bearer token (works against both REST and GraphQL, via a shared `AuthGuard`).
- Google OAuth (`/auth/google` → `/auth/google/callback`).
- Email verification (signup issues a code, sent via SMTP) and forgot/reset password, both backed by short-lived Mongo-stored tokens.

**Avatars**

- Uploaded images are re-encoded server-side with `sharp` — cropped to a fixed 512×512 WebP, EXIF/metadata stripped — then stored in Cloudflare R2. The previous avatar is deleted if it was one AutoMinutes hosted.

**Rate limiting**

- Global default: 120 requests/minute per IP (`@nestjs/throttler`, applied to both REST and GraphQL via a shared guard).
- Auth endpoints that are easy to abuse (signup, login, resend-verification, forgot-password, reset-password) are capped tighter at 5 requests/minute.
- Configurable via `THROTTLE_TTL` / `THROTTLE_LIMIT`. `TRUST_PROXY` must only be `true` behind a real reverse proxy — otherwise `X-Forwarded-For` lets a client spoof the IP the limiter keys on.

## Tech stack

- **NestJS + TypeScript**
- **GraphQL, code-first** (`@nestjs/graphql` + Apollo Server) — the schema is generated on boot into `src/schema.gql` (git-ignored, do not hand-edit); this is the primary API surface
- **MongoDB via Mongoose**
- **JWT auth** (`@nestjs/jwt`) + **Google OAuth** (`google-auth-library`)
- **Ollama** for AI processing (`llama3.1` by default), called directly over HTTP — no LLM SDK in the loop
- **Cloudflare R2** (S3-compatible) for avatar storage, **sharp** for image processing
- **Nodemailer** over SMTP for verification and password-reset emails
- **class-validator** / **class-transformer** on GraphQL input DTOs

## Module layout (`src/`)

One folder per domain, each following the same shape: `*.module.ts`, `*.resolver.ts` or `*.controller.ts`, `*.service.ts`, `dtos/`, `entities/` (GraphQL types), `schemas/` (Mongoose schemas).

```
auth/                  login, signup, refresh, logout, Google OAuth, guards
users/                 user schema, avatar upload (R2 + sharp)
meetings/              meeting CRUD, transcript upload + versioning
ai/                    Ollama integration, prompt building, AI results
action-items/          action item CRUD, status tracking
attendees/             attendee CRUD
email-verification/    signup verification codes
password-reset/        forgot/reset password tokens
mail/                  nodemailer wrapper + email templates
database/, config/     Mongo connection, env-driven config modules
common/, middlewares/  shared guards (incl. GraphQL-aware throttler), request logging
```

## Getting started

```bash
npm install
cp .env.example .env   # fill in secrets — see inline comments for what each var needs
docker compose up -d   # Mongo (27018), Mongo Express (8081, admin/admin), Ollama (11434)
npm run start:dev
```

The `ollama-pull` service in `docker-compose.yml` pulls `llama3.1` into the shared volume automatically on first `docker compose up`; AI processing will fail until that finishes.

GraphQL playground: `http://localhost:<PORT>/graphql`.

## Scripts

```bash
npm run start:dev              # watch mode
npm run build                  # compile
npm run start:prod             # run compiled output

npm run lint                   # eslint --fix
npm run test / test:cov / test:e2e

npm run seed:meetings -- <userId> [count]   # seed fake meetings for an existing user
npm run backfill:email-verified             # one-off migration script
```

## Deploying to Vercel

The app runs as a single serverless function (`api/index.ts`) that boots the Nest app and caches it across warm invocations. `vercel.json` uses the legacy `builds`/`routes` config, which takes full manual control of the build and bypasses Vercel's zero-config framework detection entirely - no Dashboard "Framework Preset", "Build Command", or "Output Directory" setting matters once `builds` is present, which matters here because Vercel's own NestJS zero-config detection repeatedly mis-wrapped this project's `main.ts` (broken alias resolution, "no exports found", a missing static output directory).

Because of this, path aliases (`@app/*`, `@config/*`, etc.) aren't used anywhere in `src/` - everything is plain relative imports, since `@vercel/node` compiles `api/index.ts` (and everything it imports) directly from TS source and doesn't resolve tsconfig `paths`.

After changing anything deploy-related, redeploy fresh (push a commit, or Redeploy with "Use existing Build Cache" unchecked) - reusing an old deployment can keep its original settings/cache.

Required env vars beyond local dev: `MONGODB_URI` pointing at a reachable database (e.g. MongoDB Atlas - `localhost` won't work), `FRONTEND_URL`/`GOOGLE_CALLBACK_URL` set to the deployed URLs, `TRUST_PROXY=true` (Vercel sits in front as a reverse proxy), and `AI_PROVIDER=groq` with `GROQ_API_KEY` set (Ollama isn't reachable from serverless).

## API surface

Most operations go through a single GraphQL endpoint (`POST /graphql`). A handful of REST routes exist where cookies or multipart bodies make more sense than GraphQL:

- `POST /auth/signup|login|refresh|logout`
- `GET /auth/google`, `GET /auth/google/callback`
- `POST /auth/verify-email`, `POST /auth/resend-verification`
- `POST /auth/forgot-password`, `POST /auth/reset-password`
- `GET /auth/me`
- `POST /users/me/avatar` (multipart image upload)
