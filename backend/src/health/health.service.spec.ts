import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ok status and fields', () => {
    const svc = new HealthService();
    const res = svc.check();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(typeof res.timestamp).toBe('string');
  });
});
