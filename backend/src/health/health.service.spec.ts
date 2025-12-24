import { HealthService } from './health.service';
import { DataSource } from 'typeorm';

describe('HealthService', () => {
  let service: HealthService;
  let mockDataSource: any;

  beforeEach(() => {
    mockDataSource = {
      isInitialized: true,
      options: { type: 'mysql' },
      query: jest.fn().mockResolvedValue([{ '1': 1 }]),
    };
    service = new HealthService(mockDataSource);
  });

  it('returns ok status with database connected', async () => {
    const res = await service.check();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(typeof res.timestamp).toBe('string');
    expect(res.database).toBeDefined();
    expect(res.database?.connected).toBe(true);
    expect(res.database?.type).toBe('mysql');
  });

  it('returns database disconnected when connection fails', async () => {
    mockDataSource.query.mockRejectedValue(new Error('Connection failed'));
    const res = await service.check();
    expect(res.database).toBeDefined();
    expect(res.database?.connected).toBe(false);
  });
});
