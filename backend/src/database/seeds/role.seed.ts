import { DataSource } from 'typeorm';
import { Role } from '../../users/entities/role.entity';

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

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);

  for (const roleData of defaultRoles) {
    const existing = await roleRepository.findOne({
      where: { alias: roleData.alias },
    });

    if (existing) {
      console.log(`Role ${roleData.alias} already exists, skipping`);
      continue;
    }

    const role = roleRepository.create(roleData);
    await roleRepository.save(role);
    console.log(`Role ${roleData.alias} created`);
  }
}
