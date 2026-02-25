import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

const mockUser: User = {
  id: 'user-uuid-1',
  name: 'João Silva',
  email: 'joao@email.com',
  password: 'hashed-password',
  phone: '11999999999',
  role: UserRole.CLUB_ADMIN,
  googleId: null as unknown as string,
  avatarUrl: null as unknown as string,
  refreshToken: null as unknown as string,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create and save a user', async () => {
      const data = { name: 'João', email: 'joao@email.com' };
      repository.create!.mockReturnValue(mockUser);
      repository.save!.mockResolvedValue(mockUser);

      const result = await service.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      repository.find!.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findByEmail('joao@email.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'joao@email.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@email.com');

      expect(result).toBeNull();
    });
  });

  describe('findByGoogleId', () => {
    it('should return a user by Google ID', async () => {
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findByGoogleId('google-123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when Google ID not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findByGoogleId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const updateData = { name: 'João Atualizado' };
      repository.update!.mockResolvedValue({ affected: 1 });
      repository.findOne!.mockResolvedValue({ ...mockUser, ...updateData });

      const result = await service.update('user-uuid-1', updateData);

      expect(repository.update).toHaveBeenCalledWith(
        'user-uuid-1',
        updateData,
      );
      expect(result.name).toBe('João Atualizado');
    });

    it('should throw NotFoundException if user not found after update', async () => {
      repository.update!.mockResolvedValue({ affected: 0 });
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove the user', async () => {
      repository.findOne!.mockResolvedValue(mockUser);
      repository.remove!.mockResolvedValue(mockUser);

      await service.remove('user-uuid-1');

      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
