import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Roles CRUD (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const testRole = {
    alias: `role-${Date.now()}`,
    name: 'Test Role',
    description: 'Test Description',
  };

  describe('POST /roles - Create', () => {
    it('should create a new role', async () => {
      const res = await request(app.getHttpServer())
        .post('/roles')
        .send(testRole)
        .expect(201);

      expect(res.body.alias).toBe(testRole.alias);
      expect(res.body.name).toBe(testRole.name);
    });
  });

  describe('GET /roles - List All', () => {
    it('should get all roles', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /roles/:alias - Get One', () => {
    it('should get a specific role', async () => {
      const res = await request(app.getHttpServer())
        .get(`/roles/${testRole.alias}`)
        .expect(200);

      expect(res.body.alias).toBe(testRole.alias);
    });
  });

  describe('PATCH /roles/:alias - Update', () => {
    it('should update a role', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/roles/${testRole.alias}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /roles/:alias - Delete', () => {
    it('should delete a role', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/roles/${testRole.alias}`)
        .expect(200);

      expect(res.body.message).toContain('deleted successfully');
    });
  });
});
