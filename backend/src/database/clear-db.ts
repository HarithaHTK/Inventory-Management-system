import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'inventory_db',
  entities: [Role, User, Merchant, Inventory],
  synchronize: false,
});

async function clearDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();

    try {
      console.log('Dropping all tables...');

      // Drop tables in correct order (foreign key dependencies)
      await queryRunner.query('DROP TABLE IF EXISTS `inventory`');
      console.log('✓ Dropped inventory table');

      await queryRunner.query('DROP TABLE IF EXISTS `merchants`');
      console.log('✓ Dropped merchants table');

      await queryRunner.query('DROP TABLE IF EXISTS `users`');
      console.log('✓ Dropped users table');

      await queryRunner.query('DROP TABLE IF EXISTS `roles`');
      console.log('✓ Dropped roles table');

      await queryRunner.query('DROP TABLE IF EXISTS `typeorm_metadata`');
      console.log('✓ Dropped typeorm_metadata table');

      console.log('\n✅ Database cleared successfully! All tables deleted.');
      console.log('Ready to start fresh with npm run start:dev');
    } finally {
      await queryRunner.release();
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
