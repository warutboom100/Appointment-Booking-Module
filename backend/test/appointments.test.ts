import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/knex/db';
import { clearAllTables } from './helpers';

describe('Appointments Module Integration Tests (Phase 4 Core Booking)', () => {
  let departmentId: string;
  let doctorId: string;
  let patientId: string;
  let apptTypeId30Min: string;
  let futureMondayDate: string; // A Monday in the future (e.g. 2028-06-05)
  const defaultDevUserId = '00000000-0000-0000-0000-000000000000';

  beforeAll(async () => {
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await clearAllTables();

    // 0. Create default dev user for Foreign Key satisfaction
    await db('users').insert({
      id: defaultDevUserId,
      username: 'dev-staff',
      password_hash: 'dummyhash',
      name: 'Dev Staff',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 1. Create Department
    const [dept] = await db('departments')
      .insert({
        name: 'Internal Medicine',
        location: 'Building B, Floor 2',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    departmentId = dept.id;

    // 2. Create Doctor
    const [doc] = await db('doctors')
      .insert({
        first_name: 'Arthit',
        last_name: 'Suriyawong',
        department_id: departmentId,
        license_no: 'DOC-ART-01',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    doctorId = doc.id;

    // 3. Create Patient
    const [pat] = await db('patients')
      .insert({
        hn: 'HN-000001',
        first_name: 'Manee',
        last_name: 'Jaidee',
        date_of_birth: '1995-05-12',
        gender: 'female',
        phone: '0812345678',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    patientId = pat.id;

    // 4. Create Appointment Types
    const [type30] = await db('appointment_types')
      .insert({
        name: 'General Examination',
        duration_minutes: 30,
        color: '#4CAF50',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    apptTypeId30Min = type30.id;

    await db('appointment_types')
      .insert({
        name: 'Quick Follow-up',
        duration_minutes: 15,
        color: '#2196F3',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

    // 5. Create Doctor Schedule (Every Monday: day_of_week = 1, 09:00 - 12:00, break 10:30 - 11:00)
    await db('doctor_schedules').insert({
      doctor_id: doctorId,
      day_of_week: 1, // Monday
      start_time: '09:00',
      end_time: '12:00',
      break_start: '10:30',
      break_end: '11:00',
      is_available: true,
      max_appointments: 10,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 2028-06-05 is a Monday
    futureMondayDate = '2028-06-05';
  });

  afterAll(async () => {
    await clearAllTables();
    await db.destroy();
  });

  describe('Authentication & RBAC', () => {
    it('should reject unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/appointments');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow receptionist to book appointment but forbid doctor', async () => {
      // Receptionist books
      const recepRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(recepRes.status).toBe(201);
      expect(recepRes.body.data.status).toBe('booked');

      // Doctor tries to book -> 403 Forbidden
      const docRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:30',
        });

      expect(docRes.status).toBe(403);
      expect(docRes.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow doctor to update status to in_progress and completed', async () => {
      const bookRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(bookRes.status).toBe(201);
      const apptId = bookRes.body.data.id;

      // Receptionist confirms and checks in
      await request(app)
        .patch(`/api/v1/appointments/${apptId}/status`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({ status: 'confirmed' });

      await request(app)
        .patch(`/api/v1/appointments/${apptId}/status`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({ status: 'checked_in' });

      // Doctor starts examination
      const inProgRes = await request(app)
        .patch(`/api/v1/appointments/${apptId}/status`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor')
        .send({ status: 'in_progress' });

      expect(inProgRes.status).toBe(200);
      expect(inProgRes.body.data.status).toBe('in_progress');

      // Doctor completes examination
      const compRes = await request(app)
        .patch(`/api/v1/appointments/${apptId}/status`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor')
        .send({ status: 'completed' });

      expect(compRes.status).toBe(200);
      expect(compRes.body.data.status).toBe('completed');
    });
  });

  describe('GET /api/v1/appointments/available-slots', () => {
    it('should calculate available slots stepping by duration and excluding break time (10:30 - 11:00)', async () => {
      // 30 min duration on 09:00 - 12:00 with break 10:30 - 11:00
      // Candidates: 09:00-09:30, 09:30-10:00, 10:00-10:30, 10:30-11:00 (overlaps break -> excluded), 11:00-11:30, 11:30-12:00
      // Expected slots: 5 slots
      const res = await request(app)
        .get(
          `/api/v1/appointments/available-slots?doctor_id=${doctorId}&date=${futureMondayDate}&appointment_type_id=${apptTypeId30Min}`,
        )
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.doctor_id).toBe(doctorId);
      expect(res.body.data.duration_minutes).toBe(30);
      expect(res.body.data.slots).toHaveLength(5);
      expect(res.body.data.slots.map((s: { start_time: string }) => s.start_time)).toEqual([
        '09:00',
        '09:30',
        '10:00',
        '11:00',
        '11:30',
      ]);
    });

    it('should exclude slots that are already booked', async () => {
      // Book 09:00 - 09:30
      const bookRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(bookRes.status).toBe(201);

      const res = await request(app)
        .get(
          `/api/v1/appointments/available-slots?doctor_id=${doctorId}&date=${futureMondayDate}&appointment_type_id=${apptTypeId30Min}`,
        )
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.slots).toHaveLength(4);
      expect(res.body.data.slots.map((s: { start_time: string }) => s.start_time)).toEqual([
        '09:30',
        '10:00',
        '11:00',
        '11:30',
      ]);
    });

    it('should return 0 slots when doctor is OFF via schedule_overrides', async () => {
      // Create override: Doctor is OFF on that Monday
      await db('schedule_overrides').insert({
        doctor_id: doctorId,
        override_date: futureMondayDate,
        is_available: false,
        reason: 'Medical Conference',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app)
        .get(
          `/api/v1/appointments/available-slots?doctor_id=${doctorId}&date=${futureMondayDate}&appointment_type_id=${apptTypeId30Min}`,
        )
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.slots).toHaveLength(0);
    });

    it('should use custom working hours when doctor has special schedule override', async () => {
      // Create override: Special afternoon clinic 13:00 - 15:00
      await db('schedule_overrides').insert({
        doctor_id: doctorId,
        override_date: futureMondayDate,
        is_available: true,
        start_time: '13:00',
        end_time: '15:00',
        reason: 'Afternoon Extra Session',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app)
        .get(
          `/api/v1/appointments/available-slots?doctor_id=${doctorId}&date=${futureMondayDate}&appointment_type_id=${apptTypeId30Min}`,
        )
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.slots).toHaveLength(4); // 13:00, 13:30, 14:00, 14:30
      expect(res.body.data.slots[0].start_time).toBe('13:00');
    });
  });

  describe('POST /api/v1/appointments (11-Step Validation Pipeline)', () => {
    it('Rule 1: should reject appointment date in past with PAST_DATE (400)', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: '2020-01-01',
          start_time: '09:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PAST_DATE');
    });

    it('Rule 3: should reject booking when doctor has no schedule on that day with NO_SCHEDULE (400)', async () => {
      // 2028-06-06 is a Tuesday (doctor only has Monday schedule)
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: '2028-06-06',
          start_time: '09:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('NO_SCHEDULE');
    });

    it('Rule 4: should reject booking when doctor is off via override with SCHEDULE_UNAVAILABLE (400)', async () => {
      await db('schedule_overrides').insert({
        doctor_id: doctorId,
        override_date: futureMondayDate,
        is_available: false,
        reason: 'On Vacation',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SCHEDULE_UNAVAILABLE');
    });

    it('Rule 5: should reject booking outside working hours with OUTSIDE_WORKING_HOURS (400)', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '14:00', // Doctor working hours are 09:00 - 12:00
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OUTSIDE_WORKING_HOURS');
    });

    it('Rule 6: should reject booking during break time with DURING_BREAK (400)', async () => {
      // Break is 10:30 - 11:00
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '10:30',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DURING_BREAK');
    });

    it('Rule 7: should reject overlapping appointment with SLOT_TAKEN (409 Conflict)', async () => {
      // Book 09:00 - 09:30
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      // Attempt to book 09:00 - 09:30 again
      const conflictRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.error.code).toBe('SLOT_TAKEN');
    });

    it('Rule 8: should reject booking with inactive doctor with DOCTOR_INACTIVE (400)', async () => {
      await db('doctors').where({ id: doctorId }).update({ is_active: false });

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DOCTOR_INACTIVE');
    });

    it('Rule 9: should reject booking with inactive patient with PATIENT_INACTIVE (400)', async () => {
      await db('patients').where({ id: patientId }).update({ is_active: false });

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PATIENT_INACTIVE');
    });

    it('Rule 10: should reject booking with inactive appointment type with TYPE_INACTIVE (400)', async () => {
      await db('appointment_types').where({ id: apptTypeId30Min }).update({ is_active: false });

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TYPE_INACTIVE');
    });

    it('Rule 11: should reject booking when max_appointments limit is reached with MAX_APPOINTMENTS_REACHED (409)', async () => {
      // Set max_appointments = 1
      await db('doctor_schedules')
        .where({ doctor_id: doctorId, day_of_week: 1 })
        .update({ max_appointments: 1 });

      // Book 1st slot: 09:00 - 09:30
      const firstRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(firstRes.status).toBe(201);

      // Attempt 2nd slot: 09:30 - 10:00
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:30',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('MAX_APPOINTMENTS_REACHED');
    });

    it('Happy path: should successfully create appointment and return joined relations', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:30',
          reason_for_visit: 'Severe fever and cough',
          notes: 'VIP Patient',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('booked');
      expect(res.body.data.start_time).toContain('09:30');
      expect(res.body.data.end_time).toContain('10:00');
      expect(res.body.data.patient_name).toBe('Manee Jaidee');
      expect(res.body.data.doctor_name).toBe('Arthit Suriyawong');
      expect(res.body.data.department_name).toBe('Internal Medicine');
      expect(res.body.data.appointment_type_name).toBe('General Examination');
    });

    it('Concurrency control (FOR UPDATE): should handle simultaneous bookings and prevent double booking race conditions', async () => {
      // 2 simultaneous clients trying to book the exact same slot: Monday 09:00
      const [resA, resB] = await Promise.all([
        request(app)
          .post('/api/v1/appointments')
          .set('Authorization', 'ApiKey testapi')
          .set('X-Role', 'receptionist')
          .send({
            patient_id: patientId,
            doctor_id: doctorId,
            appointment_type_id: apptTypeId30Min,
            appointment_date: futureMondayDate,
            start_time: '09:00',
          }),
        request(app)
          .post('/api/v1/appointments')
          .set('Authorization', 'ApiKey testapi')
          .set('X-Role', 'receptionist')
          .send({
            patient_id: patientId,
            doctor_id: doctorId,
            appointment_type_id: apptTypeId30Min,
            appointment_date: futureMondayDate,
            start_time: '09:00',
          }),
      ]);

      const statuses = [resA.status, resB.status].sort();
      expect(statuses).toEqual([201, 409]);

      // Exactly 1 booking row must exist in the database
      const count = await db('appointments')
        .where({ doctor_id: doctorId, appointment_date: futureMondayDate, start_time: '09:00' })
        .count<{ count: string | number }>('id as count')
        .first();

      expect(Number(count?.count)).toBe(1);
    });
  });

  describe('PATCH /api/v1/appointments/:id/cancel (Cancellation)', () => {
    it('should cancel booked appointment with mandatory reason and free slot', async () => {
      const createRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(createRes.status).toBe(201);
      const apptId = createRes.body.data.id;

      const cancelRes = await request(app)
        .patch(`/api/v1/appointments/${apptId}/cancel`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          cancellation_reason: 'Patient called to cancel due to business trip',
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('cancelled');
      expect(cancelRes.body.data.cancellation_reason).toBe(
        'Patient called to cancel due to business trip',
      );

      // Verify that 09:00 slot is freed and can now be booked by another patient!
      const rebookRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(rebookRes.status).toBe(201);
      expect(rebookRes.body.data.status).toBe('booked');
    });

    it('should reject cancelling appointment without reason with 400 VALIDATION_ERROR', async () => {
      const createRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(createRes.status).toBe(201);
      const apptId = createRes.body.data.id;

      const cancelRes = await request(app)
        .patch(`/api/v1/appointments/${apptId}/cancel`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({});

      expect(cancelRes.status).toBe(400);
    });
  });

  describe('POST /api/v1/appointments/:id/reschedule (Rescheduling)', () => {
    it('should reschedule appointment, mark original as rescheduled, and link new appointment', async () => {
      const createRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      expect(createRes.status).toBe(201);
      const originalId = createRes.body.data.id;

      // Reschedule to 11:00 on the same day
      const reschedRes = await request(app)
        .post(`/api/v1/appointments/${originalId}/reschedule`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          appointment_date: futureMondayDate,
          start_time: '11:00',
        });

      expect(reschedRes.status).toBe(200);
      expect(reschedRes.body.data.status).toBe('booked');
      expect(reschedRes.body.data.start_time).toContain('11:00');
      expect(reschedRes.body.data.rescheduled_from_id).toBe(originalId);

      // Verify original is marked as 'rescheduled'
      const originalCheck = await request(app)
        .get(`/api/v1/appointments/${originalId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(originalCheck.status).toBe(200);
      expect(originalCheck.body.data.status).toBe('rescheduled');

      // Verify old 09:00 slot is freed!
      const slotCheckRes = await request(app)
        .get(
          `/api/v1/appointments/available-slots?doctor_id=${doctorId}&date=${futureMondayDate}&appointment_type_id=${apptTypeId30Min}`,
        )
        .set('Authorization', 'ApiKey testapi');

      expect(slotCheckRes.body.data.slots.some((s: { start_time: string }) => s.start_time === '09:00')).toBe(true);
    });
  });

  describe('GET /api/v1/appointments & GET /api/v1/patients/:id/appointments (List & Search)', () => {
    beforeEach(async () => {
      // Book 2 appointments
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:00',
        });

      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_type_id: apptTypeId30Min,
          appointment_date: futureMondayDate,
          start_time: '09:30',
        });
    });

    it('should list all appointments with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/appointments')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should filter appointments by doctor_id and date', async () => {
      const res = await request(app)
        .get(`/api/v1/appointments?doctor_id=${doctorId}&date=${futureMondayDate}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('should search appointments by patient HN', async () => {
      const res = await request(app)
        .get('/api/v1/appointments?search=HN-000001')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('should get patient appointment history via GET /api/v1/patients/:id/appointments', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientId}/appointments`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].patient_id).toBe(patientId);
    });
  });
});
