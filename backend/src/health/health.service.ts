import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
  env?: string;
}

@Injectable()
export class HealthService {
  check(): HealthResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    };
  }
}
