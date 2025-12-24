import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as sgMail from '@sendgrid/mail';

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface InventoryReportData {
  itemName: string;
  remainingQty: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {
    // Initialize SendGrid with API key
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY is not set. Email functionality will not work.');
    } else {
      sgMail.setApiKey(apiKey);
    }
  }

  /**
   * Send a single email immediately
   */
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const msg = {
        to: emailData.to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${emailData.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailData.to}`, error);
      throw error;
    }
  }

  /**
   * Queue a single email for processing
   */
  async queueEmail(emailData: EmailData): Promise<void> {
    await this.emailQueue.add('send-email', emailData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  /**
   * Queue multiple emails for batch processing
   */
  async queueBatchEmails(emails: EmailData[]): Promise<void> {
    const jobs = emails.map((email) => ({
      name: 'send-email',
      data: email,
      opts: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }));

    await this.emailQueue.addBulk(jobs);
    this.logger.log(`Queued ${emails.length} emails for processing`);
  }

  /**
   * Generate inventory report email HTML
   */
  generateInventoryReportEmail(
    merchantName: string,
    inventoryData: InventoryReportData[],
  ): { html: string; text: string } {
    const text = this.generateInventoryReportText(merchantName, inventoryData);
    const html = this.generateInventoryReportHTML(merchantName, inventoryData);

    return { text, html };
  }

  private generateInventoryReportText(
    merchantName: string,
    inventoryData: InventoryReportData[],
  ): string {
    let text = `Dear ${merchantName},\n\n`;
    text += `Here is your inventory summary report:\n\n`;

    inventoryData.forEach((item) => {
      text += `${item.itemName}: ${item.remainingQty} units\n`;
    });

    text += `\n\nBest regards,\nInventory Management System`;

    return text;
  }

  private generateInventoryReportHTML(
    merchantName: string,
    inventoryData: InventoryReportData[],
  ): string {
    const rows = inventoryData
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${item.itemName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${item.remainingQty}</td>
      </tr>
    `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inventory Summary Report</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin: 0;">Inventory Summary Report</h1>
          </div>
          
          <p>Dear ${merchantName},</p>
          
          <p>Here is your inventory summary report:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #3498db; color: white;">
                <th style="padding: 12px; text-align: left;">Item Name</th>
                <th style="padding: 12px; text-align: right;">Remaining Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
            <p style="color: #7f8c8d; font-size: 14px;">
              Best regards,<br>
              <strong>Inventory Management System</strong>
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; font-size: 12px; color: #7f8c8d;">
            <p style="margin: 0;">This is an automated report. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const waiting = await this.emailQueue.getWaitingCount();
    const active = await this.emailQueue.getActiveCount();
    const completed = await this.emailQueue.getCompletedCount();
    const failed = await this.emailQueue.getFailedCount();

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }
}
