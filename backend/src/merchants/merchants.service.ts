import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { CreateMerchantDto, UpdateMerchantDto } from './dto';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
  ) {}

  async findAll(): Promise<Merchant[]> {
    return this.merchantRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        zipCode: true,
        businessLicense: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findActive(): Promise<Merchant[]> {
    return this.merchantRepository.find({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        zipCode: true,
        businessLicense: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<Merchant | null> {
    return this.merchantRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        zipCode: true,
        businessLicense: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByName(name: string): Promise<Merchant | null> {
    return this.merchantRepository.findOne({
      where: { name },
    });
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    return this.merchantRepository.findOne({
      where: { email },
    });
  }

  async create(createMerchantDto: CreateMerchantDto): Promise<Merchant> {
    const {
      name,
      email,
      phone,
      address,
      city,
      country,
      zipCode,
      businessLicense,
      isActive = true,
    } = createMerchantDto;

    // Check if merchant with same name already exists
    const existingByName = await this.findByName(name);
    if (existingByName) {
      throw new Error('Merchant with this name already exists');
    }

    // Check if merchant with same email already exists
    const existingByEmail = await this.findByEmail(email);
    if (existingByEmail) {
      throw new Error('Merchant with this email already exists');
    }

    const merchant = this.merchantRepository.create({
      name,
      email,
      phone,
      address,
      city,
      country,
      zipCode,
      businessLicense,
      isActive,
    });

    return this.merchantRepository.save(merchant);
  }

  async update(
    id: number,
    updateMerchantDto: UpdateMerchantDto,
  ): Promise<Merchant> {
    const merchant = await this.findById(id);
    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }

    // Check if name is being updated and already exists
    if (
      updateMerchantDto.name &&
      updateMerchantDto.name !== merchant.name
    ) {
      const existingByName = await this.findByName(updateMerchantDto.name);
      if (existingByName) {
        throw new Error('Merchant with this name already exists');
      }
    }

    // Check if email is being updated and already exists
    if (
      updateMerchantDto.email &&
      updateMerchantDto.email !== merchant.email
    ) {
      const existingByEmail = await this.findByEmail(updateMerchantDto.email);
      if (existingByEmail) {
        throw new Error('Merchant with this email already exists');
      }
    }

    Object.assign(merchant, updateMerchantDto);
    return this.merchantRepository.save(merchant);
  }

  async softDelete(id: number): Promise<void> {
    const merchant = await this.findById(id);
    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }
    await this.merchantRepository.softDelete(id);
  }
}
