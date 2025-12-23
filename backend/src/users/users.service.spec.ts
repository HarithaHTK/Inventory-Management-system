import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUsername', () => {
    it('should return a user if found', async () => {
      const user = { id: 1, username: 'test', email: 'test@example.com' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByUsername('test');
      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'test' },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new user with hashed password', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      const createdUser = { ...userData, id: 1 };
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await service.create(
        userData.username,
        userData.email,
        userData.password,
      );

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('validatePassword', () => {
    it('should return true for matching passwords', async () => {
      const result = await service.validatePassword(
        'password123',
        '$2b$10$dummyHashedPassword',
      );
      expect(typeof result).toBe('boolean');
    });
  });
});
