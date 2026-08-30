import { db } from '../src/knex/db';

export async function clearAllTables(): Promise<void> {
  await db.raw(`
    TRUNCATE TABLE 
      appointments, 
      schedule_overrides, 
      doctor_schedules, 
      doctors, 
      patients, 
      appointment_types, 
      departments, 
      refresh_tokens, 
      users 
    CASCADE;
  `);
}
