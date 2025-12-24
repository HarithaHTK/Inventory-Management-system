import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../users/entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.rolesRepository.findOne({
      where: { alias: createRoleDto.alias },
    });

    if (existingRole) {
      throw new BadRequestException(`Role with alias '${createRoleDto.alias}' already exists`);
    }

    const role = this.rolesRepository.create(createRoleDto);
    return this.rolesRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find({
      relations: ['users'],
    });
  }

  async findOne(alias: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { alias },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException(`Role with alias '${alias}' not found`);
    }

    return role;
  }

  async update(alias: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(alias);

    // Check if new alias already exists
    if (updateRoleDto.alias && updateRoleDto.alias !== alias) {
      const existingRole = await this.rolesRepository.findOne({
        where: { alias: updateRoleDto.alias },
      });

      if (existingRole) {
        throw new BadRequestException(
          `Role with alias '${updateRoleDto.alias}' already exists`,
        );
      }
    }

    Object.assign(role, updateRoleDto);
    return this.rolesRepository.save(role);
  }

  async remove(alias: string): Promise<{ message: string }> {
    const role = await this.findOne(alias);

    // Check if role has users
    if (role.users && role.users.length > 0) {
      throw new BadRequestException(
        `Cannot delete role '${alias}' because it has ${role.users.length} assigned user(s)`,
      );
    }

    await this.rolesRepository.remove(role);
    return { message: `Role '${alias}' deleted successfully` };
  }
}
