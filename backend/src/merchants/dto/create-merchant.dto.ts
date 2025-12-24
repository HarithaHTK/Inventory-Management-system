import { IsEmail, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateMerchantDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  companyName?: string;

  @IsOptional()
  @IsBoolean()
  receiveReports?: boolean;
}
