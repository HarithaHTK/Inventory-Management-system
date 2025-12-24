import { DataSource } from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';

const cities = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
];
const countries = [
  'USA',
  'Canada',
  'UK',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Australia',
  'Japan',
  'Brazil',
];

export async function seedMerchants(dataSource: DataSource) {
  const merchantRepository = dataSource.getRepository(Merchant);

  // Check if merchants already exist
  const existingCount = await merchantRepository.count();
  if (existingCount > 0) {
    console.log(`✓ Merchants already exist (${existingCount} found)`);
    return;
  }

  console.log('Creating 100 merchant records...');

  const merchants: Partial<Merchant>[] = [];

  for (let i = 1; i <= 100; i++) {
    const cityIndex = (i - 1) % cities.length;
    const countryIndex = (i - 1) % countries.length;

    merchants.push({
      name: `Merchant ${i}`,
      email: `merchant${i}@example.com`,
      phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
      address: `${100 + i} Main Street`,
      city: cities[cityIndex],
      country: countries[countryIndex],
      zipCode: String(10000 + i),
      businessLicense: `BL-${String(i).padStart(6, '0')}`,
      isActive: i % 10 !== 0, // Every 10th merchant is inactive
    });
  }

  await merchantRepository.save(merchants);
  console.log('✓ Created 100 merchant records');
}
