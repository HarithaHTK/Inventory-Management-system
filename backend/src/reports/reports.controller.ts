import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get inventory summary data
   */
  @Get('inventory-summary')
  async getInventorySummary() {
    return this.reportsService.getInventorySummary();
  }

  /**
   * Send inventory report to a specific merchant
   */
  @Post('send-to-merchant/:merchantId')
  async sendToMerchant(@Param('merchantId') merchantId: string) {
    await this.reportsService.sendInventoryReportToMerchant(merchantId);
    return {
      message: 'Inventory report queued successfully',
      merchantId,
    };
  }

  /**
   * Send inventory reports to all active merchants
   */
  @Post('send-to-all')
  async sendToAll() {
    const result = await this.reportsService.sendInventoryReportsToAllMerchants();
    return {
      message: 'Inventory reports queued successfully',
      ...result,
    };
  }

  /**
   * Get report statistics
   */
  @Get('stats')
  async getStats() {
    return this.reportsService.getReportStats();
  }
}
