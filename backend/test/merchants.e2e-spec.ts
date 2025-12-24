import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Merchants (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let testMerchantId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register and login to get auth token
    let registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'merchantuser',
        email: 'merchantuser@example.com',
        password: 'password123',
      });

    // If user already exists, login instead
    if (registerRes.status === 401) {
      registerRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'merchantuser',
          password: 'password123',
        });
    }

    authToken = registerRes.body.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    if (dataSource) {
      await dataSource.query(
        "DELETE FROM merchants WHERE name LIKE 'Test%' OR name LIKE 'Updated%'",
      );
      await dataSource.query(
        "DELETE FROM users WHERE username = 'merchantuser'",
      );
    }
    await app.close();
  });

  describe('/merchants (POST)', () => {
    it('should create a new merchant when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Merchant 1',
          email: 'testmerchant1@example.com',
          phone: '1234567890',
          address: '123 Test St',
          city: 'New York',
          country: 'USA',
          zipCode: '10001',
          businessLicense: 'BL-00001',
        })
        .expect(201);

      expect(res.body.message).toBe('Merchant created successfully');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Merchant 1');
      expect(res.body.data.email).toBe('testmerchant1@example.com');
      expect(res.body.data.isActive).toBe(true);
      testMerchantId = res.body.data.id;
    });

    it('should fail to create merchant without authentication', async () => {
      await request(app.getHttpServer())
        .post('/merchants')
        .send({
          name: 'Test Merchant',
          email: 'test@example.com',
          phone: '1234567890',
          address: '123 Test St',
        })
        .expect(401);
    });

    it('should fail with duplicate merchant name', async () => {
      await request(app.getHttpServer())
        .post('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Merchant 1',
          email: 'another@example.com',
          phone: '0987654321',
          address: '456 Test Ave',
        })
        .expect(500);
    });

    it('should fail with duplicate merchant email', async () => {
      await request(app.getHttpServer())
        .post('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Merchant 2',
          email: 'testmerchant1@example.com',
          phone: '0987654321',
          address: '456 Test Ave',
        })
        .expect(500);
    });

    it('should create merchant with minimal required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Merchant 3',
          email: 'testmerchant3@example.com',
          phone: '1112223333',
          address: '789 Test Ln',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Merchant 3');
      expect(res.body.data.city).toBeNull();
      expect(res.body.data.country).toBeNull();
    });

    it('should create merchant with all fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Merchant Full',
          email: 'testmerchantfull@example.com',
          phone: '4445556666',
          address: '999 Test Dr',
          city: 'Los Angeles',
          country: 'USA',
          zipCode: '90001',
          businessLicense: 'BL-99999',
          isActive: true,
        })
        .expect(201);

      expect(res.body.data.city).toBe('Los Angeles');
      expect(res.body.data.country).toBe('USA');
      expect(res.body.data.zipCode).toBe('90001');
      expect(res.body.data.businessLicense).toBe('BL-99999');
    });
  });

  describe('/merchants (GET)', () => {
    it('should return all merchants when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[0]).toHaveProperty('email');
      expect(res.body.data[0]).toHaveProperty('phone');
      expect(res.body.data[0]).toHaveProperty('address');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/merchants').expect(401);
    });

    it('should include only non-deleted merchants', async () => {
      const res = await request(app.getHttpServer())
        .get('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const merchant = res.body.data.find(
        (m: any) => m.id === testMerchantId,
      );
      expect(merchant).toBeDefined();
    });

    it('should include seeded merchants', async () => {
      const res = await request(app.getHttpServer())
        .get('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const seededMerchants = res.body.data.filter(
        (m: any) => m.name.startsWith('Merchant '),
      );
      expect(seededMerchants.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('/merchants/:id (GET)', () => {
    it('should return a specific merchant by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/merchants/${testMerchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toBe('Merchant retrieved successfully');
      expect(res.body.data).toHaveProperty('id', testMerchantId);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('email');
    });

    it('should return null for non-existent merchant', async () => {
      const res = await request(app.getHttpServer())
        .get('/merchants/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeNull();
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/merchants/${testMerchantId}`)
        .expect(401);
    });
  });

  describe('/merchants/:id (PATCH)', () => {
    it('should update merchant information', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/merchants/${testMerchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '5555555555',
          address: '999 Updated St',
        })
        .expect(200);

      expect(res.body.message).toBe('Merchant updated successfully');
      expect(res.body.data.phone).toBe('5555555555');
      expect(res.body.data.address).toBe('999 Updated St');
      expect(res.body.data.name).toBe('Test Merchant 1');
    });

    it('should update merchant name if new name does not exist', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/merchants/${testMerchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Merchant',
        })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Test Merchant');
    });

    it('should update merchant email if new email does not exist', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/merchants/${testMerchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'updatedemail@example.com',
        })
        .expect(200);

      expect(res.body.data.email).toBe('updatedemail@example.com');
    });

    it('should fail to update to duplicate name', async () => {
      await request(app.getHttpServer())
        .patch(`/merchants/${testMerchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Merchant 3',
        })
        .expect(500);
    });

    it('should fail to update to duplicate email', async () => {
      await request(app.getHttpServer())
        .patch(`/merchants/${testMerchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'testmerchant3@example.com',
        })
        .expect(500);
    });

    it('should update merchant status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/merchants/${testMerchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(200);

      expect(res.body.data.isActive).toBe(false);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/merchants/${testMerchantId}`)
        .send({
          phone: '1111111111',
        })
        .expect(401);
    });

    it('should fail if merchant not found', async () => {
      await request(app.getHttpServer())
        .patch('/merchants/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '1111111111',
        })
        .expect(404);
    });
  });

  describe('/merchants/:id (DELETE)', () => {
    let merchantToDeleteId: number;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Merchant to Delete',
          email: 'todelete@example.com',
          phone: '6666666666',
          address: 'Delete Street',
        });
      merchantToDeleteId = res.body.data.id;
    });

    it('should soft delete a merchant', async () => {
      await request(app.getHttpServer())
        .delete(`/merchants/${merchantToDeleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should not return deleted merchant in GET /merchants', async () => {
      const res = await request(app.getHttpServer())
        .get('/merchants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedMerchant = res.body.data.find(
        (m: any) => m.id === merchantToDeleteId,
      );
      expect(deletedMerchant).toBeUndefined();
    });

    it('should not return deleted merchant by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/merchants/${merchantToDeleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeNull();
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/merchants/${testMerchantId}`)
        .expect(401);
    });

    it('should fail if merchant not found', async () => {
      await request(app.getHttpServer())
        .delete('/merchants/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
