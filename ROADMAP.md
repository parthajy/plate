# ROADMAP.md — PLATE

Phased build order. Each phase ends in something demonstrable. **Don't build
phase 3 stuff while phase 1 is still broken.**

The goal is a TestFlight + Play Store internal-testing build at the end of
phase 3 (~6–8 weeks of focused work).

---

## Phase 0 — Foundations (week 1)

Boring but critical. Skip this and you'll regret it in week 6.

- [ ] Monorepo set up: `/mobile`, `/backend`, `/shared` (Zod schemas)
- [ ] TypeScript strict mode everywhere
- [ ] ESLint + Prettier configured, pre-commit hook via `lefthook`
- [ ] Mobile: Expo app boots, Expo Router with a placeholder home screen
- [ ] Backend: Fastify boots, `/health` returns 200
- [ ] Postgres running locally via Docker for dev, schema migration tool wired
- [ ] DO droplet provisioned, Caddy serving HTTPS, deploy-on-push working
- [ ] `.env.example` files complete, secrets in 1Password / similar
- [ ] Sentry wired to both mobile and backend (low-priority noise OK)
- [ ] CLAUDE.md / DESIGN.md / ARCHITECTURE.md in place
- [ ] Apple Developer + Google Play Developer accounts active

**Exit criteria:** push a backend change to main, see it deployed in <2min.
Launch the mobile app, see "Hello PLATE" on the device.

---

## Phase 1 — Tracking that works (weeks 2–3)

The minimum that lets a real human use this as a calorie tracker, even
without the AI bells and whistles.

### Auth

- [ ] Email/password signup + login
- [ ] JWT issuance + refresh
- [ ] Tokens stored in `expo-secure-store`
- [ ] Auth guard around all `/v1/*` routes except `/auth/*` and `/health`
- [ ] "Forgot password" — defer to phase 4, ship without it

### Onboarding

- [ ] 5–6 screen onboarding flow: 1. Welcome → sign up 2. Sex, birthdate 3. Height, weight 4. Activities (multi-select chips: gym, run, cycle, swim, sports, yoga) 5. Goal (lose / maintain / gain / recomp) + rate 6. Calculated targets (display, allow override)
- [ ] Mifflin-St Jeor BMR formula + activity multiplier → calorie target
- [ ] Macro split: 1.6g/kg protein default, 25–30% fat, remainder carbs
- [ ] Persist to `profiles` table

### Today screen

- [ ] Calorie ring (SVG, animated)
- [ ] Macro bars (P/C/F) below
- [ ] Meal log list, grouped by meal type
- [ ] Pull to refresh
- [ ] Date scrubber to view past days

### Food logging (manual)

- [ ] Food search (local DB → USDA fallback)
- [ ] Seed local DB with the top ~5k USDA common foods
- [ ] Quick log: pick food, enter grams or pick a serving, choose meal, save
- [ ] Recently used + favorites
- [ ] Edit / delete a log entry
- [ ] Custom food: user creates a new entry with manual macros

**Exit criteria:** a human logs all their meals for a day on real hardware
without you nearby. They get the right totals.

---

## Phase 2 — The AI moments (weeks 4–5)

This is the wedge. Phase 1 is table stakes; phase 2 is why someone switches
from MyFitnessPal.

### Food scan

- [ ] Camera screen with live preview
- [ ] Capture button + capture-on-stability auto-shoot
- [ ] Client-side image compress (max 1024px, 0.6 quality JPEG)
- [ ] POST to `/v1/food/scan`
- [ ] Backend: store to DO Spaces, call Claude Vision with structured output
- [ ] Return food name, portion estimate, macros, confidence
- [ ] Bottom sheet on result screen, user can adjust, then "Log it"
- [ ] Cache by image hash (sha256) for 24h
- [ ] Track per-user daily scan count
- [ ] Failure UX: low confidence → suggest manual entry, don't hide it

### Coach (Kai)

- [ ] Coach tab with chat UI
- [ ] Persona prompt in `backend/src/services/ai/prompts/coach.ts`
- [ ] Context builder: profile + goals + today's totals + last 7d workouts + last ~20 messages
- [ ] POST message → assistant reply (non-streaming v1; SSE in phase 4)
- [ ] Suggestion chips (returned in `metadata` from backend) — tap to send
- [ ] First-run: Kai sends a welcome message that references the user's actual goal
- [ ] Daily proactive nudge — Kai messages you at ~4pm if protein is <50% of target

