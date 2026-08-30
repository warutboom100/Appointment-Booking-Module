import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('patients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('hn', 20).notNullable().unique();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.date('date_of_birth').notNullable();
    table.string('gender', 10).notNullable();
    table.string('phone', 20).notNullable();
    table.string('email', 100).nullable();
    table.string('id_card_no', 20).nullable().unique();
    table.text('address').nullable();
    table.string('blood_type', 5).nullable();
    table.text('allergies').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable();

    table.check("gender IN ('male', 'female', 'other')", [], 'chk_patients_gender');
    table.index(['phone'], 'idx_patients_phone');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('patients');
}
