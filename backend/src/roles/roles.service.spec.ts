import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from '../users/entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';

describe('RolesService', () => {
  let service: RolesService;
  let repository: Repository<Role>;

  const mockRole: Role = {
    alias: 'admin',
    name: 'Administrator',
    description: 'Admin role',
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRolesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRolesRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    repository = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto: CreateRoleDto = {
        alias: 'admin',
        name: 'Administrator',
        description: 'Admin role',
      };

      mockRolesRepository.findOne.mockResolvedValue(null);
      mockRolesRepository.create.mockReturnValue(mockRole);
      mockRolesRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(createRoleDto);

      expect(mockRolesRepository.findOne).toHaveBeenCalledWith({
        where: { alias: 'admin' },
      });
      expect(mockRolesRepository.create).toHaveBeenCalledWith(createRoleDto);
      expect(mockRolesRepository.save).toHaveBeenCalledWith(mockRole);
      expect(result).toEqual(mockRole);
    });

    it('should throw BadRequestException if role already exists', async () => {
      const createRoleDto: CreateRoleDto = {
        alias: 'admin',
        name: 'Administrator',
        description: 'Admin role',
      };

      mockRolesRepository.findOne.mockResolvedValue(mockRole);

      await expect(service.create(createRoleDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRolesRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const roles = [mockRole];
      mockRolesRepository.find.mockResolvedValue(roles);

      const result = await service.findAll();

      expect(mockRolesRepository.find).toHaveBeenCalledWith({
        relations: ['users'],
      });
      expect(result).toEqual(roles);
    });

    it('should return empty array if no roles exist', async () => {
      mockRolesRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a role by alias', async () => {
      mockRolesRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne('admin');

      expect(mockRolesRepository.findOne).toHaveBeenCalledWith({
        where: { alias: 'admin' },
        relations: ['users'],
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockRolesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updateRoleDto: UpdateRoleDto = {
        name: 'Updated Admin',
        description: 'Updated description',
      };

      const updatedRole = { ...mockRole, ...updateRoleDto };
      mockRolesRepository.findOne.mockResolvedValue(mockRole);
      mockRolesRepository.save.mockResolvedValue(updatedRole);

      const result = await service.update('admin', updateRoleDto);

      expect(mockRolesRepository.save).toHaveBeenCalledWith(updatedRole);
      expect(result.name).toEqual('Updated Admin');
    });

    it('should throw NotFoundException if role does not exist', async () => {
      const updateRoleDto: UpdateRoleDto = {
        name: 'Updated Admin',
      };

      mockRolesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateRoleDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if new alias already exists', async () => {
      const updateRoleDto: UpdateRoleDto = {
        alias: 'user',
      };

      const existingRole = { ...mockRole, alias: 'user' };
      mockRolesRepository.findOne
        .mockResolvedValueOnce(mockRole) // First call in findOne
        .mockResolvedValueOnce(existingRole); // Second call checking new alias

      await expect(
        service.update('admin', updateRoleDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a role', async () => {
      const roleWithoutUsers = { ...mockRole, users: [] };
      mockRolesRepository.findOne.mockResolvedValue(roleWithoutUsers);
      mockRolesRepository.remove.mockResolvedValue(roleWithoutUsers);

      const result = await service.remove('admin');

      expect(mockRolesRepository.remove).toHaveBeenCalledWith(roleWithoutUsers);
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw BadRequestException if role has users', async () => {
      const roleWithUsers = {
        ...mockRole,
        users: [{ id: 1, name: 'John' }],
      };
      mockRolesRepository.findOne.mockResolvedValue(roleWithUsers);

      await expect(service.remove('admin')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockRolesRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
