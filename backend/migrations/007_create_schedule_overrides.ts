import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('schedule_overrides', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('doctor_id').notNullable().references('id').inTable('doctors').onDelete('CASCADE');
    table.date('override_date').notNullable();
    table.boolean('is_available').notNullable();
    table.time('start_time').nullable();
    table.time('end_time').nullable();
    table.time('break_start').nullable();
    table.time('break_end').nullable();
    table.string('reason', 200).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable();

    table.unique(['doctor_id', 'override_date'], {
      indexName: 'uq_schedule_overrides_date',
    });
    table.index(['doctor_id', 'override_date'], 'idx_schedule_overrides_lookup');

    table.check(
      'is_available = false OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)',
      [],
      'chk_overrides_working_hours'
    );
    table.check(
      '(break_start IS NULL AND break_end IS NULL) OR (break_start IS NOT NULL AND break_end IS NOT NULL AND break_end > break_start)',
      [],
      'chk_overrides_break_hours'
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('schedule_overrides');
}
