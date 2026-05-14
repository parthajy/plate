# ARCHITECTURE.md — PLATE

System architecture, data model, deployment, and operational rules. Read this
before any backend, database, or infra work.

---

## Topology

```
   ┌─────────────┐         ┌──────────────────────────────────────────┐
   │  Mobile App │  HTTPS  │            DigitalOcean Droplet          │
   │  (Expo RN)  │ ──────► │  ┌──────┐   ┌─────────┐   ┌──────────┐  │
   └─────────────┘         │  │ Caddy│ → │ Fastify │ → │ Postgres │  │
        │                  │  │ :443 │   │  :3000  │   │  :5432   │  │
        │                  │  └──────┘   └────┬────┘   └──────────┘  │
        │                  │                  │                       │
        │                  └──────────────────┼───────────────────────┘
        │                                     │
        │                                     ▼
        │                          ┌──────────────────┐
        │                          │ Anthropic API    │ ← coach, vision, recipes
        │                          └──────────────────┘
        │                                     │
        ▼                          ┌──────────────────┐
   ┌─────────────┐                 │  DO Spaces       │ ← food images
   │ Apple/Google│                 │  (S3-compatible) │
   │ OAuth       │                 └──────────────────┘
   └─────────────┘
```

**One box. Three processes. That's it.** Caddy + Fastify + Postgres.
PM2 manages the Node process. Postgres runs as a system service. Caddy
auto-renews SSL via Let's Encrypt.

---

## Hardware budget

- **Droplet**: $12/mo Basic, 2GB RAM, 1 vCPU, 50GB SSD, 2TB transfer
- **Backups**: enable DO automated backups (+$2.40/mo). Worth it.
- **DO Spaces**: $5/mo for 250GB + 1TB egress (for food scan images)
- **Cloudflare** in front: free, gives us CDN, DDoS, and analytics

Memory budget at idle:
- Postgres: ~250–400 MB
- Node + Fastify: ~150–200 MB
- Caddy: ~30 MB
- OS + monitoring: ~200 MB
- **Headroom: ~1 GB** for traffic spikes, OS page cache (which Postgres relies on heavily)

If we go above 70% memory utilization at idle, bump to the $18 droplet (4GB).
Don't optimize prematurely.

---

## Backend stack

| Concern | Tool | Notes |
|---|---|---|
| Runtime | Node 20 LTS | |
| Framework | Fastify 4 | Lower overhead than Express, schema-first |
| Validation | Zod | Shared types with mobile via a `shared/` package |
| ORM | Drizzle | Type-safe SQL builder. No query engine = low RAM. |
| DB driver | `postgres` (porsager) | Fast, light, no `pg` deps |
| DB | PostgreSQL 16 | Local on droplet |
| Auth | JWT (jose), bcrypt for password hash | Access tokens 15min, refresh 30d |
| AI | `@anthropic-ai/sdk` | Server-side only |
| File upload | `@fastify/multipart` → DO Spaces via S3 SDK | |
| Logs | `pino` (built into Fastify) | Pretty in dev, JSON in prod |
| Process mgr | PM2 | `pm2-runtime` if we ever Dockerize |
| Reverse proxy | Caddy 2 | Auto-SSL, gzip, brotli, sane defaults |

### Why not …

- **Express** — fine, but Fastify is faster and lighter, matters on 2GB.
- **Prisma** — query engine is a separate Rust binary that eats 100+ MB. No.
- **NestJS** — too much ceremony for this size of app.
- **Supabase / Firebase** — vendor lock-in, costs scale unpredictably. We
  own our DB. Self-hosted Supabase on the droplet isn't worth the complexity.
- **Docker** — overhead and memory cost not justified for a single backend. If
  we ever go multi-service, revisit. Until then, `apt` and `systemd` are fine.

---

## Repo structure (backend)

```
/backend
  src/
    server.ts              ← Fastify boot
    config.ts              ← env loading, Zod-validated
    routes/
      auth.ts              ← /auth/signup, /login, /refresh, /apple, /google
      me.ts                ← /me, /me/onboarding, /me/goals
      food.ts              ← /food/search, /food/log, /food/scan
      coach.ts             ← /coach/messages, /coach/stream (SSE)
      pantry.ts            ← /pantry, /recipes/generate
      workout.ts           ← /workouts
    db/
      schema.ts            ← Drizzle table definitions
      client.ts            ← postgres connection
    services/
      ai.ts                ← Anthropic client wrappers (chat, vision, recipes)
      auth.ts              ← password hashing, JWT signing, OAuth verifiers
      storage.ts           ← DO Spaces upload
      foodDb.ts            ← search local foods + USDA fallback
    lib/
      errors.ts
      ratelimit.ts
      logger.ts
  drizzle/                 ← generated migrations
  drizzle.config.ts
  package.json
  tsconfig.json
  .env.example
```

