import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MerchantsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let merchantId: string;

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

  describe('/merchants (POST)', () => {
    it('should create a new merchant', () => {
      return request(app.getHttpServer())
        .post('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Merchant',
          email: 'test@example.com',
          companyName: 'Test Company',
          receiveReports: true,
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.name).toBe('Test Merchant');
          expect(response.body.email).toBe('test@example.com');
          expect(response.body.companyName).toBe('Test Company');
          expect(response.body.receiveReports).toBe(true);
          merchantId = response.body.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/merchants')
        .send({
          name: 'Test',
          email: 'test2@example.com',
        })
        .expect(401);
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test',
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Another Merchant',
          email: 'test@example.com', // Same as first test
        })
        .expect(409);
    });
  });

  describe('/merchants (GET)', () => {
    it('should return all merchants', () => {
      return request(app.getHttpServer())
        .get('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/merchants').expect(401);
    });
  });

  describe('/merchants/:id (GET)', () => {
    it('should return a specific merchant', () => {
      return request(app.getHttpServer())
        .get(`/merchants/${merchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(merchantId);
          expect(response.body.name).toBe('Test Merchant');
        });
    });

    it('should return 404 for non-existent merchant', () => {
      return request(app.getHttpServer())
        .get('/merchants/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/merchants/:id (PATCH)', () => {
    it('should update a merchant', () => {
      return request(app.getHttpServer())
        .patch(`/merchants/${merchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Merchant',
          receiveReports: false,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe('Updated Merchant');
          expect(response.body.receiveReports).toBe(false);
        });
    });

    it('should return 404 for non-existent merchant', () => {
      return request(app.getHttpServer())
        .patch('/merchants/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('/merchants/:id (DELETE)', () => {
    it('should delete a merchant', () => {
      return request(app.getHttpServer())
        .delete(`/merchants/${merchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent merchant', () => {
      return request(app.getHttpServer())
        .delete('/merchants/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
