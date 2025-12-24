import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
  ) {}

  async create(createMerchantDto: CreateMerchantDto): Promise<Merchant> {
    // Check if email already exists
    const existingMerchant = await this.merchantsRepository.findOne({
      where: { email: createMerchantDto.email },
    });

    if (existingMerchant) {
      throw new ConflictException('Merchant with this email already exists');
    }

    const merchant = this.merchantsRepository.create(createMerchantDto);
    return await this.merchantsRepository.save(merchant);
  }

  async findAll(): Promise<Merchant[]> {
    return await this.merchantsRepository.find();
  }

  async findOne(id: string): Promise<Merchant> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });

    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }

    return merchant;
  }

  async findActiveWithReports(): Promise<Merchant[]> {
    return await this.merchantsRepository.find({
      where: {
        isActive: true,
        receiveReports: true,
      },
    });
  }

  async update(id: string, updateMerchantDto: UpdateMerchantDto): Promise<Merchant> {
    const merchant = await this.findOne(id);

    // Check if email is being updated and if it already exists
    if (updateMerchantDto.email && updateMerchantDto.email !== merchant.email) {
      const existingMerchant = await this.merchantsRepository.findOne({
        where: { email: updateMerchantDto.email },
      });

      if (existingMerchant) {
        throw new ConflictException('Merchant with this email already exists');
      }
    }

    Object.assign(merchant, updateMerchantDto);
    return await this.merchantsRepository.save(merchant);
  }

  async remove(id: string): Promise<void> {
    const merchant = await this.findOne(id);
    await this.merchantsRepository.remove(merchant);
  }

  async count(): Promise<number> {
    return await this.merchantsRepository.count();
  }
}
