import { IsString, IsOptional, IsArray, ArrayMinSize, IsNumber } from 'class-validator';

export class CreateReportDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  inventoryItemIds: number[];
}
