import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/knex/db';
import { clearAllTables } from './helpers';

describe('Schedule Overrides Module Integration Tests', () => {
  let doctorAId: string;
  let doctorBId: string;
  let departmentId: string;

  beforeAll(async () => {
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await clearAllTables();

    // Create department
    const [dept] = await db('departments')
      .insert({
        name: 'Surgery Department',
        location: 'Building S, Floor 3',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    departmentId = dept.id;

    // Create Doctor A
    const [docA] = await db('doctors')
      .insert({
        first_name: 'Prasert',
        last_name: 'Maneewan',
        department_id: departmentId,
        license_no: 'DOC-PRA-01',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    doctorAId = docA.id;

    // Create Doctor B
    const [docB] = await db('doctors')
      .insert({
        first_name: 'Kanya',
        last_name: 'Suksamran',
        department_id: departmentId,
        license_no: 'DOC-KAN-02',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    doctorBId = docB.id;
  });

  afterAll(async () => {
    await clearAllTables();
    await db.destroy();
  });

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get(`/api/v1/doctors/${doctorAId}/overrides`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow receptionist to view overrides but forbid creating', async () => {
      const listRes = await request(app)
        .get(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist');

      expect(listRes.status).toBe(200);

      const createRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          override_date: '2026-09-15',
          is_available: false,
          reason: 'Medical Conference',
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid doctor from deleting overrides directly', async () => {
      const createRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-09-20',
          is_available: false,
          reason: 'Doctor on leave',
        });

      const overrideId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/overrides/${overrideId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor');

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/v1/doctors/:doctorId/overrides (Create & Validation)', () => {
    it('should create doctor OFF override (is_available = false) without times', async () => {
      const res = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-09-15',
          is_available: false,
          reason: 'Annual Vacation Leave',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.override_date).toContain('2026-09-15');
      expect(res.body.data.is_available).toBe(false);
      expect(res.body.data.reason).toBe('Annual Vacation Leave');
      expect(res.body.data.start_time).toBeNull();
    });

    it('should create special working hours override (is_available = true) with times', async () => {
      const res = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-09-16',
          is_available: true,
          start_time: '13:00',
          end_time: '18:00',
          break_start: '15:00',
          break_end: '15:30',
          reason: 'Special Afternoon Clinic',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.is_available).toBe(true);
      expect(res.body.data.start_time).toContain('13:00');
      expect(res.body.data.end_time).toContain('18:00');
    });

    it('should reject is_available = true when start/end times are missing with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-09-17',
          is_available: true,
          reason: 'Missing times',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate override on the same date for the same doctor with 409 DUPLICATE', async () => {
      await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-09-25',
          is_available: false,
          reason: 'Holiday',
        });

      const duplicateRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-09-25',
          is_available: true,
          start_time: '09:00',
          end_time: '12:00',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('DUPLICATE');
    });

    it('should allow the same date override for a DIFFERENT doctor', async () => {
      await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-10-01',
          is_available: false,
        });

      const diffDocRes = await request(app)
        .post(`/api/v1/doctors/${doctorBId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-10-01',
          is_available: false,
        });

      expect(diffDocRes.status).toBe(201);
    });
  });

  describe('GET /api/v1/doctors/:doctorId/overrides (List & Date Filter)', () => {
    beforeEach(async () => {
      await db('schedule_overrides').insert([
        {
          doctor_id: doctorAId,
          override_date: '2026-09-01',
          is_available: false,
          reason: 'Conference A',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          doctor_id: doctorAId,
          override_date: '2026-09-15',
          is_available: true,
          start_time: '08:00',
          end_time: '12:00',
          reason: 'Morning Special',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          doctor_id: doctorAId,
          override_date: '2026-10-05',
          is_available: false,
          reason: 'Vacation in Oct',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    });

    it('should list all overrides for doctor ordered by date', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].override_date).toContain('2026-09-01');
    });

    it('should filter overrides by date range (from_date, to_date)', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/${doctorAId}/overrides?from_date=2026-09-01&to_date=2026-09-30`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('PATCH /api/v1/overrides/:id (Update)', () => {
    it('should update override reason and availability successfully', async () => {
      const createRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-11-10',
          is_available: false,
          reason: 'Initial reason',
        });

      const overrideId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/v1/overrides/${overrideId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          is_available: true,
          start_time: '10:00',
          end_time: '14:00',
          reason: 'Changed to special clinic',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.is_available).toBe(true);
      expect(updateRes.body.data.reason).toBe('Changed to special clinic');
      expect(updateRes.body.data.start_time).toContain('10:00');
    });
  });

  describe('DELETE /api/v1/overrides/:id', () => {
    it('should delete override record successfully', async () => {
      const createRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/overrides`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          override_date: '2026-12-25',
          is_available: false,
          reason: 'Christmas Holiday',
        });

      const overrideId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/overrides/${overrideId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin');

      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/v1/overrides/${overrideId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(getRes.status).toBe(404);
    });
  });
});
