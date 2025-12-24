import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Inventory } from '../inventory/entities/inventory.entity';
import { MerchantsService } from '../merchants/merchants.service';
import { EmailService } from '../email/email.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let inventoryRepository: Repository<Inventory>;
  let merchantsService: MerchantsService;
  let emailService: EmailService;

  const mockInventoryRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockMerchantsService = {
    findOne: jest.fn(),
    findActiveWithReports: jest.fn(),
    count: jest.fn(),
  };

  const mockEmailService = {
    queueEmail: jest.fn(),
    queueBatchEmails: jest.fn(),
    generateInventoryReportEmail: jest.fn(),
    getQueueStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockInventoryRepository,
        },
        {
          provide: MerchantsService,
          useValue: mockMerchantsService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    inventoryRepository = module.get<Repository<Inventory>>(
      getRepositoryToken(Inventory),
    );
    merchantsService = module.get<MerchantsService>(MerchantsService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInventorySummary', () => {
    it('should return inventory summary data', async () => {
      const inventoryItems = [
        { name: 'Widget A', quantity: 100 },
        { name: 'Widget B', quantity: 50 },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventoryItems);

      const result = await service.getInventorySummary();

      expect(result).toEqual([
        { itemName: 'Widget A', remainingQty: 100 },
        { itemName: 'Widget B', remainingQty: 50 },
      ]);

      expect(mockInventoryRepository.find).toHaveBeenCalledWith({
        select: ['name', 'quantity'],
        order: {
          name: 'ASC',
        },
      });
    });

    it('should return empty array if no inventory items', async () => {
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.getInventorySummary();

      expect(result).toEqual([]);
    });

    it('should convert quantity to number', async () => {
      const inventoryItems = [
        { name: 'Item', quantity: '123.45' }, // String from DB
      ];

      mockInventoryRepository.find.mockResolvedValue(inventoryItems);

      const result = await service.getInventorySummary();

      expect(result[0].remainingQty).toBe(123.45);
      expect(typeof result[0].remainingQty).toBe('number');
    });
  });

  describe('sendInventoryReportToMerchant', () => {
    it('should send report to a single merchant', async () => {
      const merchant = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        isActive: true,
        receiveReports: true,
      };

      const inventoryData = [
        { itemName: 'Widget A', remainingQty: 100 },
      ];

      const emailContent = {
        text: 'Test text',
        html: '<p>Test html</p>',
      };

      mockMerchantsService.findOne.mockResolvedValue(merchant);
      mockInventoryRepository.find.mockResolvedValue([
        { name: 'Widget A', quantity: 100 },
      ]);
      mockEmailService.generateInventoryReportEmail.mockReturnValue(emailContent);

      await service.sendInventoryReportToMerchant('1');

      expect(mockMerchantsService.findOne).toHaveBeenCalledWith('1');
      expect(mockEmailService.generateInventoryReportEmail).toHaveBeenCalledWith(
        merchant.name,
        inventoryData,
      );
      expect(mockEmailService.queueEmail).toHaveBeenCalledWith({
        to: merchant.email,
        subject: 'Inventory Summary Report',
        text: emailContent.text,
        html: emailContent.html,
      });
    });

    it('should throw error if merchant is not active', async () => {
      const merchant = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        isActive: false,
        receiveReports: true,
      };

      mockMerchantsService.findOne.mockResolvedValue(merchant);

      await expect(service.sendInventoryReportToMerchant('1')).rejects.toThrow(
        'Merchant is not active or has opted out of reports',
      );

      expect(mockEmailService.queueEmail).not.toHaveBeenCalled();
    });

    it('should throw error if merchant opted out of reports', async () => {
      const merchant = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        isActive: true,
        receiveReports: false,
      };

      mockMerchantsService.findOne.mockResolvedValue(merchant);

      await expect(service.sendInventoryReportToMerchant('1')).rejects.toThrow(
        'Merchant is not active or has opted out of reports',
      );
    });
  });

  describe('sendInventoryReportsToAllMerchants', () => {
    it('should send reports to all active merchants', async () => {
      const merchants = [
        { id: '1', name: 'John', email: 'john@example.com', isActive: true, receiveReports: true },
        { id: '2', name: 'Jane', email: 'jane@example.com', isActive: true, receiveReports: true },
      ];

      const inventoryData = [
        { itemName: 'Widget A', remainingQty: 100 },
      ];

      const emailContent = {
        text: 'Test text',
        html: '<p>Test html</p>',
      };

      mockMerchantsService.findActiveWithReports.mockResolvedValue(merchants);
      mockInventoryRepository.find.mockResolvedValue([
        { name: 'Widget A', quantity: 100 },
      ]);
      mockEmailService.generateInventoryReportEmail.mockReturnValue(emailContent);

      const result = await service.sendInventoryReportsToAllMerchants();

      expect(result).toEqual({
        totalMerchants: 2,
        queued: 2,
      });

      expect(mockEmailService.queueBatchEmails).toHaveBeenCalledWith([
        {
          to: 'john@example.com',
          subject: 'Inventory Summary Report',
          text: emailContent.text,
          html: emailContent.html,
        },
        {
          to: 'jane@example.com',
          subject: 'Inventory Summary Report',
          text: emailContent.text,
          html: emailContent.html,
        },
      ]);
    });

    it('should handle empty merchant list', async () => {
      mockMerchantsService.findActiveWithReports.mockResolvedValue([]);
      mockInventoryRepository.find.mockResolvedValue([
        { name: 'Widget', quantity: 100 },
      ]);

      const result = await service.sendInventoryReportsToAllMerchants();

      expect(result).toEqual({
        totalMerchants: 0,
        queued: 0,
      });

      expect(mockEmailService.queueBatchEmails).toHaveBeenCalledWith([]);
    });

    it('should return queued 0 if no inventory items', async () => {
      const merchants = [
        { id: '1', name: 'John', email: 'john@example.com' },
      ];

      mockMerchantsService.findActiveWithReports.mockResolvedValue(merchants);
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.sendInventoryReportsToAllMerchants();

      expect(result).toEqual({
        totalMerchants: 1,
        queued: 0,
      });

      expect(mockEmailService.queueBatchEmails).not.toHaveBeenCalled();
    });
  });

  describe('getReportStats', () => {
    it('should return comprehensive report statistics', async () => {
      mockMerchantsService.count.mockResolvedValue(100);
      mockMerchantsService.findActiveWithReports.mockResolvedValue(
        new Array(80).fill({}),
      );
      mockInventoryRepository.count.mockResolvedValue(50);
      mockEmailService.getQueueStats.mockResolvedValue({
        waiting: 5,
        active: 2,
        completed: 93,
        failed: 0,
      });

      const result = await service.getReportStats();

      expect(result).toEqual({
        totalMerchants: 100,
        activeMerchants: 80,
        inventoryItems: 50,
        emailQueue: {
          waiting: 5,
          active: 2,
          completed: 93,
          failed: 0,
        },
      });
    });

    it('should handle zero merchants and inventory', async () => {
      mockMerchantsService.count.mockResolvedValue(0);
      mockMerchantsService.findActiveWithReports.mockResolvedValue([]);
      mockInventoryRepository.count.mockResolvedValue(0);
      mockEmailService.getQueueStats.mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      });

      const result = await service.getReportStats();

      expect(result.totalMerchants).toBe(0);
      expect(result.activeMerchants).toBe(0);
      expect(result.inventoryItems).toBe(0);
    });
  });
});
