import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Report } from './entities/report.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async create(createReportDto: CreateReportDto): Promise<Report> {
    const { title, description, inventoryItemIds } = createReportDto;

    // Validate that all inventory items exist
    const inventoryItems = await this.inventoryRepository.find({
      where: { id: In(inventoryItemIds) },
    });

    if (inventoryItems.length !== inventoryItemIds.length) {
      throw new BadRequestException('One or more inventory items not found');
    }

    const report = this.reportRepository.create({
      title,
      description,
      inventoryItems,
    });

    return await this.reportRepository.save(report);
  }

  async findAll(): Promise<Report[]> {
    return await this.reportRepository.find({
      relations: ['inventoryItems'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['inventoryItems'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async update(id: number, updateReportDto: UpdateReportDto): Promise<Report> {
    const report = await this.findOne(id);

    const { title, description, inventoryItemIds } = updateReportDto;

    if (title !== undefined) {
      report.title = title;
    }

    if (description !== undefined) {
      report.description = description;
    }

    if (inventoryItemIds !== undefined) {
      // Validate that all inventory items exist
      const inventoryItems = await this.inventoryRepository.find({
        where: { id: In(inventoryItemIds) },
      });

      if (inventoryItems.length !== inventoryItemIds.length) {
        throw new BadRequestException('One or more inventory items not found');
      }

      report.inventoryItems = inventoryItems;
    }

    return await this.reportRepository.save(report);
  }

  async remove(id: number): Promise<void> {
    const report = await this.findOne(id);
    await this.reportRepository.softDelete(id);
  }
}
