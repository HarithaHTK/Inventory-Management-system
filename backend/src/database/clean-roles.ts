import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

const allowedRoles = ['viewer', 'manager', 'admin'];

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'inventory_db',
  entities: [Role, User],
  synchronize: false,
});

async function cleanRoles() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const roleRepository = AppDataSource.getRepository(Role);

    // Get all roles
    const allRoles = await roleRepository.find();
    console.log(`Found ${allRoles.length} roles in database`);

    // Find roles that should be deleted
    const rolesToDelete = allRoles.filter(
      (role) => !allowedRoles.includes(role.alias)
    );

    if (rolesToDelete.length === 0) {
      console.log('No extra roles found. Database is clean!');
    } else {
      console.log(`Found ${rolesToDelete.length} roles to delete:`);
      rolesToDelete.forEach((role) => {
        console.log(`  - ${role.alias} (${role.name})`);
      });

      // Delete extra roles
      for (const role of rolesToDelete) {
        await roleRepository.remove(role);
        console.log(`Deleted role: ${role.alias}`);
      }
    }

    // Display remaining roles
    const remainingRoles = await roleRepository.find();
    console.log('\nRemaining roles in database:');
    remainingRoles.forEach((role) => {
      console.log(`  - ${role.alias}: ${role.name}`);
    });

    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error cleaning roles:', error);
    process.exit(1);
  }
}

cleanRoles();
