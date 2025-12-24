import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Inventory (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let testInventoryId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register and login to get auth token
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'inventoryuser',
        email: 'inventory@example.com',
        password: 'password123',
      });

    authToken = registerRes.body.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    if (dataSource) {
      await dataSource.query(
        "DELETE FROM inventory WHERE name LIKE 'Test%' OR name LIKE 'Updated%'",
      );
      await dataSource.query(
        "DELETE FROM users WHERE username = 'inventoryuser'",
      );
    }
    await app.close();
  });

  describe('/inventory (POST)', () => {
    it('should create a new inventory item when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Item 1',
          description: 'Test Description 1',
          quantity: 100,
          price: 99.99,
          sku: 'TEST001',
          category: 'Electronics',
        })
        .expect(201);

      expect(res.body.message).toBe('Inventory item created successfully');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Item 1');
      expect(res.body.data.quantity).toBe(100);
      expect(res.body.data.price).toBe(99.99);
      testInventoryId = res.body.data.id;
    });

    it('should fail to create item without authentication', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .send({
          name: 'Test Item',
          description: 'Test Description',
          quantity: 100,
          price: 99.99,
        })
        .expect(401);
    });

    it('should fail with duplicate item name', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Item 1',
          description: 'Another Description',
          quantity: 50,
          price: 49.99,
        })
        .expect(500);
    });

    it('should create item with minimal required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Item 2',
          description: 'Simple Item',
          quantity: 50,
          price: 25.50,
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Item 2');
      expect(res.body.data.sku).toBeNull();
    });
  });

  describe('/inventory (GET)', () => {
    it('should return all inventory items when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[0]).toHaveProperty('quantity');
      expect(res.body.data[0]).toHaveProperty('price');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/inventory').expect(401);
    });

    it('should include only non-deleted items', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const item = res.body.data.find(
        (i: any) => i.id === testInventoryId,
      );
      expect(item).toBeDefined();
    });
  });

  describe('/inventory/:id (GET)', () => {
    it('should return a specific inventory item by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory/${testInventoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toBe('Inventory item retrieved successfully');
      expect(res.body.data).toHaveProperty('id', testInventoryId);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('quantity');
    });

    it('should return null for non-existent item', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeNull();
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/inventory/${testInventoryId}`)
        .expect(401);
    });
  });

  describe('/inventory/:id (PATCH)', () => {
    it('should update inventory item information', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/inventory/${testInventoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 150,
          price: 109.99,
        })
        .expect(200);

      expect(res.body.message).toBe('Inventory item updated successfully');
      expect(res.body.data.quantity).toBe(150);
      expect(res.body.data.price).toBe(109.99);
      expect(res.body.data.name).toBe('Test Item 1');
    });

    it('should update item name if new name does not exist', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/inventory/${testInventoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Item',
        })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Test Item');
    });

    it('should fail to update to duplicate name', async () => {
      await request(app.getHttpServer())
        .patch(`/inventory/${testInventoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Item 2',
        })
        .expect(500);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/inventory/${testInventoryId}`)
        .send({
          quantity: 200,
        })
        .expect(401);
    });

    it('should fail if item not found', async () => {
      await request(app.getHttpServer())
        .patch('/inventory/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 200,
        })
        .expect(404);
    });
  });

  describe('/inventory/:id (DELETE)', () => {
    let itemToDeleteId: number;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Item to Delete',
          description: 'This item will be deleted',
          quantity: 10,
          price: 10.0,
        });
      itemToDeleteId = res.body.data.id;
    });

    it('should soft delete an inventory item', async () => {
      await request(app.getHttpServer())
        .delete(`/inventory/${itemToDeleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should not return deleted item in GET /inventory', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedItem = res.body.data.find(
        (i: any) => i.id === itemToDeleteId,
      );
      expect(deletedItem).toBeUndefined();
    });

    it('should not return deleted item by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory/${itemToDeleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeNull();
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/inventory/${testInventoryId}`)
        .expect(401);
    });

    it('should fail if item not found', async () => {
      await request(app.getHttpServer())
        .delete('/inventory/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
