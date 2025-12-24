import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { CreateInventoryDto, UpdateInventoryDto } from './dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      select: {
        id: true,
        name: true,
        description: true,
        quantity: true,
        price: true,
        sku: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: number): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        quantity: true,
        price: true,
        sku: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByName(name: string): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({
      where: { name },
    });
  }

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const { name, description, quantity, price, sku, category } =
      createInventoryDto;

    // Check if item with same name already exists
    const existingItem = await this.findByName(name);
    if (existingItem) {
      throw new Error('Inventory item with this name already exists');
    }

    const inventory = this.inventoryRepository.create({
      name,
      description,
      quantity,
      price,
      sku,
      category,
    });

    return this.inventoryRepository.save(inventory);
  }

  async update(
    id: number,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.findById(id);
    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    // Check if name is being updated and already exists
    if (
      updateInventoryDto.name &&
      updateInventoryDto.name !== inventory.name
    ) {
      const existingItem = await this.findByName(updateInventoryDto.name);
      if (existingItem) {
        throw new Error('Inventory item with this name already exists');
      }
    }

    Object.assign(inventory, updateInventoryDto);
    return this.inventoryRepository.save(inventory);
  }

  async softDelete(id: number): Promise<void> {
    const inventory = await this.findById(id);
    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    await this.inventoryRepository.softDelete(id);
  }
}
