import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/knex/db';
import { clearAllTables } from './helpers';

describe('Doctor Module Integration Tests', () => {
  let cardiologyId: string;
  let pediatricsId: string;
  let inactiveDeptId: string;

  beforeAll(async () => {
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await clearAllTables();

    // Create test departments
    const [cardio] = await db('departments')
      .insert({
        name: 'Cardiology',
        location: 'Building A, Floor 2',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    cardiologyId = cardio.id;

    const [pedia] = await db('departments')
      .insert({
        name: 'Pediatrics',
        location: 'Building A, Floor 3',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    pediatricsId = pedia.id;

    const [inactive] = await db('departments')
      .insert({
        name: 'Closed Clinic',
        location: 'Building Z',
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    inactiveDeptId = inactive.id;
  });

  afterAll(async () => {
    await clearAllTables();
    await db.destroy();
  });

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/doctors');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow receptionist to view doctors list but forbid creating', async () => {
      const listRes = await request(app)
        .get('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist');

      expect(listRes.status).toBe(200);

      const createRes = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'receptionist')
        .send({
          first_name: 'Somchai',
          last_name: 'Jaidee',
          department_id: cardiologyId,
          license_no: 'MD-11111',
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid doctor from deleting doctor entity', async () => {
      const createRes = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Doctor',
          last_name: 'One',
          department_id: cardiologyId,
          license_no: 'MD-22222',
        });

      const doctorId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/doctors/${doctorId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor');

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/v1/doctors (Create)', () => {
    it('should create a doctor successfully with valid active department', async () => {
      const res = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Natthapong',
          last_name: 'Srisuk',
          department_id: cardiologyId,
          license_no: 'TH-23456',
          specialization: 'Interventional Cardiology',
          phone: '0812345678',
          email: 'natthapong@hospital.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.first_name).toBe('Natthapong');
      expect(res.body.data.last_name).toBe('Srisuk');
      expect(res.body.data.department_id).toBe(cardiologyId);
      expect(res.body.data.license_no).toBe('TH-23456');
      expect(res.body.data.is_active).toBe(true);
    });

    it('should reject creating doctor with non-existent department', async () => {
      const res = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          department_id: '00000000-0000-0000-0000-000000000000',
          license_no: 'TH-99999',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject creating doctor in inactive department', async () => {
      const res = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          department_id: inactiveDeptId,
          license_no: 'TH-88888',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate license_no with 409 DUPLICATE', async () => {
      await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Doctor',
          last_name: 'Alpha',
          department_id: cardiologyId,
          license_no: 'TH-SAME-LICENSE',
        });

      const duplicateRes = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Doctor',
          last_name: 'Beta',
          department_id: pediatricsId,
          license_no: 'TH-SAME-LICENSE',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('DUPLICATE');
    });

    it('should link user_id and reject if user_id is already linked to another doctor', async () => {
      // Create user
      const [user] = await db('users')
        .insert({
          username: 'doctor_link',
          password_hash: 'hashed',
          name: 'Doctor Link',
          role: 'doctor',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      const firstDoctorRes = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Doc',
          last_name: 'First',
          department_id: cardiologyId,
          license_no: 'TH-LINK-1',
          user_id: user.id,
        });

      expect(firstDoctorRes.status).toBe(201);
      expect(firstDoctorRes.body.data.user_id).toBe(user.id);

      const secondDoctorRes = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Doc',
          last_name: 'Second',
          department_id: pediatricsId,
          license_no: 'TH-LINK-2',
          user_id: user.id,
        });

      expect(secondDoctorRes.status).toBe(409);
      expect(secondDoctorRes.body.error.code).toBe('DUPLICATE');
    });
  });

  describe('GET /api/v1/doctors (List & Search & Filter)', () => {
    beforeEach(async () => {
      await db('doctors').insert([
        {
          first_name: 'Somchai',
          last_name: 'Jaidee',
          department_id: cardiologyId,
          license_no: 'DOC-001',
          specialization: 'Cardiology Specialist',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          first_name: 'Wipawan',
          last_name: 'Thongsuk',
          department_id: pediatricsId,
          license_no: 'DOC-002',
          specialization: 'Pediatric Care',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          first_name: 'Retired',
          last_name: 'Doctor',
          department_id: cardiologyId,
          license_no: 'DOC-003',
          specialization: 'General',
          is_active: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    });

    it('should list all doctors with joined department details and pagination', async () => {
      const res = await request(app)
        .get('/api/v1/doctors?page=1&limit=2')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('department_name');
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('should filter doctors by department_id', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors?department_id=${pediatricsId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].first_name).toBe('Wipawan');
      expect(res.body.data[0].department_name).toBe('Pediatrics');
    });

    it('should filter doctors by search query', async () => {
      const res = await request(app)
        .get('/api/v1/doctors?search=Thongsuk')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].first_name).toBe('Wipawan');
    });

    it('should filter doctors by is_active status', async () => {
      const res = await request(app)
        .get('/api/v1/doctors?is_active=true')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((d: { is_active: boolean }) => d.is_active)).toBe(true);
    });
  });

  describe('GET /api/v1/doctors/:id', () => {
    it('should return doctor with department details by ID', async () => {
      const createRes = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Anan',
          last_name: 'Sombat',
          department_id: cardiologyId,
          license_no: 'DOC-ANAN',
        });

      const doctorId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/doctors/${doctorId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(doctorId);
      expect(res.body.data.first_name).toBe('Anan');
      expect(res.body.data.department_name).toBe('Cardiology');
      expect(res.body.data.department_location).toBe('Building A, Floor 2');
    });

    it('should return 404 NOT_FOUND for non-existent doctor ID', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/doctors/:id (Update)', () => {
    it('should update doctor specialization, department and phone successfully', async () => {
      const createRes = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Kitti',
          last_name: 'Chai',
          department_id: cardiologyId,
          license_no: 'DOC-KITTI',
          phone: '0811111111',
        });

      const doctorId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/v1/doctors/${doctorId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          department_id: pediatricsId,
          specialization: 'Pediatric Cardiology',
          phone: '0899999999',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.department_id).toBe(pediatricsId);
      expect(updateRes.body.data.specialization).toBe('Pediatric Cardiology');
      expect(updateRes.body.data.phone).toBe('0899999999');
    });

    it('should reject updating license_no to an existing license_no', async () => {
      await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Doc',
          last_name: 'A',
          department_id: cardiologyId,
          license_no: 'DOC-UNIQUE-1',
        });

      const docBRes = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Doc',
          last_name: 'B',
          department_id: cardiologyId,
          license_no: 'DOC-UNIQUE-2',
        });

      const res = await request(app)
        .patch(`/api/v1/doctors/${docBRes.body.data.id}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          license_no: 'DOC-UNIQUE-1',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE');
    });
  });

  describe('DELETE /api/v1/doctors/:id (Soft Delete)', () => {
    it('should soft-delete doctor setting is_active to false', async () => {
      const createRes = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin')
        .send({
          first_name: 'Delete',
          last_name: 'Me',
          department_id: cardiologyId,
          license_no: 'DOC-DEL',
        });

      const doctorId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/doctors/${doctorId}`)
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin');

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.is_active).toBe(false);

      const getRes = await request(app)
        .get(`/api/v1/doctors/${doctorId}`)
        .set('Authorization', 'ApiKey testapi');

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.is_active).toBe(false);
    });
  });
});
