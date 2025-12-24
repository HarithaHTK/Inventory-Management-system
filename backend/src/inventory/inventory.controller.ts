import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto } from './dto';

@Controller('inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getAllInventory() {
    const items = await this.inventoryService.findAll();
    return {
      message: 'Inventory items retrieved successfully',
      data: items,
    };
  }

  @Get(':id')
  async getInventoryById(@Param('id') id: string) {
    const item = await this.inventoryService.findById(+id);
    if (!item) {
      return {
        message: 'Inventory item not found',
        data: null,
      };
    }
    return {
      message: 'Inventory item retrieved successfully',
      data: item,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInventory(@Body() createInventoryDto: CreateInventoryDto) {
    const item = await this.inventoryService.create(createInventoryDto);
    return {
      message: 'Inventory item created successfully',
      data: item,
    };
  }

  @Patch(':id')
  async updateInventory(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    try {
      const item = await this.inventoryService.update(+id, updateInventoryDto);
      return {
        message: 'Inventory item updated successfully',
        data: item,
      };
    } catch (error) {
      if (error.message?.includes('not found')) {
        throw error;
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventory(@Param('id') id: string) {
    await this.inventoryService.softDelete(+id);
  }
}
