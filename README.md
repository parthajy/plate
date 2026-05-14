# PLATE

A cross-platform mobile fitness + nutrition app. iOS + Android, one codebase.

## What it is

**"MyFitnessPal for people who actually move."**

A B2C app for regular people who go to the gym, run on weekends, or play
sports — not specialist endurance athletes. The wedge is speed (3-second food
logging) and a Claude-powered AI coach that knows your goals, your activities,
and what you ate today.

Core features:

- **Calorie + macro tracking** — fast, manual, native
- **Food scan** — point at a plate, Claude Vision estimates portion + macros
- **AI coach (Kai)** — chat with an assistant that has your context
- **Pantry → Recipe** — list what's in the fridge, get a high-protein recipe
- **Light workout logging** — gym, run, ride, sport, plus Apple Health / Google Fit sync

## Stack

- **Mobile**: Expo (React Native) + TypeScript + NativeWind + React Query
- **Backend**: Node 20 + Fastify + Drizzle + PostgreSQL
- **AI**: Anthropic Claude (Sonnet for vision/coach, Haiku for cheap tasks)
- **Infra**: One $12 DigitalOcean droplet. Caddy + PM2 + Postgres. No Docker.

## Repo layout

```
/mobile      ← Expo app
/backend     ← Fastify API
/shared      ← Zod schemas shared between the two
```

## Docs

Read in this order before contributing:

1. [`CLAUDE.md`](./CLAUDE.md) — project context + hard rules
2. [`DESIGN.md`](./DESIGN.md) — design system, colors, typography, components
3. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — backend, DB schema, deployment
4. [`ROADMAP.md`](./ROADMAP.md) — phased build plan

Plus package-scoped docs:
- [`mobile/CLAUDE.md`](./mobile/CLAUDE.md)
- [`backend/CLAUDE.md`](./backend/CLAUDE.md)

## Quick start (once bootstrapped)

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in real values
npm run db:migrate
npm run dev            # localhost:3000

# Mobile
cd mobile
npm install
npx expo start         # scan QR or press i / a
```

## Status

Pre-MVP. See `ROADMAP.md` for what's being built next.
