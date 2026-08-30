import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/knex/db';
import { clearAllTables } from './helpers';

describe('Appointment Types Module Integration Tests', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await clearAllTables();
  });

  afterAll(async () => {
    await clearAllTables();
    await db.destroy();
  });

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/appointment-types');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow receptionist to view types but forbid creating', async () => {
      const listRes = await request(app)
        .get('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist');

      expect(listRes.status).toBe(200);

      const createRes = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          name: 'Consultation',
          duration_minutes: 20,
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid doctor from deleting appointment type', async () => {
      const createRes = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Follow-up Visit',
          duration_minutes: 15,
        });

      const typeId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/appointment-types/${typeId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor');

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/v1/appointment-types (Create)', () => {
    it('should create a new appointment type successfully as Admin', async () => {
      const res = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'New Patient Visit',
          duration_minutes: 30,
          description: 'First-time patient examination',
          color: '#4CAF50',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('New Patient Visit');
      expect(res.body.data.duration_minutes).toBe(30);
      expect(res.body.data.color).toBe('#4CAF50');
      expect(res.body.data.is_active).toBe(true);
    });

    it('should reject duplicate appointment type name with 409 DUPLICATE', async () => {
      await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Procedure',
          duration_minutes: 45,
        });

      const duplicateRes = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'procedure', // Case-insensitive duplicate check
          duration_minutes: 60,
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('DUPLICATE');
    });

    it('should reject duration <= 0 or invalid hex color with 400 VALIDATION_ERROR', async () => {
      const res1 = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Zero Minutes',
          duration_minutes: 0,
        });

      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('VALIDATION_ERROR');

      const res2 = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Bad Color',
          duration_minutes: 15,
          color: 'red', // Not a hex code
        });

      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/appointment-types (List & Search & Filter)', () => {
    beforeEach(async () => {
      await db('appointment_types').insert([
        {
          name: 'Follow-up Visit',
          duration_minutes: 15,
          color: '#2196F3',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Consultation',
          duration_minutes: 20,
          color: '#FF9800',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Old Vaccine Type',
          duration_minutes: 10,
          color: '#9E9E9E',
          is_active: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    });

    it('should list all appointment types sorted with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/appointment-types?page=1&limit=2')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('should search appointment types by name', async () => {
      const res = await request(app)
        .get('/api/v1/appointment-types?search=Consult')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Consultation');
    });

    it('should filter appointment types by active status', async () => {
      const res = await request(app)
        .get('/api/v1/appointment-types?is_active=true')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((t: { is_active: boolean }) => t.is_active)).toBe(true);
    });
  });

  describe('GET /api/v1/appointment-types/:id', () => {
    it('should return appointment type by ID', async () => {
      const createRes = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Specialist Session',
          duration_minutes: 40,
        });

      const typeId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/appointment-types/${typeId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(typeId);
      expect(res.body.data.name).toBe('Specialist Session');
    });

    it('should return 404 for non-existent appointment type ID', async () => {
      const res = await request(app)
        .get('/api/v1/appointment-types/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/appointment-types/:id (Update)', () => {
    it('should update appointment type duration and color successfully', async () => {
      const createRes = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Quick Check',
          duration_minutes: 10,
          color: '#112233',
        });

      const typeId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/v1/appointment-types/${typeId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          duration_minutes: 15,
          color: '#445566',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.duration_minutes).toBe(15);
      expect(updateRes.body.data.color).toBe('#445566');
    });

    it('should reject updating to duplicate name with 409 DUPLICATE', async () => {
      await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({ name: 'Type A', duration_minutes: 20 });

      const typeBRes = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({ name: 'Type B', duration_minutes: 30 });

      const res = await request(app)
        .patch(`/api/v1/appointment-types/${typeBRes.body.data.id}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({ name: 'Type A' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE');
    });
  });

  describe('DELETE /api/v1/appointment-types/:id (Soft Delete)', () => {
    it('should soft-delete appointment type setting is_active to false', async () => {
      const createRes = await request(app)
        .post('/api/v1/appointment-types')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Deprecated Type',
          duration_minutes: 25,
        });

      const typeId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/appointment-types/${typeId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin');

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.is_active).toBe(false);

      const getRes = await request(app)
        .get(`/api/v1/appointment-types/${typeId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.is_active).toBe(false);
    });
  });
});
