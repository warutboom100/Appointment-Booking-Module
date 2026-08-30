import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/knex/db';
import { clearAllTables } from './helpers';

describe('Dashboard & Analytics Module Integration Tests (Phase 5)', () => {
  let deptCardioId: string;
  let deptMedicineId: string;
  let doc1Id: string;
  let doc2Id: string;
  let pat1Id: string;
  let pat2Id: string;
  let apptTypeGeneralId: string;
  let apptTypeProcedureId: string;
  const testDate = '2028-06-05'; // Monday
  const defaultUserId = '00000000-0000-0000-0000-000000000000';

  beforeAll(async () => {
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await clearAllTables();

    // 0. Create default user
    await db('users').insert({
      id: defaultUserId,
      username: 'dev-staff',
      password_hash: 'dummyhash',
      name: 'Dev Staff',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 1. Create Departments
    const [dept1] = await db('departments')
      .insert({
        name: 'Internal Medicine',
        location: 'Building B, Floor 2',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    deptMedicineId = dept1.id;

    const [dept2] = await db('departments')
      .insert({
        name: 'Cardiology',
        location: 'Building A, Floor 3',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    deptCardioId = dept2.id;

    // 2. Create Doctors
    const [doc1] = await db('doctors')
      .insert({
        first_name: 'Arthit',
        last_name: 'Suriyawong',
        department_id: deptMedicineId,
        license_no: 'DOC-ART-01',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    doc1Id = doc1.id;

    const [doc2] = await db('doctors')
      .insert({
        first_name: 'Kanya',
        last_name: 'Phetcharat',
        department_id: deptCardioId,
        license_no: 'DOC-KAN-02',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    doc2Id = doc2.id;

    // 3. Create Patients
    const [pat1] = await db('patients')
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
    pat1Id = pat1.id;

    const [pat2] = await db('patients')
      .insert({
        hn: 'HN-000002',
        first_name: 'Sombat',
        last_name: 'Permpoon',
        date_of_birth: '1988-10-20',
        gender: 'male',
        phone: '0899887766',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    pat2Id = pat2.id;

    // 4. Create Appointment Types
    const [type1] = await db('appointment_types')
      .insert({
        name: 'General Examination',
        duration_minutes: 30,
        color: '#4CAF50',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    apptTypeGeneralId = type1.id;

    const [type2] = await db('appointment_types')
      .insert({
        name: 'Heart Ultrasound',
        duration_minutes: 45,
        color: '#E91E63',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    apptTypeProcedureId = type2.id;

    // 5. Schedules (Both doctors work on Monday, day_of_week = 1)
    await db('doctor_schedules').insert([
      {
        doctor_id: doc1Id,
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '16:00',
        break_start: '12:00',
        break_end: '13:00',
        is_available: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        doctor_id: doc2Id,
        day_of_week: 1, // Monday
        start_time: '08:30',
        end_time: '15:30',
        break_start: '12:00',
        break_end: '13:00',
        is_available: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 6. Insert Appointments with various statuses on testDate (2028-06-05)
    await db('appointments').insert([
      {
        patient_id: pat1Id,
        doctor_id: doc1Id,
        department_id: deptMedicineId,
        appointment_type_id: apptTypeGeneralId,
        appointment_date: testDate,
        start_time: '09:00',
        end_time: '09:30',
        status: 'booked',
        created_by_user_id: defaultUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        patient_id: pat2Id,
        doctor_id: doc1Id,
        department_id: deptMedicineId,
        appointment_type_id: apptTypeGeneralId,
        appointment_date: testDate,
        start_time: '09:30',
        end_time: '10:00',
        status: 'confirmed',
        created_by_user_id: defaultUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        patient_id: pat1Id,
        doctor_id: doc1Id,
        department_id: deptMedicineId,
        appointment_type_id: apptTypeGeneralId,
        appointment_date: testDate,
        start_time: '10:00',
        end_time: '10:30',
        status: 'checked_in',
        created_by_user_id: defaultUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        patient_id: pat2Id,
        doctor_id: doc2Id,
        department_id: deptCardioId,
        appointment_type_id: apptTypeProcedureId,
        appointment_date: testDate,
        start_time: '10:00',
        end_time: '10:45',
        status: 'in_progress',
        created_by_user_id: defaultUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        patient_id: pat1Id,
        doctor_id: doc2Id,
        department_id: deptCardioId,
        appointment_type_id: apptTypeProcedureId,
        appointment_date: testDate,
        start_time: '11:00',
        end_time: '11:45',
        status: 'completed',
        created_by_user_id: defaultUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        patient_id: pat2Id,
        doctor_id: doc1Id,
        department_id: deptMedicineId,
        appointment_type_id: apptTypeGeneralId,
        appointment_date: testDate,
        start_time: '14:00',
        end_time: '14:30',
        status: 'cancelled',
        cancellation_reason: 'Patient unwell',
        created_by_user_id: defaultUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  });

  afterAll(async () => {
    await clearAllTables();
    await db.destroy();
  });

  describe('GET /api/v1/dashboard/summary', () => {
    it('should reject unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/dashboard/summary');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should calculate today dashboard summary with correct status breakdown and queue', async () => {
      const res = await request(app)
        .get(`/api/v1/dashboard/summary?date=${testDate}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.date).toBe(testDate);
      expect(res.body.data.total_appointments).toBe(6);
      expect(res.body.data.status_breakdown).toEqual({
        booked: 1,
        confirmed: 1,
        checked_in: 1,
        in_progress: 1,
        completed: 1,
        cancelled: 1,
        no_show: 0,
        rescheduled: 0,
      });
      expect(res.body.data.doctors_on_duty_count).toBe(2);
      expect(res.body.data.today_queue).toHaveLength(6);
      expect(res.body.data.today_queue[0].patient_name).toBe('Manee Jaidee');
      expect(res.body.data.today_queue[0].start_time).toBe('09:00');
    });

    it('should filter summary by department_id', async () => {
      const res = await request(app)
        .get(`/api/v1/dashboard/summary?date=${testDate}&department_id=${deptCardioId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.total_appointments).toBe(2);
      expect(res.body.data.status_breakdown.in_progress).toBe(1);
      expect(res.body.data.status_breakdown.completed).toBe(1);
      expect(res.body.data.doctors_on_duty_count).toBe(1);
      expect(res.body.data.today_queue).toHaveLength(2);
    });

    it('should filter summary by doctor_id', async () => {
      const res = await request(app)
        .get(`/api/v1/dashboard/summary?date=${testDate}&doctor_id=${doc1Id}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.total_appointments).toBe(4);
      expect(res.body.data.doctors_on_duty_count).toBe(1);
    });

    it('should adjust doctor on duty count when doctor has OFF override', async () => {
      // Create override: Doctor 2 is OFF
      await db('schedule_overrides').insert({
        doctor_id: doc2Id,
        override_date: testDate,
        is_available: false,
        reason: 'Emergency Leave',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app)
        .get(`/api/v1/dashboard/summary?date=${testDate}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.doctors_on_duty_count).toBe(1); // Only Doc 1 is active on duty
    });
  });

  describe('GET /api/v1/dashboard/stats', () => {
    it('should calculate date range statistics, completion rate, and breakdowns', async () => {
      const res = await request(app)
        .get(`/api/v1/dashboard/stats?from_date=${testDate}&to_date=${testDate}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.total_appointments).toBe(6);
      expect(res.body.data.completed_count).toBe(1);
      expect(res.body.data.cancelled_count).toBe(1);
      expect(res.body.data.completion_rate).toBeCloseTo(16.7, 1);
      expect(res.body.data.cancellation_rate).toBeCloseTo(16.7, 1);
      expect(res.body.data.daily_trend).toHaveLength(1);
      expect(res.body.data.daily_trend[0].date).toBe(testDate);
      expect(res.body.data.department_breakdown).toHaveLength(2);
      expect(res.body.data.top_appointment_types).toHaveLength(2);
    });
  });
});
