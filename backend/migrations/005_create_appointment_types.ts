import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('appointment_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable().unique();
    table.integer('duration_minutes').notNullable();
    table.text('description').nullable();
    table.string('color', 7).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable();

    table.check('duration_minutes > 0', [], 'chk_appointment_types_duration');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('appointment_types');
}