---

## Database schema (v1)

Designed for the MVP. Add columns later via migrations; don't preemptively over-design.

```ts
// src/db/schema.ts (Drizzle)

users {
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  email           text UNIQUE NOT NULL
  password_hash   text                              // nullable if OAuth-only
  apple_sub       text UNIQUE                       // Sign in with Apple
  google_sub      text UNIQUE
  display_name    text
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()
}

profiles {
  user_id         uuid PRIMARY KEY REFERENCES users(id)
  sex             text                              // 'm','f','x'
  birthdate       date
  height_cm       integer
  weight_kg       numeric(5,2)
  activities      text[]                            // ['gym','run','cycle','sports']
  goal            text                              // 'lose','maintain','gain','recomp'
  goal_rate_kg_wk numeric(3,2)                      // e.g. 0.5
  daily_kcal      integer
  daily_protein_g integer
  daily_carbs_g   integer
  daily_fat_g     integer
  units           text DEFAULT 'metric'             // 'metric' | 'imperial'
  timezone        text
  onboarded_at    timestamptz
}

// Master food list — seeded from USDA FoodData Central + user-created entries
foods {
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  source          text NOT NULL                     // 'usda','user','barcode'
  source_ref      text                              // FDC ID, barcode, etc.
  name            text NOT NULL
  brand           text
  serving_g       numeric(7,2)
  kcal_per_100g   numeric(6,2)
  protein_per_100g numeric(5,2)
  carbs_per_100g  numeric(5,2)
  fat_per_100g    numeric(5,2)
  fiber_per_100g  numeric(5,2)
  created_by      uuid REFERENCES users(id)        // null for system entries
  created_at      timestamptz DEFAULT now()

  INDEX idx_foods_name USING gin (to_tsvector('english', name || ' ' || coalesce(brand,'')))
}

food_logs {
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES users(id)
  food_id         uuid REFERENCES foods(id)         // null for scan-only entries
  grams           numeric(7,2) NOT NULL
  kcal            numeric(6,2) NOT NULL             // denormalized at log time
  protein_g       numeric(5,2) NOT NULL
  carbs_g         numeric(5,2) NOT NULL
  fat_g           numeric(5,2) NOT NULL
  meal_type       text                              // 'breakfast','lunch','dinner','snack'
  logged_at       timestamptz NOT NULL
  source          text NOT NULL                     // 'manual','scan','barcode','recipe'
  scan_image_url  text                              // DO Spaces URL if from scan
  scan_confidence numeric(3,2)                      // 0-1
  notes           text
  created_at      timestamptz DEFAULT now()

  INDEX idx_foodlogs_user_date (user_id, logged_at DESC)
}

workouts {
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES users(id)
  type            text NOT NULL                     // 'gym','run','ride','swim','sport','other'
  duration_min    integer
  kcal_burned     integer                           // estimated
  distance_km     numeric(6,2)
  notes           text
  detail          jsonb                             // sets/reps for gym, pace/HR for run, etc.
  started_at      timestamptz NOT NULL
  source          text NOT NULL                     // 'manual','apple_health','google_fit','strava'
  created_at      timestamptz DEFAULT now()

  INDEX idx_workouts_user_date (user_id, started_at DESC)
}

pantry_items {
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES users(id)
  ingredient      text NOT NULL
  added_at        timestamptz DEFAULT now()

  UNIQUE (user_id, ingredient)
}

coach_messages {
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES users(id)
  role            text NOT NULL                     // 'user','assistant','system'
  content         text NOT NULL
  metadata        jsonb                             // tool calls, suggestion chips, etc.
  created_at      timestamptz DEFAULT now()

  INDEX idx_msgs_user_time (user_id, created_at DESC)
}

// Refresh tokens (revocable)
refresh_tokens {
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid NOT NULL REFERENCES users(id)
  token_hash      text UNIQUE NOT NULL
  device_label    text
  expires_at      timestamptz NOT NULL
  revoked_at      timestamptz
  created_at      timestamptz DEFAULT now()
}
```

