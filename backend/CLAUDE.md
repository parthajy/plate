# backend/CLAUDE.md

Backend-specific conventions. Read this when working in `/backend`.
Defers to root `CLAUDE.md` and `ARCHITECTURE.md` for anything not covered.

---

## Stack

- Node 20 LTS, TypeScript strict
- Fastify 4 (HTTP framework)
- Drizzle ORM + `postgres` (porsager) driver
- PostgreSQL 16
- Zod for validation (shared with mobile via `/shared`)
- `@anthropic-ai/sdk` for AI calls (server-only)
- `@aws-sdk/client-s3` for DO Spaces (S3-compatible)
- `pino` for logging
- `jose` for JWT, `bcrypt` for password hashing
- PM2 in production, `tsx watch` for dev

## Folder layout

```
backend/
  src/
    server.ts             ← boot, plugin registration
    config.ts             ← env loader, Zod-validated
    routes/
      auth.ts
      me.ts
      food.ts
      coach.ts
      pantry.ts
      workout.ts
      _hooks.ts           ← shared preHandlers (auth, rate limit)
    db/
      schema.ts           ← Drizzle tables
      client.ts           ← postgres connection
      seed.ts             ← seed USDA foods, dev data
    services/
      auth.ts             ← password hash, JWT sign/verify
      ai/
        index.ts
        coach.ts          ← coach context builder + call
        vision.ts         ← food scan
        recipe.ts
        prompts/
          coach.ts        ← persona prompt
          recipe.ts
      storage.ts          ← DO Spaces upload
      foodDb.ts           ← search + USDA fallback
      usage.ts            ← per-user AI budget tracking
    lib/
      errors.ts           ← AppError class
      ratelimit.ts
      logger.ts
      uuid.ts             ← gen_random_uuid wrapper
  drizzle/                ← migrations (generated, do not edit)
  drizzle.config.ts
  ecosystem.config.js     ← PM2
  package.json
  tsconfig.json
  .env.example
```

## Route conventions

- One file per resource. Routes register their schemas + handlers.
- Use Fastify's schema-first validation:
  ```ts
  fastify.post('/v1/food/log', {
    schema: { body: zodToJsonSchema(LogFoodSchema) },
    preHandler: [requireAuth, rateLimit('food.log', 60)],
    handler: async (req, reply) => { ... },
  });
  ```
- Handlers are thin. Business logic in `services/`. DB queries in services
  or inline if trivial.
- Always return typed responses; use `reply.send(...)`. Don't return raw objects.

## Error handling

- Throw `AppError` (custom class) from services with a `code`, `message`, and
  HTTP status. A global error handler maps it to `{ error: { code, message } }`.
- Validation errors from Fastify (Zod) auto-format to the same shape.
- Never leak internals. In prod, unknown errors return generic 500.

## Database access

- All queries through Drizzle. Never raw SQL with string concatenation.
- Use parameterized queries (Drizzle handles this) — protects against injection.
- Transactions for any multi-statement write that must be atomic
  (e.g., signup creates user + profile).
- Pool size: Drizzle's default with `postgres` (10 connections) is fine.
  Don't increase without measuring.

## Migrations

- Generated via `drizzle-kit generate`. Committed to git.
- **Never edit a committed migration.** Add a new one to alter.
- Run on deploy: `npm run db:migrate` before reloading PM2.
- Dev: run automatically on `npm run dev`.

## Validation

- All request bodies, params, and queries validated by Zod schemas.
- Schemas live in `/shared/schemas` so mobile uses the same definitions.
- Never trust the client. Re-validate even things the mobile UI already checks.

## Auth

- `requireAuth` preHandler attaches `req.user = { id, email }` to the request
  or throws 401.
- Tokens: HS256 JWT, 15-minute access, 30-day refresh.
- Refresh tokens are stored hashed (sha256) in the DB so they're revocable.
- Apple/Google: verify identity tokens against their JWKS. Cache JWKS for an hour.

## AI calls

- All Anthropic calls go through `services/ai/*`. No direct SDK usage in routes.
- Each AI service:
  - Takes a typed input
  - Builds the prompt + context
  - Calls the SDK
  - Parses (Zod) and returns a typed result
  - Logs cost to `usage_events`
- Budgets enforced via `services/usage.ts` — throw `BudgetExceededError` if over.
- Vision calls: store the image first (DO Spaces), pass the URL to Claude.
- Coach calls: build context fresh each time. Don't carry state in-memory
  across requests (multi-process safety).

## Rate limiting

- Token bucket per (user, action) and per (IP, action).
- Stored in Postgres for now (`rate_limit_buckets` table). If contention grows,
  move to in-memory LRU per process + occasional flush, or Redis.
- Tightest limits on `/auth/login`, `/auth/signup`, `/food/scan`, `/coach/messages`.

## Logging

- `req.log.info({ userId, ... }, 'message')`. Use structured fields, not
  string interpolation.
- Never log secrets, tokens, full request bodies, or user PII beyond user ID.
- Errors: `req.log.error({ err }, 'context')`. Pino auto-serializes errors.
- In dev: pretty-printed. In prod: JSON to stdout, captured by PM2.

## Memory discipline

- 2GB total budget. Backend runs in ~200 MB at idle.
- Don't load huge JSON files into memory. Stream where possible.
- Don't cache user-specific data in-memory across requests (won't scale to
  multiple processes anyway).
- Watch for memory leaks: `pm2 monit` shows per-process memory live.

## Tests

- Vitest. Unit tests for services, integration tests for routes (with a real
  Postgres in a docker-compose test setup).
- Don't test Drizzle. Test your business logic.
- Aim for confidence, not coverage percentage.

## Environment variables

Required (validated at boot via Zod, app refuses to start if missing):

```
DATABASE_URL=postgresql://plate:pw@localhost:5432/plate_prod
JWT_SECRET=<32+ random chars>
JWT_REFRESH_SECRET=<32+ random chars>
ANTHROPIC_API_KEY=sk-ant-...

# DO Spaces (S3-compatible)
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_BUCKET=plate-uploads
SPACES_ACCESS_KEY=...
SPACES_SECRET=...

# OAuth
APPLE_CLIENT_ID=best.plate.app
GOOGLE_CLIENT_ID_IOS=...
GOOGLE_CLIENT_ID_ANDROID=...

# Optional
SENTRY_DSN=...
LOG_LEVEL=info
NODE_ENV=production
PORT=3000
```

`.env.example` is committed. `.env` is gitignored.

## Things that have bitten us before

- **JWT clock skew**: allow ±60s leeway in `verify`. Servers' clocks drift.
- **Postgres pool exhaustion on cold starts**: don't open 50 connections.
  Stick with default 10 until measured otherwise.
- **Unhandled promise rejections** crash the process. Fastify catches route
  errors automatically; background work needs explicit `.catch()`.
- **DO Spaces eventual consistency**: don't read-after-write on the same object
  immediately. Return the URL after upload; let the client fetch it normally.
- **Migrations on deploy**: always run *before* reloading PM2. Otherwise a new
  Node process hits an old schema.

## When in doubt

1. Match the pattern of an existing route.
2. Service has business logic. Route is just plumbing.
3. Validate aggressively. Trust nothing from the client.
4. Don't add a new dependency unless it earns its memory.
