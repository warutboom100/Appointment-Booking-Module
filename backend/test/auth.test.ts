import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { app } from '../src/app';
import { db } from '../src/knex/db';
import { authenticate } from '../src/middleware/authenticate';
import { authorize } from '../src/middleware/authorize';
import { errorHandler } from '../src/middleware/error-handler';
import { ok } from '../src/config/response';
import { clearAllTables } from './helpers';

describe('Auth Module Integration Tests', () => {
  let rbacApp: express.Express;

  beforeAll(async () => {
    await db.migrate.latest();

    // Create a sub-app to test authenticate + authorize middleware directly with errorHandler
    rbacApp = express();
    rbacApp.use(express.json());

    rbacApp.get(
      '/admin-only',
      authenticate,
      authorize('admin'),
      (_req, res) => {
        ok(res, { message: 'admin access granted' });
      },
    );

    rbacApp.get(
      '/staff-only',
      authenticate,
      authorize('receptionist', 'doctor'),
      (_req, res) => {
        ok(res, { message: 'staff access granted' });
      },
    );

    rbacApp.use(errorHandler);
  });

  beforeEach(async () => {
    await clearAllTables();
  });

  afterAll(async () => {
    await clearAllTables();
    await db.destroy();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with default receptionist role', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'staff_john',
          password: 'Password123!',
          name: 'John Doe',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.username).toBe('staff_john');
      expect(res.body.data.name).toBe('John Doe');
      expect(res.body.data.role).toBe('receptionist');
      expect(res.body.data.is_active).toBe(true);
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    it('should register a user with specified role (e.g. admin, doctor)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'admin_boss',
          password: 'Password123!',
          name: 'Boss Admin',
          role: 'admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('admin');
    });

    it('should reject duplicate username with 409 DUPLICATE', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'duplicate_user',
          password: 'Password123!',
          name: 'First User',
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'duplicate_user',
          password: 'AnotherPassword123!',
          name: 'Second User',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE');
    });

    it('should validate inputs with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'ab', // min 3 chars
          password: '123', // min 6 chars
          name: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'nurse_mary',
          password: 'Password123!',
          name: 'Mary Jane',
          role: 'receptionist',
        });
    });

    it('should log in with correct credentials and return role in user object', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nurse_mary',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.username).toBe('nurse_mary');
      expect(res.body.data.user.role).toBe('receptionist');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refresh_token=');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should fail with incorrect password with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nurse_mary',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject login for inactive user', async () => {
      await db('users').where({ username: 'nurse_mary' }).update({ is_active: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nurse_mary',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return authenticated user profile from JWT Bearer token', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'dr_somchai',
          password: 'Password123!',
          name: 'Dr. Somchai',
          role: 'doctor',
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'dr_somchai',
          password: 'Password123!',
        });

      const token = loginRes.body.data.accessToken;

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.sub).toBe(regRes.body.data.id);
      expect(meRes.body.data.user.username).toBe('dr_somchai');
      expect(meRes.body.data.user.role).toBe('doctor');
    });
  });

  describe('RBAC & Apidog Dev Headers Support', () => {
    it('should allow access via ApiKey with default admin role in non-production', async () => {
      const res = await request(rbacApp)
        .get('/admin-only')
        .set('Authorization', 'ApiKey testapi');

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('admin access granted');
    });

    it('should allow role impersonation for Apidog via X-Role header', async () => {
      // Test endpoint requiring receptionist/doctor with X-Role: doctor
      const doctorRes = await request(rbacApp)
        .get('/staff-only')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'doctor');

      expect(doctorRes.status).toBe(200);
      expect(doctorRes.body.data.message).toBe('staff access granted');

      // Admin role attempting to access receptionist/doctor route should be forbidden (403)
      const adminRes = await request(rbacApp)
        .get('/staff-only')
        .set('Authorization', 'ApiKey testapi')
        .set('X-Role', 'admin');

      expect(adminRes.status).toBe(403);
      expect(adminRes.body.error.code).toBe('FORBIDDEN');
    });

    it('should enforce role restrictions using JWT tokens', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'receptionist_only',
          password: 'Password123!',
          name: 'Receptionist User',
          role: 'receptionist',
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'receptionist_only',
          password: 'Password123!',
        });

      const token = loginRes.body.data.accessToken;

      // Receptionist trying to access admin-only route -> 403 Forbidden
      const adminRouteRes = await request(rbacApp)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(adminRouteRes.status).toBe(403);
      expect(adminRouteRes.body.error.code).toBe('FORBIDDEN');

      // Receptionist trying to access receptionist/doctor route -> 200 OK
      const staffRouteRes = await request(rbacApp)
        .get('/staff-only')
        .set('Authorization', `Bearer ${token}`);

      expect(staffRouteRes.status).toBe(200);
    });
  });

  describe('POST /api/v1/auth/refresh & logout', () => {
    it('should rotate refresh token and logout successfully', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'refresh_test_user',
          password: 'Password123!',
          name: 'Refresh Test User',
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'refresh_test_user',
          password: 'Password123!',
        });

      const rawCookie = loginRes.headers['set-cookie'][0];
      const refreshToken = rawCookie.split(';')[0];

      // Refresh
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshToken]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data).toHaveProperty('accessToken');

      const newCookie = refreshRes.headers['set-cookie'][0].split(';')[0];

      // Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [newCookie]);

      expect(logoutRes.status).toBe(200);
    });
  });
});
