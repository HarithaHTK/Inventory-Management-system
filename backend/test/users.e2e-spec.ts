import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { Role } from '../src/users/entities/role.entity';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Ensure base roles exist
    const roleRepo = dataSource.getRepository(Role);
    const roles = [
      { alias: 'viewer', name: 'Viewer' },
      { alias: 'manager', name: 'Manager' },
      { alias: 'admin', name: 'Administrator' },
    ];
    for (const role of roles) {
      const existing = await roleRepo.findOne({ where: { alias: role.alias } });
      if (!existing) {
        const created = roleRepo.create(role);
        await roleRepo.save(created);
      }
    }

    // Register and login to get auth token
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'testadmin',
        email: 'testadmin@example.com',
        password: 'password123',
      });

    authToken = registerRes.body.access_token;
    testUserId = registerRes.body.user.id;
  });

  afterAll(async () => {
    // Clean up test users
    if (dataSource) {
      await dataSource.query(
        "DELETE FROM users WHERE username IN ('testadmin', 'updateuser')",
      );
    }
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should return all users when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('roleAlias');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a specific user by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('id', testUserId);
      expect(res.body.data).toHaveProperty('username', 'testadmin');
      expect(res.body.data).toHaveProperty('roleAlias');
      expect(res.body.data).not.toHaveProperty('password');
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update user information', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'updateuser',
        })
        .expect(200);

      expect(res.body.message).toBe('User updated successfully');
      expect(res.body.data.username).toBe('updateuser');
      expect(res.body.data.roleAlias).toBe('viewer');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should fail with duplicate username', async () => {
      // Create another user first
      const anotherUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'anotheruser',
          email: 'another@example.com',
          password: 'password123',
        });

      const anotherUserId = anotherUser.body.user.id;

      // Try to update to existing username
      await request(app.getHttpServer())
        .patch(`/users/${anotherUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'updateuser',
        })
        .expect(500);

      // Clean up
      await dataSource.query(
        `DELETE FROM users WHERE username = 'anotheruser'`,
      );
    });
  });

  describe('/users/:id/reset-password (PATCH)', () => {
    it('should reset user password', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${testUserId}/reset-password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(res.body.message).toBe('Password reset successfully');

      // Verify login with new password
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'updateuser',
          password: 'newpassword123',
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('access_token');
    });

    it('should fail to reset password for non-existent user', async () => {
      await request(app.getHttpServer())
        .patch('/users/99999/reset-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newPassword: 'newpassword123',
        })
        .expect(404);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should soft delete a user', async () => {
      // Create a user to delete
      const userToDelete = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'todelete',
          email: 'todelete@example.com',
          password: 'password123',
        });

      const deleteUserId = userToDelete.body.user.id;

      const res = await request(app.getHttpServer())
        .delete(`/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toBe('User soft deleted successfully');

      // Verify user still exists in database but has deletedAt
      const deletedUser = await dataSource.query(
        `SELECT * FROM users WHERE id = ${deleteUserId}`,
      );
      expect(deletedUser[0]).toBeDefined();
      expect(deletedUser[0].deletedAt).not.toBeNull();

      // Clean up
      await dataSource.query(`DELETE FROM users WHERE id = ${deleteUserId}`);
    });

    it('should fail to delete non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/users/profile (GET)', () => {
    it('should return current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('roleAlias');
    });
  });

  describe('/users/:id roleAlias (PATCH)', () => {
    it('should update user role to manager by alias', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ roleAlias: 'manager' })
        .expect(200);

      expect(res.body.data.roleAlias).toBe('manager');
    });
  });
});
