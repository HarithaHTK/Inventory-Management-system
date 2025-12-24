import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      addBulk: jest.fn(),
      getWaitingCount: jest.fn().mockResolvedValue(5),
      getActiveCount: jest.fn().mockResolvedValue(2),
      getCompletedCount: jest.fn().mockResolvedValue(100),
      getFailedCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getQueueToken('email'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueEmail', () => {
    it('should queue a single email', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test text',
        html: '<p>Test html</p>',
      };

      await service.queueEmail(emailData);

      expect(mockQueue.add).toHaveBeenCalledWith('send-email', emailData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });
    });
  });

  describe('queueBatchEmails', () => {
    it('should queue multiple emails in batch', async () => {
      const emails = [
        {
          to: 'test1@example.com',
          subject: 'Test 1',
          text: 'Text 1',
          html: '<p>HTML 1</p>',
        },
        {
          to: 'test2@example.com',
          subject: 'Test 2',
          text: 'Text 2',
          html: '<p>HTML 2</p>',
        },
      ];

      await service.queueBatchEmails(emails);

      expect(mockQueue.addBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'send-email',
            data: emails[0],
          }),
          expect.objectContaining({
            name: 'send-email',
            data: emails[1],
          }),
        ]),
      );
    });

    it('should queue empty array without errors', async () => {
      await service.queueBatchEmails([]);
      expect(mockQueue.addBulk).toHaveBeenCalledWith([]);
    });
  });

  describe('generateInventoryReportEmail', () => {
    it('should generate email with inventory data', () => {
      const merchantName = 'John Doe';
      const inventoryData = [
        { itemName: 'Widget A', remainingQty: 100 },
        { itemName: 'Widget B', remainingQty: 50 },
      ];

      const result = service.generateInventoryReportEmail(
        merchantName,
        inventoryData,
      );

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('html');
      expect(result.text).toContain(merchantName);
      expect(result.text).toContain('Widget A');
      expect(result.text).toContain('100');
      expect(result.html).toContain(merchantName);
      expect(result.html).toContain('Widget A');
      expect(result.html).toContain('100');
    });

    it('should handle empty inventory data', () => {
      const result = service.generateInventoryReportEmail('Test Merchant', []);

      expect(result.text).toContain('Test Merchant');
      expect(result.html).toContain('Test Merchant');
    });

    it('should format numbers correctly in email', () => {
      const inventoryData = [
        { itemName: 'Item 1', remainingQty: 1234.56 },
      ];

      const result = service.generateInventoryReportEmail(
        'Test',
        inventoryData,
      );

      expect(result.text).toContain('1234.56');
      expect(result.html).toContain('1234.56');
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 0,
      });

      expect(mockQueue.getWaitingCount).toHaveBeenCalled();
      expect(mockQueue.getActiveCount).toHaveBeenCalled();
      expect(mockQueue.getCompletedCount).toHaveBeenCalled();
      expect(mockQueue.getFailedCount).toHaveBeenCalled();
    });

    it('should handle queue errors gracefully', async () => {
      mockQueue.getWaitingCount.mockRejectedValue(new Error('Queue error'));

      await expect(service.getQueueStats()).rejects.toThrow('Queue error');
    });
  });
});
