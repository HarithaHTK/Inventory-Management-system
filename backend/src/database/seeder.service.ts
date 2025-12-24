import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import * as bcrypt from 'bcrypt';

const defaultRoles: Array<Partial<Role>> = [
  {
    alias: 'viewer',
    name: 'Viewer',
    description: 'Read-only access.',
  },
  {
    alias: 'manager',
    name: 'Manager',
    description: 'Can manage limited resources.',
  },
  {
    alias: 'admin',
    name: 'Administrator',
    description: 'Full access to administrative features.',
  },
];

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      console.log('Running automatic database seeding...');
      await this.seedDefaultRoles();
      await this.seedDefaultAdminUser();
      await this.seedDefaultMerchants();
      console.log('Database seeding completed successfully');
    } catch (error) {
      console.error('Error during database seeding:', error);
      // Don't throw - allow application to continue, but log the error
    }
  }

  private async seedDefaultRoles(): Promise<void> {
    const roleRepository = this.dataSource.getRepository(Role);

    for (const roleData of defaultRoles) {
      const existing = await roleRepository.findOne({
        where: { alias: roleData.alias },
      });

      if (existing) {
        console.log(`✓ Role '${roleData.alias}' already exists`);
        continue;
      }

      const role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`✓ Created role '${roleData.alias}'`);
    }
  }

  private async seedDefaultAdminUser(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);
    const roleRepository = this.dataSource.getRepository(Role);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin' },
    });

    if (existingAdmin) {
      console.log(`✓ Default admin user already exists`);
      return;
    }

    // Get admin role
    const adminRole = await roleRepository.findOne({
      where: { alias: 'admin' },
    });

    if (!adminRole) {
      console.warn('Admin role not found; skipping admin user creation');
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin', 10);
    const adminUser = userRepository.create({
      username: 'admin',
      email: 'admin@admin.com',
      password: hashedPassword,
      role: adminRole,
    });

    await userRepository.save(adminUser);
    console.log(`✓ Created default admin user`);
  }

  private async seedDefaultMerchants(): Promise<void> {
    const merchantRepository = this.dataSource.getRepository(Merchant);

    // Check if merchants already exist
    const existingCount = await merchantRepository.count();
    if (existingCount > 0) {
      console.log(`✓ Merchants already exist (${existingCount} found)`);
      return;
    }

    const merchants: Partial<Merchant>[] = [];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    const countries = ['USA', 'Canada', 'Mexico'];

    // Generate 100 merchants
    for (let i = 1; i <= 100; i++) {
      const cityIndex = (i - 1) % cities.length;
      const countryIndex = Math.floor((i - 1) / cities.length) % countries.length;

      merchants.push({
        name: `Merchant ${i}`,
        email: `merchant${i}@example.com`,
        phone: `${Math.floor(100000000 + Math.random() * 900000000)}`,
        address: `${i} Main Street`,
        city: cities[cityIndex],
        country: countries[countryIndex],
        zipCode: `${10000 + i}`,
        businessLicense: `BL-${String(i).padStart(5, '0')}`,
        isActive: true,
      });
    }

    // Insert all merchants
    for (const merchantData of merchants) {
      const merchant = merchantRepository.create(merchantData);
      await merchantRepository.save(merchant);
    }

    console.log(`✓ Created 100 default merchants`);
  }
}