### Schema notes

- Use `gen_random_uuid()` (pgcrypto). UUIDv7 would be better for index locality
  but UUIDv4 from pgcrypto is one less dependency. Revisit if write volume grows.
- **Denormalize macros into `food_logs`.** The `foods` row can change; the log
  should remain a record of what was actually logged. Don't join at read time.
- **`jsonb` for workout `detail`** — schema varies wildly by workout type, JSONB
  is the right call. Validate shape in the app layer.
- **Coach messages stored verbatim** for context. We'll add summarization later
  when contexts get long; v1 just sends the last ~20 messages.

---

## API surface (v1)

REST + JSON. Versioned under `/v1`. Auth via `Authorization: Bearer <jwt>`.

```
POST   /v1/auth/signup              { email, password, displayName } → { tokens }
POST   /v1/auth/login               { email, password } → { tokens }
POST   /v1/auth/refresh             { refreshToken } → { tokens }
POST   /v1/auth/logout              (revokes refresh token)
POST   /v1/auth/apple               { identityToken } → { tokens }
POST   /v1/auth/google              { idToken } → { tokens }

GET    /v1/me                       → profile + goals
PATCH  /v1/me                       update profile
POST   /v1/me/onboarding            initial setup → calculates goals
PATCH  /v1/me/goals                 override goal numbers

GET    /v1/food/search?q=...        → [foods]
POST   /v1/food/log                 manual log entry
DELETE /v1/food/log/:id
POST   /v1/food/scan                multipart image → { food, macros, confidence }
GET    /v1/food/logs?date=YYYY-MM-DD → [logs] + day totals

GET    /v1/coach/messages?limit=50&before=<cursor>
POST   /v1/coach/messages           { content } → assistant reply (or SSE stream)

GET    /v1/pantry                   → [items]
POST   /v1/pantry                   { ingredient }
DELETE /v1/pantry/:id
POST   /v1/recipes/generate         { filters? } → { recipe }

GET    /v1/workouts?from=...&to=... → [workouts]
POST   /v1/workouts                 log a workout
DELETE /v1/workouts/:id
POST   /v1/integrations/apple-health/import   bulk push from app
```

### Conventions

- All timestamps ISO 8601, UTC. Mobile renders in local time using user's TZ.
- Errors: `{ error: { code, message, field? } }`. HTTP status reflects category.
- Rate limit per IP and per user (token bucket in Postgres or in-memory).
  Tightest limits on `/food/scan` and `/coach/messages` because those cost
  Anthropic credits.
- Idempotency keys on POSTs that cost money (scan, coach) to avoid duplicate
  charges on retries.

---

## Auth flow

**Signup / Login:**
1. Client POSTs credentials → server validates → returns `{ accessToken (15m), refreshToken (30d) }`.
2. Both stored in `expo-secure-store` (encrypted keychain/keystore).
3. Access token sent in `Authorization: Bearer` header.
4. On 401, client uses refresh token to get a new pair. If refresh fails, log out.

**Apple / Google:**
1. Native SDK on client returns identity token.
2. Backend verifies signature against Apple/Google JWKS.
3. Match by `apple_sub` / `google_sub` or email; create user if needed.
4. Issue our own tokens. We never re-use Apple/Google tokens past verification.

**Password hashing:** bcrypt, cost factor 12.

**JWT signing:** HS256 with a strong secret in env. Rotate via dual-secret
window if ever needed.

---

## AI integration

All AI calls happen server-side via `@anthropic-ai/sdk`. The mobile app
never sees the API key.

### Model choices

| Use case | Model | Why |
|---|---|---|
| Coach chat | `claude-sonnet-4-6` | Good reasoning, fast, reasonable cost |
| Food scan (vision) | `claude-sonnet-4-6` | Vision-capable, accurate portion estimates |
| Recipe generation | `claude-haiku-4-5` | Cheap, fast, structured output is enough |
| Quick classifications | `claude-haiku-4-5` | e.g. workout type from free-text |

### Coach context construction

Each `/coach/messages POST` builds context like this:

```
system: <Kai persona prompt + user's profile, goals, today's totals,
         recent workouts (last 7d), recent foods (today)>
messages: <last ~20 coach_messages>
user: <new message>
```

Persona prompt lives in `src/services/ai/prompts/coach.ts`. Tweak there,
don't sprinkle prompt strings through routes.

