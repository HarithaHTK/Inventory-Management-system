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
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto, UpdateMerchantDto } from './dto';

@Controller('merchants')
@UseGuards(AuthGuard)
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get()
  async getAllMerchants() {
    const merchants = await this.merchantsService.findAll();
    return {
      message: 'Merchants retrieved successfully',
      data: merchants,
    };
  }

  @Get('active/list')
  async getActiveMerchants() {
    const merchants = await this.merchantsService.findActive();
    return {
      message: 'Active merchants retrieved successfully',
      data: merchants,
    };
  }

  @Get(':id')
  async getMerchantById(@Param('id') id: string) {
    const merchant = await this.merchantsService.findById(+id);
    if (!merchant) {
      return {
        message: 'Merchant not found',
        data: null,
      };
    }
    return {
      message: 'Merchant retrieved successfully',
      data: merchant,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMerchant(@Body() createMerchantDto: CreateMerchantDto) {
    const merchant = await this.merchantsService.create(createMerchantDto);
    return {
      message: 'Merchant created successfully',
      data: merchant,
    };
  }

  @Patch(':id')
  async updateMerchant(
    @Param('id') id: string,
    @Body() updateMerchantDto: UpdateMerchantDto,
  ) {
    try {
      const merchant = await this.merchantsService.update(+id, updateMerchantDto);
      return {
        message: 'Merchant updated successfully',
        data: merchant,
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
  async deleteMerchant(@Param('id') id: string) {
    await this.merchantsService.softDelete(+id);
  }
}
