import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/knex/db';
import { clearAllTables } from './helpers';

describe('Doctor Schedules Module Integration Tests', () => {
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
        name: 'General Medicine',
        location: 'Building A, Floor 1',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    departmentId = dept.id;

    // Create Doctor A
    const [docA] = await db('doctors')
      .insert({
        first_name: 'Somchai',
        last_name: 'Jaidee',
        department_id: departmentId,
        license_no: 'DOC-SOMCHAI',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    doctorAId = docA.id;

    // Create Doctor B
    const [docB] = await db('doctors')
      .insert({
        first_name: 'Wipawan',
        last_name: 'Thongsuk',
        department_id: departmentId,
        license_no: 'DOC-WIPAWAN',
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
      const res = await request(app).get(`/api/v1/doctors/${doctorAId}/schedules`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow receptionist to view doctor schedules but forbid creating', async () => {
      const listRes = await request(app)
        .get(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist');

      expect(listRes.status).toBe(200);

      const createRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '12:00',
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid doctor from modifying schedules directly', async () => {
      const createRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '12:00',
        });

      const scheduleId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/schedules/${scheduleId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor');

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/v1/doctors/:doctorId/schedules (Create & Overlap Detection)', () => {
    it('should create a valid morning schedule and an adjacent afternoon schedule on the same day', async () => {
      // Morning block 09:00 - 12:00 on Monday
      const morningRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '12:00',
          break_start: '10:30',
          break_end: '10:45',
          max_appointments: 10,
        });

      expect(morningRes.status).toBe(201);
      expect(morningRes.body.data.day_of_week).toBe(1);
      expect(morningRes.body.data.start_time).toContain('09:00');
      expect(morningRes.body.data.end_time).toContain('12:00');

      // Afternoon block 13:00 - 16:00 on Monday (Adjacent / non-overlapping)
      const afternoonRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 1,
          start_time: '13:00',
          end_time: '16:00',
        });

      expect(afternoonRes.status).toBe(201);
    });

    it('should REJECT overlapping schedule on the same day with 409 CONFLICT', async () => {
      // Existing block 09:00 - 12:00 on Monday
      await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '12:00',
        });

      // Attempt overlap: 10:00 - 14:00 (overlaps with 09:00 - 12:00)
      const overlapRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 1,
          start_time: '10:00',
          end_time: '14:00',
        });

      expect(overlapRes.status).toBe(409);
      expect(overlapRes.body.error.code).toBe('CONFLICT');
      expect(overlapRes.body.error.message).toContain('ทับซ้อน');
    });

    it('should allow the same time slot on a DIFFERENT day or for a DIFFERENT doctor', async () => {
      // Doctor A on Monday 09:00 - 12:00
      await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '12:00',
        });

      // Doctor A on Tuesday 09:00 - 12:00 (Different day)
      const diffDayRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 2,
          start_time: '09:00',
          end_time: '12:00',
        });

      expect(diffDayRes.status).toBe(201);

      // Doctor B on Monday 09:00 - 12:00 (Different doctor)
      const diffDocRes = await request(app)
        .post(`/api/v1/doctors/${doctorBId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '12:00',
        });

      expect(diffDocRes.status).toBe(201);
    });

    it('should reject invalid time range (end_time <= start_time) with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 3,
          start_time: '15:00',
          end_time: '10:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject break time outside working hours with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 3,
          start_time: '09:00',
          end_time: '12:00',
          break_start: '12:30', // outside working hours
          break_end: '13:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/doctors/:doctorId/schedules', () => {
    beforeEach(async () => {
      await db('doctor_schedules').insert([
        {
          doctor_id: doctorAId,
          day_of_week: 1,
          start_time: '09:00',
          end_time: '12:00',
          is_available: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          doctor_id: doctorAId,
          day_of_week: 1,
          start_time: '13:00',
          end_time: '16:00',
          is_available: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          doctor_id: doctorAId,
          day_of_week: 3,
          start_time: '09:00',
          end_time: '12:00',
          is_available: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    });

    it('should list doctor schedules sorted by day_of_week and start_time', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].day_of_week).toBe(1);
      expect(res.body.data[0].start_time).toContain('09:00');
    });

    it('should filter schedules by day_of_week', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/${doctorAId}/schedules?day_of_week=3`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].day_of_week).toBe(3);
    });
  });

  describe('PATCH /api/v1/schedules/:id (Update & Overlap Check)', () => {
    it('should update schedule details and prevent overlapping with another block', async () => {
      // Create block 1: 09:00 - 12:00 on Monday
      await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '12:00',
        });

      // Create block 2: 14:00 - 17:00 on Monday
      const block2Res = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 1,
          start_time: '14:00',
          end_time: '17:00',
        });

      const block2Id = block2Res.body.data.id;

      // Update block 2 to 13:00 - 16:00 (Valid, no overlap)
      const validUpdate = await request(app)
        .patch(`/api/v1/schedules/${block2Id}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          start_time: '13:00',
          end_time: '16:00',
        });

      expect(validUpdate.status).toBe(200);
      expect(validUpdate.body.data.start_time).toContain('13:00');

      // Attempt updating block 2 to 11:00 - 15:00 (Overlaps with block 1 09:00 - 12:00)
      const invalidUpdate = await request(app)
        .patch(`/api/v1/schedules/${block2Id}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          start_time: '11:00',
          end_time: '15:00',
        });

      expect(invalidUpdate.status).toBe(409);
      expect(invalidUpdate.body.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/v1/schedules/:id', () => {
    it('should delete schedule block', async () => {
      const createRes = await request(app)
        .post(`/api/v1/doctors/${doctorAId}/schedules`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          day_of_week: 5,
          start_time: '09:00',
          end_time: '12:00',
        });

      const scheduleId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/schedules/${scheduleId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin');

      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/v1/schedules/${scheduleId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(getRes.status).toBe(404);
    });
  });
});
