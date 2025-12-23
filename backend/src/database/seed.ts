import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { seedUsers } from './seeds/user.seed';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User],
  synchronize: true,
});

async function runSeeder() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    console.log('Running user seed...');
    await seedUsers(AppDataSource);

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
