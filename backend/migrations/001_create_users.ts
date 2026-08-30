import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('username', 50).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 100).notNullable();
    table.string('role', 20).notNullable().defaultTo('receptionist');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable();

    table.check("role IN ('admin', 'doctor', 'receptionist')", [], 'chk_users_role');
  });

  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable();

    table.index(['token_hash'], 'idx_refresh_tokens_hash');
    table.index(['user_id'], 'idx_refresh_tokens_user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
}
