import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up test user
    if (dataSource) {
      await dataSource.query("DELETE FROM users WHERE username = 'testuser'");
    }
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user).toMatchObject({
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(res.body.user).toHaveProperty('id');
    });

    it('should fail with duplicate username', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'another@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user).toMatchObject({
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('should fail with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401);
    });
  });
});
