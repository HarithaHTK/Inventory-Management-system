import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('email')
@UseGuards(AuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('queue-stats')
  async getQueueStats() {
    return this.emailService.getQueueStats();
  }
}
