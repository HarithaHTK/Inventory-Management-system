import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Reports (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let testReportId: number;
  let testInventoryIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register and login to get auth token
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'reportuser',
        email: 'report@example.com',
        password: 'password123',
      });

    authToken = registerRes.body.access_token;

    // Create test inventory items
    const item1 = await request(app.getHttpServer())
      .post('/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Report Test Item 1',
        description: 'Test Item 1 for Reports',
        quantity: 100,
        price: 50.0,
        sku: 'RTEST001',
        category: 'Test',
      })
      .expect(201);
    testInventoryIds.push(item1.body.data.id);

    const item2 = await request(app.getHttpServer())
      .post('/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Report Test Item 2',
        description: 'Test Item 2 for Reports',
        quantity: 200,
        price: 75.0,
        sku: 'RTEST002',
        category: 'Test',
      })
      .expect(201);
    testInventoryIds.push(item2.body.data.id);
  });

  afterAll(async () => {
    // Clean up test data
    if (dataSource) {
      await dataSource.query(
        "DELETE FROM report_inventory WHERE report_id IN (SELECT id FROM reports WHERE title LIKE 'Test%' OR title LIKE 'Updated%')",
      );
      await dataSource.query(
        "DELETE FROM reports WHERE title LIKE 'Test%' OR title LIKE 'Updated%'",
      );
      await dataSource.query(
        "DELETE FROM inventory WHERE name LIKE 'Report Test%'",
      );
      await dataSource.query("DELETE FROM users WHERE username = 'reportuser'");
    }
    await app.close();
  });

  describe('/reports (POST)', () => {
    it('should create a new report when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Report 1',
          description: 'Test Report Description',
          inventoryItemIds: testInventoryIds,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Report 1');
      expect(res.body.description).toBe('Test Report Description');
      expect(res.body.inventoryItems).toHaveLength(2);
      testReportId = res.body.id;
    });

    it('should fail to create report without authentication', async () => {
      await request(app.getHttpServer())
        .post('/reports')
        .send({
          title: 'Test Report',
          description: 'Test Description',
          inventoryItemIds: testInventoryIds,
        })
        .expect(401);
    });

    it('should fail with invalid inventory item IDs', async () => {
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Report',
          description: 'Test Description',
          inventoryItemIds: [99999, 99998],
        })
        .expect(400);
    });

    it('should fail with empty inventory items array', async () => {
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Report',
          description: 'Test Description',
          inventoryItemIds: [],
        })
        .expect(400);
    });

    it('should create report with only required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Report 2',
          inventoryItemIds: [testInventoryIds[0]],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Report 2');
      expect(res.body.inventoryItems).toHaveLength(1);
    });
  });

  describe('/reports (GET)', () => {
    it('should return all reports when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('inventoryItems');
    });

    it('should fail to get reports without authentication', async () => {
      await request(app.getHttpServer()).get('/reports').expect(401);
    });
  });

  describe('/reports/:id (GET)', () => {
    it('should return a specific report by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reports/${testReportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(testReportId);
      expect(res.body.title).toBe('Test Report 1');
      expect(res.body.inventoryItems).toHaveLength(2);
      expect(res.body.inventoryItems[0]).toHaveProperty('name');
    });

    it('should fail to get report without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/reports/${testReportId}`)
        .expect(401);
    });

    it('should return 404 for non-existent report', async () => {
      await request(app.getHttpServer())
        .get('/reports/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/reports/:id (PATCH)', () => {
    it('should update a report', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/reports/${testReportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Report 1',
          description: 'Updated Description',
        })
        .expect(200);

      expect(res.body.title).toBe('Updated Test Report 1');
      expect(res.body.description).toBe('Updated Description');
    });

    it('should update report inventory items', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/reports/${testReportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          inventoryItemIds: [testInventoryIds[0]],
        })
        .expect(200);

      expect(res.body.inventoryItems).toHaveLength(1);
    });

    it('should fail to update without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/reports/${testReportId}`)
        .send({
          title: 'Updated Title',
        })
        .expect(401);
    });

    it('should return 404 for non-existent report', async () => {
      await request(app.getHttpServer())
        .patch('/reports/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(404);
    });

    it('should fail with invalid inventory item IDs', async () => {
      await request(app.getHttpServer())
        .patch(`/reports/${testReportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          inventoryItemIds: [99999],
        })
        .expect(400);
    });
  });

  describe('/reports/:id (DELETE)', () => {
    it('should soft delete a report', async () => {
      // Create a report to delete
      const createRes = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Report To Delete',
          inventoryItemIds: [testInventoryIds[0]],
        });

      const reportIdToDelete = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/reports/${reportIdToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify the report is soft deleted
      await request(app.getHttpServer())
        .get(`/reports/${reportIdToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail to delete without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/reports/${testReportId}`)
        .expect(401);
    });

    it('should return 404 for non-existent report', async () => {
      await request(app.getHttpServer())
        .delete('/reports/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
