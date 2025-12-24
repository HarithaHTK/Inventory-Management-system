import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface DatabaseStatus {
  connected: boolean;
  type?: string;
}

export interface HealthResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
  env?: string;
  database?: DatabaseStatus;
}

@Injectable()
export class HealthService {
  constructor(private dataSource: DataSource) {}

  async check(): Promise<HealthResponse> {
    let databaseStatus: DatabaseStatus = {
      connected: false,
    };

    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        databaseStatus = {
          connected: true,
          type: this.dataSource.options.type,
        };
      }
    } catch (error) {
      databaseStatus.connected = false;
    }

    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      database: databaseStatus,
    };
  }
}
