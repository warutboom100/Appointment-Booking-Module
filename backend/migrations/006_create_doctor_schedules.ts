import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('doctor_schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('doctor_id').notNullable().references('id').inTable('doctors').onDelete('CASCADE');
    table.smallint('day_of_week').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.time('break_start').nullable();
    table.time('break_end').nullable();
    table.boolean('is_available').notNullable().defaultTo(true);
    table.integer('max_appointments').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable();

    table.unique(['doctor_id', 'day_of_week', 'start_time'], {
      indexName: 'uq_doctor_schedules_block',
    });
    table.index(['doctor_id', 'day_of_week'], 'idx_doctor_schedules_lookup');

    table.check('day_of_week >= 0 AND day_of_week <= 6', [], 'chk_schedules_day_of_week');
    table.check('end_time > start_time', [], 'chk_schedules_working_hours');
    table.check(
      '(break_start IS NULL AND break_end IS NULL) OR (break_start IS NOT NULL AND break_end IS NOT NULL AND break_end > break_start)',
      [],
      'chk_schedules_break_hours'
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('doctor_schedules');
}
