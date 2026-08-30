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
    CREATE SEQUENCE IF NOT EXISTS patient_hn_seq START WITH 1 INCREMENT BY 1;
    ALTER SEQUENCE IF EXISTS patient_hn_seq RESTART WITH 1;
  `);
}
