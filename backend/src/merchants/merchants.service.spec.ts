import { Test, TestingModule } from '@nestjs/testing';
import { MerchantsService } from './merchants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Merchant } from './entities/merchant.entity';
import { Repository } from 'typeorm';

describe('MerchantsService', () => {
  let service: MerchantsService;
  let repository: Repository<Merchant>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
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
    repository = module.get<Repository<Merchant>>(
      getRepositoryToken(Merchant),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all merchants', async () => {
      const merchants = [
        {
          id: 1,
          name: 'Merchant 1',
          email: 'merchant1@example.com',
          phone: '1234567890',
          address: '123 Main St',
          isActive: true,
        },
        {
          id: 2,
          name: 'Merchant 2',
          email: 'merchant2@example.com',
          phone: '0987654321',
          address: '456 Oak Ave',
          isActive: true,
        },
      ];
      mockRepository.find.mockResolvedValue(merchants);

      const result = await service.findAll();
      expect(result).toEqual(merchants);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no merchants exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findActive', () => {
    it('should return only active merchants', async () => {
      const activeMerchants = [
        {
          id: 1,
          name: 'Merchant 1',
          email: 'merchant1@example.com',
          phone: '1234567890',
          address: '123 Main St',
          isActive: true,
        },
        {
          id: 2,
          name: 'Merchant 2',
          email: 'merchant2@example.com',
          phone: '0987654321',
          address: '456 Oak Ave',
          isActive: true,
        },
      ];
      mockRepository.find.mockResolvedValue(activeMerchants);

      const result = await service.findActive();
      expect(result).toEqual(activeMerchants);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        select: expect.any(Object),
        order: { name: 'ASC' },
      });
    });

    it('should return empty array when no active merchants exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findActive();
      expect(result).toEqual([]);
    });

    it('should order active merchants by name ascending', async () => {
      const merchants = [
        { id: 1, name: 'Alpha Merchant', isActive: true },
        { id: 2, name: 'Beta Merchant', isActive: true },
      ];
      mockRepository.find.mockResolvedValue(merchants);

      await service.findActive();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        select: expect.any(Object),
        order: { name: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('should return a merchant by id', async () => {
      const merchant = {
        id: 1,
        name: 'Merchant 1',
        email: 'merchant1@example.com',
        phone: '1234567890',
        address: '123 Main St',
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(merchant);

      const result = await service.findById(1);
      expect(result).toEqual(merchant);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
    });

    it('should return null when merchant not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a merchant by name', async () => {
      const merchant = {
        id: 1,
        name: 'Merchant 1',
        email: 'merchant1@example.com',
      };
      mockRepository.findOne.mockResolvedValue(merchant);

      const result = await service.findByName('Merchant 1');
      expect(result).toEqual(merchant);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Merchant 1' },
      });
    });

    it('should return null when merchant not found by name', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByName('Nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a merchant by email', async () => {
      const merchant = {
        id: 1,
        name: 'Merchant 1',
        email: 'merchant1@example.com',
      };
      mockRepository.findOne.mockResolvedValue(merchant);

      const result = await service.findByEmail('merchant1@example.com');
      expect(result).toEqual(merchant);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'merchant1@example.com' },
      });
    });

    it('should return null when merchant not found by email', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new merchant', async () => {
      const createDto = {
        name: 'New Merchant',
        email: 'newmerchant@example.com',
        phone: '1234567890',
        address: '789 Elm St',
        city: 'New York',
        country: 'USA',
        zipCode: '10001',
        businessLicense: 'BL-00001',
      };

      const createdMerchant = { id: 1, ...createDto, isActive: true };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdMerchant);
      mockRepository.save.mockResolvedValue(createdMerchant);

      const result = await service.create(createDto);
      expect(result).toEqual(createdMerchant);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: createDto.name,
        email: createDto.email,
        phone: createDto.phone,
        address: createDto.address,
        city: createDto.city,
        country: createDto.country,
        zipCode: createDto.zipCode,
        businessLicense: createDto.businessLicense,
        isActive: true,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdMerchant);
    });

    it('should throw error if merchant with same name already exists', async () => {
      const createDto = {
        name: 'Existing Merchant',
        email: 'existing@example.com',
        phone: '1234567890',
        address: '123 Main St',
      };

      mockRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Existing Merchant',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        'Merchant with this name already exists',
      );
    });

    it('should throw error if merchant with same email already exists', async () => {
      const createDto = {
        name: 'New Merchant',
        email: 'existing@example.com',
        phone: '1234567890',
        address: '123 Main St',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(null) // findByName returns null
        .mockResolvedValueOnce({ id: 1, email: 'existing@example.com' }); // findByEmail returns existing

      await expect(service.create(createDto)).rejects.toThrow(
        'Merchant with this email already exists',
      );
    });

    it('should create merchant with optional fields', async () => {
      const createDto = {
        name: 'Simple Merchant',
        email: 'simple@example.com',
        phone: '1234567890',
        address: '123 Main St',
      };

      const createdMerchant = { id: 1, ...createDto, isActive: true };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdMerchant);
      mockRepository.save.mockResolvedValue(createdMerchant);

      const result = await service.create(createDto);
      expect(result).toEqual(createdMerchant);
    });
  });

  describe('update', () => {
    it('should update a merchant', async () => {
      const existingMerchant = {
        id: 1,
        name: 'Merchant 1',
        email: 'merchant1@example.com',
        phone: '1234567890',
        address: '123 Main St',
        isActive: true,
      };

      const updateDto = {
        phone: '0987654321',
        address: '456 Oak Ave',
      };

      const updatedMerchant = { ...existingMerchant, ...updateDto };
      mockRepository.findOne.mockResolvedValue(existingMerchant);
      mockRepository.save.mockResolvedValue(updatedMerchant);

      const result = await service.update(1, updateDto);
      expect(result).toEqual(updatedMerchant);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updatedMerchant),
      );
    });

    it('should throw NotFoundException if merchant not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { phone: '0987654321' })).rejects.toThrow(
        'Merchant with ID 999 not found',
      );
    });

    it('should throw error if updating to a name that already exists', async () => {
      const existingMerchant = {
        id: 1,
        name: 'Merchant 1',
        email: 'merchant1@example.com',
      };

      const updateDto = {
        name: 'Merchant 2',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingMerchant)
        .mockResolvedValueOnce({ id: 2, name: 'Merchant 2' });

      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Merchant with this name already exists',
      );
    });

    it('should throw error if updating to an email that already exists', async () => {
      const existingMerchant = {
        id: 1,
        name: 'Merchant 1',
        email: 'merchant1@example.com',
      };

      const updateDto = {
        email: 'merchant2@example.com',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingMerchant) // findById
        .mockResolvedValueOnce({ id: 2, email: 'merchant2@example.com' }); // findByEmail - email already exists

      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Merchant with this email already exists',
      );
    });

    it('should allow updating name if new name does not exist', async () => {
      const existingMerchant = {
        id: 1,
        name: 'Merchant 1',
        email: 'merchant1@example.com',
      };

      const updateDto = {
        name: 'Updated Merchant',
      };

      const updatedMerchant = { ...existingMerchant, ...updateDto };
      jest.resetAllMocks();
      mockRepository.findOne
        .mockResolvedValueOnce(existingMerchant)
        .mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValue(updatedMerchant);

      const result = await service.update(1, updateDto);
      expect(result).toEqual(updatedMerchant);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a merchant', async () => {
      const merchant = { id: 1, name: 'Merchant 1' };
      mockRepository.findOne.mockResolvedValueOnce(merchant);
      mockRepository.softDelete.mockResolvedValue({} as any);

      await service.softDelete(1);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if merchant not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.softDelete(999)).rejects.toThrow(
        'Merchant with ID 999 not found',
      );
    });
  });
});
