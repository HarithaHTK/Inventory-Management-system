import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ReportsController (e2e)', () => {
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

    // Create a test merchant
    const merchantResponse = await request(app.getHttpServer())
      .post('/merchants')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Report Test Merchant',
        email: 'report-test@example.com',
        receiveReports: true,
      })
      .expect(201);

    merchantId = merchantResponse.body.id;
  });

  afterAll(async () => {
    // Clean up test merchant
    if (merchantId) {
      await request(app.getHttpServer())
        .delete(`/merchants/${merchantId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }

    await app.close();
  });

  describe('/reports/inventory-summary (GET)', () => {
    it('should return inventory summary', () => {
      return request(app.getHttpServer())
        .get('/reports/inventory-summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty('itemName');
            expect(response.body[0]).toHaveProperty('remainingQty');
          }
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/reports/inventory-summary')
        .expect(401);
    });
  });

  describe('/reports/send-to-merchant/:merchantId (POST)', () => {
    it('should queue report for a specific merchant', () => {
      return request(app.getHttpServer())
        .post(`/reports/send-to-merchant/${merchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .then((response) => {
          expect(response.body.message).toBe(
            'Inventory report queued successfully',
          );
          expect(response.body.merchantId).toBe(merchantId);
        });
    });

    it('should return 404 for non-existent merchant', () => {
      return request(app.getHttpServer())
        .post('/reports/send-to-merchant/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post(`/reports/send-to-merchant/${merchantId}`)
        .expect(401);
    });
  });

  describe('/reports/send-to-all (POST)', () => {
    it('should queue reports for all active merchants', () => {
      return request(app.getHttpServer())
        .post('/reports/send-to-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .then((response) => {
          expect(response.body.message).toBe(
            'Inventory reports queued successfully',
          );
          expect(response.body).toHaveProperty('totalMerchants');
          expect(response.body).toHaveProperty('queued');
          expect(typeof response.body.totalMerchants).toBe('number');
          expect(typeof response.body.queued).toBe('number');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/reports/send-to-all')
        .expect(401);
    });
  });

  describe('/reports/stats (GET)', () => {
    it('should return report statistics', () => {
      return request(app.getHttpServer())
        .get('/reports/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('totalMerchants');
          expect(response.body).toHaveProperty('activeMerchants');
          expect(response.body).toHaveProperty('inventoryItems');
          expect(response.body).toHaveProperty('emailQueue');
          expect(response.body.emailQueue).toHaveProperty('waiting');
          expect(response.body.emailQueue).toHaveProperty('active');
          expect(response.body.emailQueue).toHaveProperty('completed');
          expect(response.body.emailQueue).toHaveProperty('failed');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/reports/stats').expect(401);
    });
  });
});
