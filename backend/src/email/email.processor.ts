import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import * as sgMail from '@sendgrid/mail';
import { EmailData } from './email.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor() {
    // Initialize SendGrid
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  @Process('send-email')
  async handleSendEmail(job: Job<EmailData>) {
    const { to, subject, text, html } = job.data;

    try {
      this.logger.log(`Processing email to ${to} (Job ${job.id})`);

      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        subject,
        text,
        html,
      };

      await sgMail.send(msg);

      this.logger.log(`Email sent successfully to ${to} (Job ${job.id})`);
      return { success: true, recipient: to };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to} (Job ${job.id})`,
        error.stack,
      );
      throw error; // This will trigger retry
    }
  }
}
