import { sql } from 'drizzle-orm';
import { db, queryClient } from './client.js';
import { foods } from './schema.js';
import { SEED_FOODS } from './seed-foods.js';

async function main(): Promise<void> {
  console.warn(`Seeding ${SEED_FOODS.length} common foods…`);

  // Idempotent: skip rows where (source, name) already exists.
  for (const f of SEED_FOODS) {
    await db
      .insert(foods)
      .values({
        source: 'system',
        name: f.name,
        ...(f.brand ? { brand: f.brand } : {}),
        servingG: f.servingG.toString(),
        kcalPer100g: f.kcalPer100g.toString(),
        proteinPer100g: f.proteinPer100g.toString(),
        carbsPer100g: f.carbsPer100g.toString(),
        fatPer100g: f.fatPer100g.toString(),
        ...(f.fiberPer100g !== undefined ? { fiberPer100g: f.fiberPer100g.toString() } : {}),
      })
      .onConflictDoNothing();
  }

  const count = await db.execute(sql`SELECT COUNT(*)::int AS n FROM foods`);
  const row = (count as unknown as { n: number }[])[0];
  console.warn(`Done. foods table now has ${row?.n ?? '?'} rows.`);

  await queryClient.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
