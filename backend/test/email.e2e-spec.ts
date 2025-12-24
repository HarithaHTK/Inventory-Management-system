import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('EmailController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/email/queue-stats (GET)', () => {
    it('should return email queue statistics', () => {
      return request(app.getHttpServer())
        .get('/email/queue-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('waiting');
          expect(response.body).toHaveProperty('active');
          expect(response.body).toHaveProperty('completed');
          expect(response.body).toHaveProperty('failed');
          expect(typeof response.body.waiting).toBe('number');
          expect(typeof response.body.active).toBe('number');
          expect(typeof response.body.completed).toBe('number');
          expect(typeof response.body.failed).toBe('number');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/email/queue-stats')
        .expect(401);
    });
  });
});
