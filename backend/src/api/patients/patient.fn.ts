import type { Knex } from 'knex';
import { db } from '../../knex/db';

export async function generateNextHn(trx?: Knex.Transaction): Promise<string> {
  const query = trx ? trx('patients') : db('patients');

  const latest = await query
    .whereRaw("hn ~ '^HN-[0-9]+$'")
    .orderByRaw('CAST(SUBSTRING(hn FROM 4) AS INTEGER) DESC')
    .first();

  if (!latest) {
    return 'HN-000001';
  }

  const numericPart = parseInt(latest.hn.replace('HN-', ''), 10);
  const nextNum = isNaN(numericPart) ? 1 : numericPart + 1;
  return `HN-${String(nextNum).padStart(6, '0')}`;
}
