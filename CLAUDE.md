# CLAUDE.md — PLATE

PLATE is a cross-platform mobile fitness + nutrition app (iOS + Android) with an AI coach.
This file is the entry point for Claude Code working anywhere in this repo.

---

## What this is

A B2C consumer app for **regular people who move** — gym 3x a week, runs on weekends,
plays football with friends, takes a cycling class sometimes. **Not** specialist
endurance athletes (triathletes already have TrainingPeaks; we're not chasing them).

Positioning: **"MyFitnessPal for people who actually move."**

Core features (the only things that matter):

1. **Calorie + macro tracking** with three-second logging
2. **Food scan** — camera → Claude Vision estimates food, portion, and macros
3. **AI coach "Kai"** — Claude-powered, remembers your goals/history/activity, replies fast
4. **Pantry → Recipe** — list what you have, get a high-protein recipe in seconds
5. **Light workout logging** — log "gym 60min" or sets/reps if you want, plus Apple Health/Google Fit sync
6. **Sport context at signup** — multi-select (gym, run, cycle, swim, sports, yoga). Drives the *coach's* tone and advice, not separate dashboards. One UI for everyone.

---

## Stack (committed)

| Layer | Choice | Why |
|---|---|---|
| Mobile | Expo SDK 50+, React Native, TypeScript | One codebase, EAS Build for both stores |
| Routing | Expo Router (file-based) | Convention over config |
| Styling | NativeWind (Tailwind for RN) | Claude Code writes Tailwind fluently |
| Mobile state | Zustand + React Query (TanStack) | Lightweight, no Redux ceremony |
| Forms | React Hook Form + Zod | Type-safe validation, shared with backend |
| Animations | React Native Reanimated 3 | Smooth, gesture-driven |
| Backend | Node 20, TypeScript, Fastify | Lighter than Express, fast on 2GB |
| ORM | Drizzle | Type-safe SQL, low memory (Prisma is too heavy) |
| DB | PostgreSQL 16 | Battle-tested. Lives on the same droplet |
| AI | Anthropic Claude API | Sonnet for vision/coach, Haiku for cheap tasks |
| Auth | JWT (access + refresh) + Apple/Google Sign-In | Apple is mandatory if Google is offered |
| Infra | DigitalOcean basic droplet ($12/mo) | One box. Caddy + PM2 + Postgres |
| Reverse proxy | Caddy | Auto-SSL via Let's Encrypt, dead simple |
| Process mgr | PM2 | Restart on crash, logs |
| File storage | DO Spaces ($5/mo) for food images | S3-compatible, cheap |

---

## Repo layout

```
/                  ← root docs live here
  CLAUDE.md
  DESIGN.md        ← read before any UI work
  ARCHITECTURE.md  ← read before any backend/DB work
  ROADMAP.md       ← what's being built next
  README.md

/mobile            ← Expo app
  CLAUDE.md        ← mobile-specific conventions
  app/             ← Expo Router screens
  components/
  lib/
  hooks/
  ...

/backend           ← Fastify API
  CLAUDE.md        ← backend-specific conventions
  src/
    routes/
    db/
    services/
    lib/
  drizzle/         ← migrations
  ...
```

---

## Hard rules — do not break these

- **TypeScript everywhere.** No `any` without a comment justifying it.
- **The backend runs on 2GB RAM.** Be frugal. No Prisma. No new heavy deps without checking memory.
- **No Docker on the production droplet.** Postgres via `apt`, Node via PM2, Caddy directly. Less moving parts, less RAM.
- **All AI calls go through the backend.** The Anthropic API key never ships in the mobile bundle.
- **No new dependencies in mobile without checking bundle size.** Use `npx expo-doctor` and look at the produced bundle.
- **Use UUIDs for all public-facing IDs.** Generated via Postgres `gen_random_uuid()` (pgcrypto, UUIDv4). UUIDv7 was considered for index locality but rejected to avoid adding an extension or Node-side generator. Revisit if write volume warrants. Internal numeric IDs are fine for FKs but never expose them in URLs or API responses.
- **Migrations are append-only.** Never edit a committed migration; write a new one.
- **No secrets in code.** Use `.env` locally, environment variables on the droplet. Both should be gitignored.
- **Match existing code style.** Don't reformat files you're not changing. If you find inconsistency, fix it in a separate commit and say so.

---

## Brand

- App name: **PLATE** (placeholder — can be renamed before App Store submission)
- AI coach name: **Kai**
- Tone: dark editorial, sleek, serious-but-not-clinical, lifter-friendly without alienating runners
- Accent: electric lime (#dcff4f) on near-black warm bg
- Full design tokens in `DESIGN.md`

---

## Important docs to read

Before doing significant work, Claude Code should read:

- **`DESIGN.md`** — design system, color tokens, typography, component patterns, animation
- **`ARCHITECTURE.md`** — backend, DB schema, API surface, deployment, auth flow
- **`ROADMAP.md`** — phased build order. Don't build phase 3 stuff before phase 1 is done.
- **`mobile/CLAUDE.md`** or **`backend/CLAUDE.md`** depending on which package you're in.

---

## Commands (filled in as repo is bootstrapped)

```bash
# Mobile dev
cd mobile && npx expo start

# Backend dev
cd backend && npm run dev

# DB migrate
cd backend && npm run db:migrate

# Type-check everything
npm run typecheck    # in each package

# Build for stores
cd mobile && eas build --platform ios
cd mobile && eas build --platform android
```

---

## When in doubt

1. Check the relevant detailed doc (DESIGN, ARCHITECTURE, ROADMAP).
2. Look at how similar things are done elsewhere in the codebase.
3. Pick the simpler option. We're not Google. We have 2GB of RAM.
4. Ask before adding a new dependency, new service, or new abstraction layer.
