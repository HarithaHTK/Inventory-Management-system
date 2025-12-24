import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantsService } from './merchants.service';
import { Merchant } from './entities/merchant.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('MerchantsService', () => {
  let service: MerchantsService;
  let repository: Repository<Merchant>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantsService,
        {
          provide: getRepositoryToken(Merchant),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MerchantsService>(MerchantsService);
    repository = module.get<Repository<Merchant>>(getRepositoryToken(Merchant));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new merchant', async () => {
      const createDto = {
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Doe Corp',
      };

      const merchant = { id: '1', ...createDto };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(merchant);
      mockRepository.save.mockResolvedValue(merchant);

      const result = await service.create(createDto);

      expect(result).toEqual(merchant);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(merchant);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockRepository.findOne.mockResolvedValue({ id: '1', email: 'john@example.com' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of merchants', async () => {
      const merchants = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' },
      ];

      mockRepository.find.mockResolvedValue(merchants);

      const result = await service.findAll();

      expect(result).toEqual(merchants);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should return empty array if no merchants found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a merchant by id', async () => {
      const merchant = { id: '1', name: 'John', email: 'john@example.com' };

      mockRepository.findOne.mockResolvedValue(merchant);

      const result = await service.findOne('1');

      expect(result).toEqual(merchant);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException if merchant not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActiveWithReports', () => {
    it('should return only active merchants who receive reports', async () => {
      const merchants = [
        { id: '1', name: 'John', isActive: true, receiveReports: true },
        { id: '2', name: 'Jane', isActive: true, receiveReports: true },
      ];

      mockRepository.find.mockResolvedValue(merchants);

      const result = await service.findActiveWithReports();

      expect(result).toEqual(merchants);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          isActive: true,
          receiveReports: true,
        },
      });
    });

    it('should return empty array if no active merchants', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findActiveWithReports();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a merchant', async () => {
      const existingMerchant = {
        id: '1',
        name: 'John',
        email: 'john@example.com',
      };

      const updateDto = { name: 'John Updated' };
      const updatedMerchant = { ...existingMerchant, ...updateDto };

      mockRepository.findOne.mockResolvedValue(existingMerchant);
      mockRepository.save.mockResolvedValue(updatedMerchant);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedMerchant);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if merchant not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if updating to existing email', async () => {
      const existingMerchant = {
        id: '1',
        name: 'John',
        email: 'john@example.com',
      };

      const otherMerchant = {
        id: '2',
        email: 'jane@example.com',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingMerchant) // First call for findOne
        .mockResolvedValueOnce(otherMerchant); // Second call for email check

      await expect(
        service.update('1', { email: 'jane@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a merchant', async () => {
      const merchant = { id: '1', name: 'John' };

      mockRepository.findOne.mockResolvedValue(merchant);
      mockRepository.remove.mockResolvedValue(merchant);

      await service.remove('1');

      expect(mockRepository.remove).toHaveBeenCalledWith(merchant);
    });

    it('should throw NotFoundException if merchant not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should return total count of merchants', async () => {
      mockRepository.count.mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
      expect(mockRepository.count).toHaveBeenCalled();
    });

    it('should return 0 if no merchants', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.count();

      expect(result).toBe(0);
    });
  });
});
