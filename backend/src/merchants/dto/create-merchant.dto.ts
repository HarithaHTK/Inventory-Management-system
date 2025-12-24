export class CreateMerchantDto {
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  country?: string;
  zipCode?: string;
  businessLicense?: string;
  isActive?: boolean;
}
