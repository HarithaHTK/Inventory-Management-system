export class CreateInventoryDto {
  name: string;
  description: string;
  quantity: number;
  price: number;
  sku?: string;
  category?: string;
}
