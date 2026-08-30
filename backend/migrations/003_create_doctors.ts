import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('doctors', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable().unique().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('department_id').notNullable().references('id').inTable('departments').onDelete('RESTRICT');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('specialization', 200).nullable();
    table.string('license_no', 50).notNullable().unique();
    table.string('phone', 20).nullable();
    table.string('email', 100).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable();

    table.index(['department_id'], 'idx_doctors_department_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('doctors');
}
