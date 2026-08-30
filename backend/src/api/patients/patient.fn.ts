import type { Knex } from 'knex';
import { db } from '../../knex/db';

export async function generateNextHn(trx?: Knex | Knex.Transaction): Promise<string> {
  const runner = trx || db;
  await runner.raw('CREATE SEQUENCE IF NOT EXISTS patient_hn_seq START WITH 1 INCREMENT BY 1');
  const result = await runner.raw<{ rows: Array<{ next_val: string | number }> }>(
    "SELECT nextval('patient_hn_seq') as next_val",
  );
  const nextNum = parseInt(String(result.rows[0].next_val), 10);
  return `HN-${String(nextNum).padStart(6, '0')}`;
}
