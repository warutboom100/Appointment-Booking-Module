import { beforeAll, afterAll } from 'vitest';
import { db } from '../src/knex/db';

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});
