import { IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class UpdateMerchantDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  companyName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  receiveReports?: boolean;
}