### Connections

- [ ] AI calls happen via a shared `services/ai.ts` module
- [ ] Per-user daily AI budget enforcement (e.g. 50 scans + 100 coach turns)
- [ ] Logged AI usage in `usage_events` for cost tracking

**Exit criteria:** the same human from phase 1 logs a meal by scanning it,
asks Kai a real question, and gets a useful answer that references their
own data ("you've already had 80g protein today, you need ~60 more").

---

## Phase 3 — Pantry, workouts, polish (weeks 6–8)

Round out the product so it feels complete on launch.

### Pantry → Recipe

- [ ] Pantry screen: ingredient chips, add/remove
- [ ] Quick-add common ingredients (chicken, rice, eggs, etc.)
- [ ] Generate recipe button → POST `/v1/recipes/generate`
- [ ] Filters: cook time (<15/<30/<60), high protein, low carb, vegetarian
- [ ] Recipe card with steps, macros, time
- [ ] "Cook this" → step-by-step cooking mode (just a paginator over steps)
- [ ] "Log as meal" → pre-fills food log with calculated macros

### Workouts

- [ ] Workouts tab: list, filters, totals
- [ ] Quick log: type, duration, notes (90% of users will use this)
- [ ] Detailed log (optional): gym → sets/reps; run → distance/pace
- [ ] Apple Health import (`expo-health`) on iOS
- [ ] Google Fit import on Android (or skip and rely on manual + Strava later)
- [ ] Calorie estimate from MET tables, conservative
- [ ] Workouts contribute to "calories out" on Today screen (toggleable)

### You / Settings

- [ ] Profile editing
- [ ] Goal editing (re-runs calculation)
- [ ] Units (metric / imperial)
- [ ] Theme (system / dark / light)
- [ ] Notifications toggle
- [ ] Sign out, delete account (required by App Store)

### Polish

- [ ] All loading states use skeletons, no raw spinners
- [ ] Empty states designed for every screen
- [ ] Onboarding-skip path for re-installs
- [ ] App icon, splash screen, store screenshots
- [ ] Privacy policy + terms (use Termly or hand-write; required by stores)
- [ ] App Store metadata: title, subtitle, description, keywords

**Exit criteria:** ship to TestFlight + Play Internal Testing. Get 10 real
users on it. Watch them, fix what they hit.

---

## Phase 4 — After launch (post week 8)

Things explicitly **not** in MVP, but worth planning for:

- Streaming coach responses (SSE) — feels much faster
- Coach proactive notifications (push)
- Barcode scanning (`expo-barcode-scanner` → Open Food Facts API, free)
- Strava integration (OAuth, webhook subscriptions)
- Weight + body measurement trend chart
- Photo progress log
- Sharing / accountability (a friend can see your week)
- Meal templates (save a meal you eat often, log it in 1 tap)
- Restaurant + chain menu data
- Forgot password flow + email verification
- Web companion (read-only, basic dashboard)
- Apple Watch complication (calorie ring at a glance)
- Premium tier ($12/mo unlocks unlimited scans + coach, free tier capped)

---

## What we're explicitly NOT building

These are good ideas. They're not ours. Saying no to them is how we ship.

- ❌ **Macro coaching for triathletes/marathoners** — TrainingPeaks territory
- ❌ **Heart rate / VO2max analysis** — Whoop, Garmin
- ❌ **Sleep tracking** — Apple Health does it; we just pull totals if useful
- ❌ **Meditation / mindfulness** — Calm, Headspace
- ❌ **Social feed** — every app builds this, no one uses it
- ❌ **Coach voice notes / video** — text only, faster, cheaper, better
- ❌ **Web app at launch** — mobile first, mobile only initially
- ❌ **Gamification (streaks, badges, XP)** — patronizing, doesn't move retention
  in the segment we care about. Reconsider only if data says otherwise.

---

## Decisions parked for later

Things we'll need to choose eventually. Not now.

- **Monetization.** Free with limits + $12/mo premium is the strong default,
  but validate with 50 users first. Pricing experiment after 1k installs.
- **Push notification provider.** Expo's free push service is fine to start.
  Move to OneSignal or similar at scale.
- **Email.** We need transactional email (welcome, password reset, receipts).
  Resend or Postmark — pick when needed.
- **Analytics.** PostHog (self-hostable, generous free tier) is the strong
  default. Wire it up at the start of phase 3.
