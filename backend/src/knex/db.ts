import knex, { type Knex } from 'knex';
import { env } from '../config/env';

const config: Knex.Config = {
  client: 'pg',
  connection:
    env.NODE_ENV === 'test'
      ? (process.env.TEST_DATABASE_URL ?? env.DATABASE_URL)
      : env.DATABASE_URL,
  migrations: { directory: './migrations', extension: 'ts', loadExtensions: ['.ts'] },
  seeds: { directory: './seeds', extension: 'ts', loadExtensions: ['.ts'] },
  pool: {
    afterCreate: (conn: { query: (sql: string, cb: (err: Error | null) => void) => void }, done: (err: Error | null, conn: unknown) => void) =>
      conn.query("SET timezone='Asia/Bangkok'", (err) => done(err, conn)),
  },
};

export const db = knex(config);
