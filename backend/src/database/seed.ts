import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { seedUsers } from './seeds/user.seed';
import { seedRoles } from './seeds/role.seed';
import { seedMerchants } from './seeds/merchant.seed';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Role, Merchant, Inventory],
  synchronize: true,
});

async function backfillUsersToAdminRole(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);
  const adminRole = await roleRepository.findOne({ where: { alias: 'admin' } });

  if (!adminRole) {
    console.warn('Admin role not found; skipping backfill.');
    return;
  }

  const result: any = await dataSource.query(
    'UPDATE users SET roleAlias = ? WHERE roleAlias IS NULL',
    [adminRole.alias],
  );

  const affected = result?.affectedRows ?? result?.changedRows ?? 0;
  console.log(`Backfilled ${affected} existing users to admin role.`);
}

async function runSeeder() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    console.log('Running role seed...');
    await seedRoles(AppDataSource);

    console.log(
      'Backfilling existing users to admin role (null roleAlias only)...',
    );
    await backfillUsersToAdminRole(AppDataSource);

    console.log('Running user seed...');
    await seedUsers(AppDataSource);

    console.log('Running merchant seed...');
    await seedMerchants(AppDataSource);

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Error running seeds:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeder()
  .then(() => {
    console.log('Seeder finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeder failed:', error);
    process.exit(1);
  });
