import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/knex/db';
import { clearAllTables } from './helpers';

describe('Department Module Integration Tests', () => {
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
      const res = await request(app).get('/api/v1/departments');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow receptionist to view departments but forbid creating', async () => {
      // Allow viewing
      const listRes = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist');

      expect(listRes.status).toBe(200);

      // Forbid creating
      const createRes = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          name: 'Pediatrics',
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid doctor from updating or deleting department', async () => {
      // Create a dept as admin
      const createRes = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Cardiology',
          location: 'Building A',
        });

      const deptId = createRes.body.data.id;

      // Doctor tries to update
      const updateRes = await request(app)
        .patch(`/api/v1/departments/${deptId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor')
        .send({
          name: 'Cardiology Center',
        });

      expect(updateRes.status).toBe(403);

      // Doctor tries to delete
      const deleteRes = await request(app)
        .delete(`/api/v1/departments/${deptId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor');

      expect(deleteRes.status).toBe(403);
    });
  });

  describe('POST /api/v1/departments (Create)', () => {
    it('should create a new department when requested by Admin', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Orthopedics',
          description: 'Bone and joint clinic',
          location: 'Building B, Floor 2',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Orthopedics');
      expect(res.body.data.description).toBe('Bone and joint clinic');
      expect(res.body.data.location).toBe('Building B, Floor 2');
      expect(res.body.data.is_active).toBe(true);
    });

    it('should reject duplicate department name with 409 DUPLICATE', async () => {
      await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Cardiology',
        });

      const duplicateRes = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'cardiology', // Case insensitive check
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('DUPLICATE');
    });

    it('should reject invalid input with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: '', // empty name
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/departments (List & Search)', () => {
    beforeEach(async () => {
      await db('departments').insert([
        {
          name: 'General Medicine',
          location: 'Building A, Floor 1',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Cardiology',
          location: 'Building A, Floor 2',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Old Radiology',
          location: 'Building C, Floor 1',
          is_active: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    });

    it('should list all departments with pagination meta', async () => {
      const res = await request(app)
        .get('/api/v1/departments?page=1&limit=2')
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

    it('should filter departments by search keyword', async () => {
      const res = await request(app)
        .get('/api/v1/departments?search=Cardio')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Cardiology');
    });

    it('should filter departments by active status', async () => {
      const res = await request(app)
        .get('/api/v1/departments?is_active=true')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((d: { is_active: boolean }) => d.is_active)).toBe(true);
    });
  });

  describe('GET /api/v1/departments/:id', () => {
    it('should return department by ID', async () => {
      const createRes = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Dermatology',
          location: 'Building D',
        });

      const deptId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/departments/${deptId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(deptId);
      expect(res.body.data.name).toBe('Dermatology');
    });

    it('should return 404 NOT_FOUND for non-existent UUID', async () => {
      const res = await request(app)
        .get('/api/v1/departments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR for invalid UUID param', async () => {
      const res = await request(app)
        .get('/api/v1/departments/invalid-id')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/v1/departments/:id (Update)', () => {
    it('should update department fields successfully', async () => {
      const createRes = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Dental',
          location: 'Old Wing',
        });

      const deptId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/v1/departments/${deptId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Dental Clinic Center',
          location: 'New Wing, Floor 3',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Dental Clinic Center');
      expect(updateRes.body.data.location).toBe('New Wing, Floor 3');
    });

    it('should reject updating to an already existing name', async () => {
      await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({ name: 'Emergency' });

      const dept2Res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({ name: 'ICU' });

      const res = await request(app)
        .patch(`/api/v1/departments/${dept2Res.body.data.id}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({ name: 'Emergency' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE');
    });
  });

  describe('DELETE /api/v1/departments/:id (Soft Delete)', () => {
    it('should soft-delete department and set is_active to false', async () => {
      const createRes = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          name: 'Neurology',
        });

      const deptId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/departments/${deptId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin');

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.is_active).toBe(false);

      // Verify still exists in DB as inactive
      const getRes = await request(app)
        .get(`/api/v1/departments/${deptId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.is_active).toBe(false);
    });
  });
});
