import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/knex/db';
import { clearAllTables } from './helpers';

describe('Patient Module Integration Tests', () => {
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
      const res = await request(app).get('/api/v1/patients');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow receptionist to create and update patients', async () => {
      // Receptionist creates patient
      const createRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'Somporn',
          last_name: 'Kaewkla',
          date_of_birth: '1985-03-15',
          gender: 'female',
          phone: '0812345678',
        });

      expect(createRes.status).toBe(201);
      const patientId = createRes.body.data.id;

      // Receptionist updates patient
      const updateRes = await request(app)
        .patch(`/api/v1/patients/${patientId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          phone: '0899998888',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.phone).toBe('0899998888');
    });

    it('should forbid doctor from creating new patient', async () => {
      const createRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor')
        .send({
          first_name: 'Somporn',
          last_name: 'Kaewkla',
          date_of_birth: '1985-03-15',
          gender: 'female',
          phone: '0812345678',
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/v1/patients (Create & Auto-HN)', () => {
    it('should automatically generate sequential HN numbers (HN-000001, HN-000002)', async () => {
      const p1Res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'First',
          last_name: 'Patient',
          date_of_birth: '1990-01-01',
          gender: 'male',
          phone: '0811111111',
        });

      expect(p1Res.status).toBe(201);
      expect(p1Res.body.data.hn).toBe('HN-000001');

      const p2Res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'Second',
          last_name: 'Patient',
          date_of_birth: '1992-02-02',
          gender: 'female',
          phone: '0822222222',
        });

      expect(p2Res.status).toBe(201);
      expect(p2Res.body.data.hn).toBe('HN-000002');
    });

    it('should create patient with full profile (allergies, blood_type, id_card_no)', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'Narisa',
          last_name: 'Wongsawat',
          date_of_birth: '1992-07-22',
          gender: 'female',
          phone: '0898765432',
          email: 'narisa@example.com',
          id_card_no: '1100223344556',
          address: '123 Sukhumvit Rd, Bangkok',
          blood_type: 'O+',
          allergies: 'Penicillin, Aspirin',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.first_name).toBe('Narisa');
      expect(res.body.data.blood_type).toBe('O+');
      expect(res.body.data.allergies).toBe('Penicillin, Aspirin');
      expect(res.body.data.id_card_no).toBe('1100223344556');
    });

    it('should reject duplicate id_card_no with 409 DUPLICATE', async () => {
      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'First',
          last_name: 'Person',
          date_of_birth: '1980-01-01',
          gender: 'male',
          phone: '0811111111',
          id_card_no: '1234567890123',
        });

      const duplicateRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'Second',
          last_name: 'Person',
          date_of_birth: '1982-02-02',
          gender: 'female',
          phone: '0822222222',
          id_card_no: '1234567890123',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('DUPLICATE');
    });

    it('should reject invalid gender or invalid date with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'Test',
          last_name: 'Invalid',
          date_of_birth: 'invalid-date',
          gender: 'unknown_gender',
          phone: '0812345678',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/patients (List & Search & Filter)', () => {
    beforeEach(async () => {
      await db('patients').insert([
        {
          hn: 'HN-000001',
          first_name: 'Somporn',
          last_name: 'Kaewkla',
          date_of_birth: '1985-03-15',
          gender: 'male',
          phone: '081-234-5678',
          is_active: true,
          created_at: new Date('2026-01-01'),
          updated_at: new Date('2026-01-01'),
        },
        {
          hn: 'HN-000002',
          first_name: 'Narisa',
          last_name: 'Wongsawat',
          date_of_birth: '1992-07-22',
          gender: 'female',
          phone: '089-876-5432',
          is_active: true,
          created_at: new Date('2026-01-02'),
          updated_at: new Date('2026-01-02'),
        },
        {
          hn: 'HN-000003',
          first_name: 'Prasit',
          last_name: 'Charoensuk',
          date_of_birth: '1978-11-08',
          gender: 'male',
          phone: '062-345-6789',
          is_active: false,
          created_at: new Date('2026-01-03'),
          updated_at: new Date('2026-01-03'),
        },
      ]);
    });

    it('should list all patients with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/patients?page=1&limit=2')
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

    it('should search patients by HN', async () => {
      const res = await request(app)
        .get('/api/v1/patients?search=HN-000002')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].first_name).toBe('Narisa');
    });

    it('should search patients by Name', async () => {
      const res = await request(app)
        .get('/api/v1/patients?search=Charoensuk')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].first_name).toBe('Prasit');
    });

    it('should filter patients by gender and active status', async () => {
      const res = await request(app)
        .get('/api/v1/patients?gender=male&is_active=true')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].first_name).toBe('Somporn');
    });
  });

  describe('GET /api/v1/patients/:id', () => {
    it('should return patient by ID', async () => {
      const createRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'Wichai',
          last_name: 'Meechai',
          date_of_birth: '1975-05-20',
          gender: 'male',
          phone: '0855555555',
        });

      const patientId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(patientId);
      expect(res.body.data.first_name).toBe('Wichai');
    });

    it('should return 404 for non-existent patient ID', async () => {
      const res = await request(app)
        .get('/api/v1/patients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/patients/:id (Update)', () => {
    it('should update patient contact details and allergies', async () => {
      const createRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'Piti',
          last_name: 'Jaingam',
          date_of_birth: '1995-10-10',
          gender: 'male',
          phone: '0844444444',
        });

      const patientId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/v1/patients/${patientId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          phone: '0877777777',
          address: '456 Rama 9 Rd, Bangkok',
          allergies: 'Sulfa drugs',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.phone).toBe('0877777777');
      expect(updateRes.body.data.address).toBe('456 Rama 9 Rd, Bangkok');
      expect(updateRes.body.data.allergies).toBe('Sulfa drugs');
    });

    it('should reject updating to an existing id_card_no', async () => {
      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'User',
          last_name: 'A',
          date_of_birth: '1980-01-01',
          gender: 'male',
          phone: '0811111111',
          id_card_no: '9999999999999',
        });

      const userBRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'User',
          last_name: 'B',
          date_of_birth: '1982-02-02',
          gender: 'female',
          phone: '0822222222',
          id_card_no: '8888888888888',
        });

      const res = await request(app)
        .patch(`/api/v1/patients/${userBRes.body.data.id}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          id_card_no: '9999999999999',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE');
    });
  });

  describe('DELETE /api/v1/patients/:id (Soft Delete)', () => {
    it('should soft-delete patient setting is_active to false', async () => {
      const createRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Delete',
          last_name: 'Patient',
          date_of_birth: '1999-12-31',
          gender: 'other',
          phone: '0800000000',
        });

      const patientId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/patients/${patientId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin');

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.is_active).toBe(false);

      const getRes = await request(app)
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.is_active).toBe(false);
    });
  });
});