### Food scan flow

1. Client compresses image (Expo ImageManipulator, max 1024px wide, 0.6 quality JPEG).
2. POST multipart to `/food/scan`. Server stores to DO Spaces, gets URL.
3. Server calls Claude vision with image + structured output schema (Zod → JSON Schema):
   ```ts
   { food_name, brand?, portion_grams, confidence,
     kcal, protein_g, carbs_g, fat_g, notes? }
   ```
4. Return to client. Client can then `POST /food/log` to commit it (so users
   can review/adjust before logging).
5. Cost: ~$0.005–0.01 per scan. Cache by image hash for 24h (same photo
   scanned twice doesn't re-charge).

### Cost guardrails

- Per-user soft cap on AI calls per day. Default: 50 scans + 100 coach turns.
- Free tier (if we add one) gets ~10 scans/day, no coach.
- Track per-user AI spend in a `usage_events` table. Build a dashboard later.

---

## Deployment

### Initial provisioning (one-time)

```bash
# On a fresh Ubuntu 24.04 droplet, as root:

# 1. Create non-root user
adduser deploy && usermod -aG sudo deploy

# 2. Postgres
apt update && apt install -y postgresql-16 postgresql-contrib
sudo -u postgres createuser --pwprompt plate
sudo -u postgres createdb -O plate plate_prod

# 3. Node via nvm (or NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pm2

# 4. Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
# (follow caddyserver.com/docs/install)

# 5. Firewall
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable

# 6. Clone repo, set up backend
git clone <repo>
cd plate/backend
npm ci
cp .env.example .env  # fill in secrets
npm run db:migrate
pm2 start ecosystem.config.js
pm2 startup && pm2 save
```

### Caddyfile

```
api.plate.best {
  reverse_proxy 127.0.0.1:3000
  encode gzip zstd
}
```

That's literally the whole config. Caddy handles SSL.

### Deploy on push

`.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [main]
    paths: ['backend/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DROPLET_HOST }}
          username: deploy
          key: ${{ secrets.DROPLET_KEY }}
          script: |
            cd ~/plate
            git pull
            cd backend
            npm ci --production=false
            npm run build
            npm run db:migrate
            pm2 reload plate-api
```

### Backups

- DO automated backups: enabled, weekly snapshot.
- Daily `pg_dump` to DO Spaces via cron:
  ```bash
  0 3 * * * pg_dump plate_prod | gzip | aws s3 cp - s3://plate-backups/db/$(date +\%F).sql.gz --endpoint=...
  ```
- Retain 30 days.

---

## Observability

- **Logs**: `pino` → stdout → PM2 captures → `pm2 logs`. Pipe to a hosted
  service (Axiom, Better Stack) when traffic justifies it.
- **Errors**: Sentry, free tier (5k events/mo) is plenty initially.
  Wire up `@sentry/node` in backend, `sentry-expo` in mobile.
- **Uptime**: BetterStack free pinger, alerts to phone.
- **Metrics**: Skip Prometheus until we need it. PM2's built-in monitoring
  is enough at this size.

---

## Security checklist

- [ ] Postgres `pg_hba.conf`: only allow `local` and `127.0.0.1` connections.
- [ ] Strong DB password, stored only in `.env`.
- [ ] SSH key-only auth on droplet, password auth disabled.
- [ ] `ufw` enabled, only 22/80/443 open.
- [ ] Automatic security updates: `unattended-upgrades`.
- [ ] Rate limit auth endpoints (`/auth/login`, `/auth/signup`) hard — 5/min/IP.
- [ ] Bcrypt cost factor ≥ 12.
- [ ] All user input validated with Zod at the route layer.
- [ ] Parameterized queries everywhere (Drizzle handles this; never raw SQL with concat).
- [ ] CORS: only allow the mobile app's origin (or `*` for development with API key check).
- [ ] CSP headers (Caddy can add them).
- [ ] No secrets in mobile bundle. EAS Secrets for build-time, expo-secure-store for runtime.

---

## When the $12 droplet isn't enough

Signals to upgrade:
- Memory usage > 70% sustained → bump to 4GB ($18/mo)
- DB > 60% of disk → bump storage or move DB to a managed Postgres
- API p99 latency > 500ms on simple reads → add Redis cache, or scale up
- Concurrent users > ~2k DAU → time to split DB and app servers

Don't pre-optimize. Solve problems when they're problems.
