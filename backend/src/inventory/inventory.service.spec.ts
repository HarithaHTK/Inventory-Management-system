import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { Repository } from 'typeorm';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: Repository<Inventory>;

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
        InventoryService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    repository = module.get<Repository<Inventory>>(
      getRepositoryToken(Inventory),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all inventory items', async () => {
      const items = [
        {
          id: 1,
          name: 'Item 1',
          description: 'Description 1',
          quantity: 10,
          price: 100,
        },
        {
          id: 2,
          name: 'Item 2',
          description: 'Description 2',
          quantity: 20,
          price: 200,
        },
      ];
      mockRepository.find.mockResolvedValue(items);

      const result = await service.findAll();
      expect(result).toEqual(items);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no items exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return an inventory item by id', async () => {
      const item = {
        id: 1,
        name: 'Item 1',
        description: 'Description 1',
        quantity: 10,
        price: 100,
      };
      mockRepository.findOne.mockResolvedValue(item);

      const result = await service.findById(1);
      expect(result).toEqual(item);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
    });

    it('should return null when item not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return an inventory item by name', async () => {
      const item = {
        id: 1,
        name: 'Item 1',
        description: 'Description 1',
      };
      mockRepository.findOne.mockResolvedValue(item);

      const result = await service.findByName('Item 1');
      expect(result).toEqual(item);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Item 1' },
      });
    });

    it('should return null when item not found by name', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByName('Nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new inventory item', async () => {
      const createDto = {
        name: 'New Item',
        description: 'New Description',
        quantity: 50,
        price: 500,
        sku: 'SKU001',
        category: 'Electronics',
      };

      const createdItem = { id: 1, ...createDto };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdItem);
      mockRepository.save.mockResolvedValue(createdItem);

      const result = await service.create(createDto);
      expect(result).toEqual(createdItem);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: createDto.name,
        description: createDto.description,
        quantity: createDto.quantity,
        price: createDto.price,
        sku: createDto.sku,
        category: createDto.category,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdItem);
    });

    it('should throw error if item with same name already exists', async () => {
      const createDto = {
        name: 'Existing Item',
        description: 'Description',
        quantity: 50,
        price: 500,
      };

      mockRepository.findOne.mockResolvedValue({ id: 1, name: 'Existing Item' });

      await expect(service.create(createDto)).rejects.toThrow(
        'Inventory item with this name already exists',
      );
    });

    it('should create item with optional fields', async () => {
      const createDto = {
        name: 'Simple Item',
        description: 'Simple Description',
        quantity: 10,
        price: 100,
      };

      const createdItem = { id: 1, ...createDto };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdItem);
      mockRepository.save.mockResolvedValue(createdItem);

      const result = await service.create(createDto);
      expect(result).toEqual(createdItem);
    });
  });

  describe('update', () => {
    it('should update an inventory item', async () => {
      const existingItem = {
        id: 1,
        name: 'Item 1',
        description: 'Description 1',
        quantity: 10,
        price: 100,
      };

      const updateDto = {
        quantity: 20,
        price: 150,
      };

      const updatedItem = { ...existingItem, ...updateDto };
      mockRepository.findOne.mockResolvedValue(existingItem);
      mockRepository.save.mockResolvedValue(updatedItem);

      const result = await service.update(1, updateDto);
      expect(result).toEqual(updatedItem);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updatedItem),
      );
    });

    it('should throw NotFoundException if item not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { quantity: 20 }),
      ).rejects.toThrow('Inventory item with ID 999 not found');
    });

    it('should throw error if updating to a name that already exists', async () => {
      const existingItem = {
        id: 1,
        name: 'Item 1',
        description: 'Description 1',
      };

      const updateDto = {
        name: 'Item 2',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingItem)
        .mockResolvedValueOnce({ id: 2, name: 'Item 2' });

      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Inventory item with this name already exists',
      );
    });

    it('should allow updating name if new name does not exist', async () => {
      const existingItem = {
        id: 1,
        name: 'Item 1',
        description: 'Description 1',
      };

      const updateDto = {
        name: 'Updated Item',
      };

      const updatedItem = { ...existingItem, ...updateDto };
      mockRepository.findOne
        .mockResolvedValueOnce(existingItem)
        .mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValue(updatedItem);

      const result = await service.update(1, updateDto);
      expect(result).toEqual(updatedItem);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an inventory item', async () => {
      const item = { id: 1, name: 'Item 1' };
      mockRepository.findOne.mockResolvedValue(item);
      mockRepository.softDelete.mockResolvedValue({} as any);

      await service.softDelete(1);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if item not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete(999)).rejects.toThrow(
        'Inventory item with ID 999 not found',
      );
    });
  });
});
