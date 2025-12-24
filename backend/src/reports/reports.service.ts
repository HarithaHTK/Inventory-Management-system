import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inventory } from '../inventory/entities/inventory.entity';
import { MerchantsService } from '../merchants/merchants.service';
import { EmailService, InventoryReportData } from '../email/email.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private merchantsService: MerchantsService,
    private emailService: EmailService,
  ) {}

  /**
   * Get current inventory summary
   */
  async getInventorySummary(): Promise<InventoryReportData[]> {
    const inventoryItems = await this.inventoryRepository.find({
      select: ['name', 'quantity'],
      order: {
        name: 'ASC',
      },
    });

    return inventoryItems.map((item) => ({
      itemName: item.name,
      remainingQty: Number(item.quantity),
    }));
  }

  /**
   * Send inventory report to a single merchant
   */
  async sendInventoryReportToMerchant(merchantId: string): Promise<void> {
    const merchant = await this.merchantsService.findOne(merchantId);

    if (!merchant.isActive || !merchant.receiveReports) {
      throw new Error('Merchant is not active or has opted out of reports');
    }

    const inventoryData = await this.getInventorySummary();
    const { text, html } = this.emailService.generateInventoryReportEmail(
      merchant.name,
      inventoryData,
    );

    await this.emailService.queueEmail({
      to: merchant.email,
      subject: 'Inventory Summary Report',
      text,
      html,
    });

    this.logger.log(`Queued inventory report for merchant ${merchant.email}`);
  }

  /**
   * Send inventory reports to all active merchants
   */
  async sendInventoryReportsToAllMerchants(): Promise<{
    totalMerchants: number;
    queued: number;
  }> {
    const merchants = await this.merchantsService.findActiveWithReports();
    const inventoryData = await this.getInventorySummary();

    this.logger.log(
      `Preparing to send inventory reports to ${merchants.length} merchants`,
    );

    if (inventoryData.length === 0) {
      this.logger.warn('No inventory items found to report');
      return { totalMerchants: merchants.length, queued: 0 };
    }

    // Generate emails for all merchants
    const emails = merchants.map((merchant) => {
      const { text, html } = this.emailService.generateInventoryReportEmail(
        merchant.name,
        inventoryData,
      );

      return {
        to: merchant.email,
        subject: 'Inventory Summary Report',
        text,
        html,
      };
    });

    // Queue all emails for batch processing
    await this.emailService.queueBatchEmails(emails);

    this.logger.log(`Queued ${emails.length} inventory reports for processing`);

    return {
      totalMerchants: merchants.length,
      queued: emails.length,
    };
  }

  /**
   * Automated cron job to send reports
   * Runs every Monday at 9:00 AM
   * Adjust the schedule as needed
   */
  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_9AM)
  async sendScheduledReports() {
    this.logger.log('Starting scheduled inventory report sending...');

    try {
      const result = await this.sendInventoryReportsToAllMerchants();
      this.logger.log(
        `Scheduled report completed. Sent to ${result.queued}/${result.totalMerchants} merchants`,
      );
    } catch (error) {
      this.logger.error('Failed to send scheduled reports', error.stack);
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats() {
    const totalMerchants = await this.merchantsService.count();
    const activeMerchants = (await this.merchantsService.findActiveWithReports())
      .length;
    const inventoryItems = await this.inventoryRepository.count();
    const emailQueueStats = await this.emailService.getQueueStats();

    return {
      totalMerchants,
      activeMerchants,
      inventoryItems,
      emailQueue: emailQueueStats,
    };
  }
}
