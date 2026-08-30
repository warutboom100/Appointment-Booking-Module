import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('appointments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('patient_id').notNullable().references('id').inTable('patients').onDelete('RESTRICT');
    table.uuid('doctor_id').notNullable().references('id').inTable('doctors').onDelete('RESTRICT');
    table.uuid('department_id').notNullable().references('id').inTable('departments').onDelete('RESTRICT');
    table
      .uuid('appointment_type_id')
      .notNullable()
      .references('id')
      .inTable('appointment_types')
      .onDelete('RESTRICT');
    table.date('appointment_date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.string('status', 20).notNullable().defaultTo('booked');
    table.text('reason_for_visit').nullable();
    table.text('notes').nullable();
    table
      .uuid('created_by_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table
      .uuid('cancelled_by_user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.text('cancellation_reason').nullable();
    table.timestamp('cancelled_at', { useTz: true }).nullable();
    table
      .uuid('rescheduled_from_id')
      .nullable()
      .references('id')
      .inTable('appointments')
      .onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable();

    table.check('end_time > start_time', [], 'chk_appointments_time_range');
    table.check(
      "status IN ('booked', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')",
      [],
      'chk_appointments_status'
    );

    table.index(['doctor_id', 'appointment_date', 'start_time'], 'idx_appointments_doctor_slot');
    table.index(['patient_id', 'appointment_date'], 'idx_appointments_patient_history');
    table.index(['department_id', 'appointment_date'], 'idx_appointments_department_date');
    table.index(['appointment_date', 'status'], 'idx_appointments_date_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('appointments');
}
