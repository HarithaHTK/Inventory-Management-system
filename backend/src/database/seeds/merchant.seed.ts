import { DataSource } from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';

export const seedMerchants = async (dataSource: DataSource) => {
  const merchantRepository = dataSource.getRepository(Merchant);

  // Check if merchants already exist
  const existingCount = await merchantRepository.count();
  if (existingCount > 0) {
    console.log('Merchants already seeded, skipping...');
    return;
  }

  const sampleMerchants = [
    {
      name: 'John Smith',
      email: 'john.smith@example.com',
      companyName: 'Smith Trading Co.',
      isActive: true,
      receiveReports: true,
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      companyName: 'Johnson Enterprises',
      isActive: true,
      receiveReports: true,
    },
    {
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      companyName: 'Brown Industries',
      isActive: true,
      receiveReports: true,
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      companyName: 'Davis Corp',
      isActive: true,
      receiveReports: false, // Opted out
    },
    {
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      companyName: 'Wilson & Co.',
      isActive: false, // Inactive account
      receiveReports: true,
    },
  ];

  for (const merchantData of sampleMerchants) {
    const merchant = merchantRepository.create(merchantData);
    await merchantRepository.save(merchant);
  }

  console.log(`✓ Seeded ${sampleMerchants.length} sample merchants`);
};
