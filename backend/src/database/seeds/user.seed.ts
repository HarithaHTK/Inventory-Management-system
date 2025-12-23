import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Check if user already exists
  const existingUser = await userRepository.findOne({
    where: { username: 'admin' },
  });

  if (existingUser) {
    console.log('Admin user already exists, skipping seed');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = userRepository.create({
    username: 'admin',
    email: 'admin@example.com',
    password: hashedPassword,
  });

  await userRepository.save(adminUser);
  console.log('Admin user created successfully');
  console.log('Username: admin');
  console.log('Password: admin123');
}
