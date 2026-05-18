import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  uuid,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// gen_random_uuid() comes from the pgcrypto extension. The first migration
// must `CREATE EXTENSION IF NOT EXISTS pgcrypto;` before any table is created.

export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  appleSub: text('apple_sub').unique(),
  googleSub: text('google_sub').unique(),
  displayName: text('display_name'),

  // RevenueCat-synced subscription state. `status` is the source of truth
  // for `isPremium` (active = entitled). `expires_at` lets us catch silent
  // expiries between webhook deliveries. `product_id` and `store` are
  // diagnostic — knowing which product/marketplace someone bought from
  // helps support & analytics without an extra round-trip to RC.
  subscriptionStatus: text('subscription_status').notNull().default('free'),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
  subscriptionProductId: text('subscription_product_id'),
  subscriptionStore: text('subscription_store'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable('profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  sex: text('sex'),
  birthdate: date('birthdate'),
  heightCm: integer('height_cm'),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
  activities: text('activities').array(),
  goal: text('goal'),
  goalRateKgWk: numeric('goal_rate_kg_wk', { precision: 3, scale: 2 }),
  dailyKcal: integer('daily_kcal'),
  dailyProteinG: integer('daily_protein_g'),
  dailyCarbsG: integer('daily_carbs_g'),
  dailyFatG: integer('daily_fat_g'),
  units: text('units').notNull().default('metric'),
  timezone: text('timezone'),
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
});

export const foods = pgTable(
  'foods',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    source: text('source').notNull(),
    sourceRef: text('source_ref'),
    name: text('name').notNull(),
    brand: text('brand'),
    servingG: numeric('serving_g', { precision: 7, scale: 2 }),
    kcalPer100g: numeric('kcal_per_100g', { precision: 6, scale: 2 }),
    proteinPer100g: numeric('protein_per_100g', { precision: 5, scale: 2 }),
    carbsPer100g: numeric('carbs_per_100g', { precision: 5, scale: 2 }),
    fatPer100g: numeric('fat_per_100g', { precision: 5, scale: 2 }),
    fiberPer100g: numeric('fiber_per_100g', { precision: 5, scale: 2 }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: index('idx_foods_name').on(t.name),
  }),
);

export const foodLogs = pgTable(
  'food_logs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id').references(() => foods.id, { onDelete: 'set null' }),
    customName: text('custom_name'),
    grams: numeric('grams', { precision: 7, scale: 2 }).notNull(),
    kcal: numeric('kcal', { precision: 6, scale: 2 }).notNull(),
    proteinG: numeric('protein_g', { precision: 5, scale: 2 }).notNull(),
    carbsG: numeric('carbs_g', { precision: 5, scale: 2 }).notNull(),
    fatG: numeric('fat_g', { precision: 5, scale: 2 }).notNull(),
    mealType: text('meal_type'),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull(),
    source: text('source').notNull(),
    scanImageUrl: text('scan_image_url'),
    scanConfidence: numeric('scan_confidence', { precision: 3, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userDateIdx: index('idx_foodlogs_user_date').on(t.userId, t.loggedAt),
  }),
);

export const workouts = pgTable(
  'workouts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    durationMin: integer('duration_min'),
    kcalBurned: integer('kcal_burned'),
    distanceKm: numeric('distance_km', { precision: 6, scale: 2 }),
    notes: text('notes'),
    detail: jsonb('detail'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    source: text('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userDateIdx: index('idx_workouts_user_date').on(t.userId, t.startedAt),
  }),
);

export const pantryItems = pgTable(
  'pantry_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ingredient: text('ingredient').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIngredientUnique: unique('uniq_pantry_user_ingredient').on(t.userId, t.ingredient),
  }),
);

export const coachMessages = pgTable(
  'coach_messages',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userTimeIdx: index('idx_msgs_user_time').on(t.userId, t.createdAt),
  }),
);

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  deviceLabel: text('device_label'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Per-(user|ip, action) token buckets. Cheaper than Redis at our scale.
export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    key: text('key').notNull(), // e.g. 'user:<uuid>:food.scan' or 'ip:1.2.3.4:auth.login'
    action: text('action').notNull(),
    tokens: numeric('tokens', { precision: 10, scale: 4 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    keyActionUnique: unique('uniq_ratelimit_key_action').on(t.key, t.action),
  }),
);

// One-time login codes for the OTP / Resend flow. We store a sha256 of the
// 6-digit code rather than the code itself; verification compares hashes.
// Multiple unconsumed rows per email are fine — verify() picks the most
// recent unexpired one.
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text('email').notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index('idx_otp_email_created').on(t.email, t.createdAt),
  }),
);

// Food-scan result cache, keyed by sha256 of the uploaded image. Lets repeat
// scans of the same photo skip the storage upload + Vision call. 24h TTL is
// enforced at the query level (no scheduled cleanup yet — table stays small
// because hashes are unique per image).
export const scanCache = pgTable('scan_cache', {
  sha256: text('sha256').primaryKey(),
  imageUrl: text('image_url').notNull(),
  result: jsonb('result').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Per-call AI cost tracking. Used for per-user daily budgets + future billing.
export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // 'coach', 'scan', 'recipe', ...
    model: text('model').notNull(),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    estCostUsd: numeric('est_cost_usd', { precision: 8, scale: 4 }).notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userTimeIdx: index('idx_usage_user_time').on(t.userId, t.createdAt),
  }),
);
