import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepository: Repository<Report>;
  let inventoryRepository: Repository<Inventory>;

  const mockReportRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockInventoryRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportRepository,
        },
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockInventoryRepository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepository = module.get<Repository<Report>>(
      getRepositoryToken(Report),
    );
    inventoryRepository = module.get<Repository<Inventory>>(
      getRepositoryToken(Inventory),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report with inventory items', async () => {
      const createReportDto = {
        title: 'Test Report',
        description: 'Test Description',
        inventoryItemIds: [1, 2],
      };

      const mockInventoryItems = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      const mockReport = {
        id: 1,
        title: createReportDto.title,
        description: createReportDto.description,
        inventoryItems: mockInventoryItems,
      };

      mockInventoryRepository.find.mockResolvedValue(mockInventoryItems);
      mockReportRepository.create.mockReturnValue(mockReport);
      mockReportRepository.save.mockResolvedValue(mockReport);

      const result = await service.create(createReportDto);

      expect(result).toEqual(mockReport);
      expect(mockInventoryRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
      expect(mockReportRepository.create).toHaveBeenCalled();
      expect(mockReportRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if inventory items not found', async () => {
      const createReportDto = {
        title: 'Test Report',
        description: 'Test Description',
        inventoryItemIds: [1, 2],
      };

      mockInventoryRepository.find.mockResolvedValue([{ id: 1 }]);

      await expect(service.create(createReportDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all reports', async () => {
      const mockReports = [
        { id: 1, title: 'Report 1', inventoryItems: [] },
        { id: 2, title: 'Report 2', inventoryItems: [] },
      ];

      mockReportRepository.find.mockResolvedValue(mockReports);

      const result = await service.findAll();

      expect(result).toEqual(mockReports);
      expect(mockReportRepository.find).toHaveBeenCalledWith({
        relations: ['inventoryItems'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a report by id', async () => {
      const mockReport = {
        id: 1,
        title: 'Test Report',
        inventoryItems: [],
      };

      mockReportRepository.findOne.mockResolvedValue(mockReport);

      const result = await service.findOne(1);

      expect(result).toEqual(mockReport);
      expect(mockReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['inventoryItems'],
      });
    });

    it('should throw NotFoundException if report not found', async () => {
      mockReportRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a report', async () => {
      const mockReport = {
        id: 1,
        title: 'Old Title',
        description: 'Old Description',
        inventoryItems: [],
      };

      const updateDto = {
        title: 'New Title',
        description: 'New Description',
        inventoryItemIds: [1],
      };

      const mockInventoryItems = [{ id: 1, name: 'Item 1' }];

      mockReportRepository.findOne.mockResolvedValue(mockReport);
      mockInventoryRepository.find.mockResolvedValue(mockInventoryItems);
      mockReportRepository.save.mockResolvedValue({
        ...mockReport,
        ...updateDto,
        inventoryItems: mockInventoryItems,
      });

      const result = await service.update(1, updateDto);

      expect(result.title).toBe(updateDto.title);
      expect(mockReportRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a report', async () => {
      const mockReport = { id: 1, title: 'Test Report' };

      mockReportRepository.findOne.mockResolvedValue(mockReport);
      mockReportRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockReportRepository.softDelete).toHaveBeenCalledWith(1);
    });
  });
});
