import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, queryClient } from './client.js';

async function main(): Promise<void> {
  // Ensure pgcrypto is available for gen_random_uuid()
  await queryClient`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await migrate(db, { migrationsFolder: './drizzle' });
  await queryClient.end();
  console.warn('Migrations complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
