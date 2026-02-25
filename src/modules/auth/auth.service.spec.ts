import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';

jest.mock('bcrypt');

const mockUser: User = {
  id: 'user-uuid-1',
  name: 'João Silva',
  email: 'joao@email.com',
  password: 'hashed-password',
  phone: '11999999999',
  role: UserRole.CLUB_ADMIN,
  googleId: null as unknown as string,
  avatarUrl: null as unknown as string,
  refreshToken: 'hashed-refresh-token',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGoogleUser: User = {
  ...mockUser,
  id: 'user-uuid-2',
  name: 'Maria Google',
  email: 'maria@gmail.com',
  password: null as unknown as string,
  role: UserRole.PLAYER,
  googleId: 'google-id-123',
  avatarUrl: 'https://photo.url',
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    (configService.getOrThrow as jest.Mock).mockReturnValue('test-secret');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    const dto = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'Senha@123',
      phone: '11999999999',
    };

    it('should register a new club_admin and return tokens', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue(mockUser);
      usersService.update!.mockResolvedValue(mockUser);

      const result = await service.register(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          role: UserRole.CLUB_ADMIN,
        }),
      );
      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('refreshToken');
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should use provided role when specified', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue({
        ...mockUser,
        role: UserRole.PLAYER,
      });
      usersService.update!.mockResolvedValue(mockUser);

      await service.register({ ...dto, role: UserRole.PLAYER });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.PLAYER }),
      );
    });
  });

  describe('validateLocalUser', () => {
    it('should return user when credentials are valid', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateLocalUser(
        'joao@email.com',
        'Senha@123',
      );

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      const result = await service.validateLocalUser(
        'unknown@email.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null when user has no password (OAuth-only)', async () => {
      usersService.findByEmail!.mockResolvedValue({
        ...mockUser,
        password: null as unknown as string,
      });

      const result = await service.validateLocalUser(
        'joao@email.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateLocalUser(
        'joao@email.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return user with tokens', async () => {
      usersService.update!.mockResolvedValue(mockUser);

      const result = await service.login(mockUser);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('googleLogin', () => {
    const profile = {
      googleId: 'google-id-123',
      email: 'maria@gmail.com',
      name: 'Maria Google',
      avatarUrl: 'https://photo.url',
    };

    it('should login existing Google user', async () => {
      usersService.findByGoogleId!.mockResolvedValue(mockGoogleUser);
      usersService.update!.mockResolvedValue(mockGoogleUser);

      const result = await service.googleLogin(profile);

      expect(usersService.findByGoogleId).toHaveBeenCalledWith(
        profile.googleId,
      );
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
    });

    it('should link Google to existing email user', async () => {
      usersService.findByGoogleId!.mockResolvedValue(null);
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.update!.mockResolvedValue({
        ...mockUser,
        googleId: profile.googleId,
      });

      const result = await service.googleLogin(profile);

      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ googleId: profile.googleId }),
      );
      expect(result).toHaveProperty('accessToken');
    });

    it('should create a new player when no existing user', async () => {
      usersService.findByGoogleId!.mockResolvedValue(null);
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue(mockGoogleUser);
      usersService.update!.mockResolvedValue(mockGoogleUser);

      const result = await service.googleLogin(profile);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: profile.googleId,
          role: UserRole.PLAYER,
        }),
      );
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when refresh token is valid', async () => {
      usersService.findOne!.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.update!.mockResolvedValue(mockUser);

      const result = await service.refreshTokens('user-uuid-1', 'valid-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw when user has no refresh token stored', async () => {
      usersService.findOne!.mockResolvedValue({
        ...mockUser,
        refreshToken: null as unknown as string,
      });

      await expect(
        service.refreshTokens('user-uuid-1', 'some-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when refresh token does not match', async () => {
      usersService.findOne!.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.refreshTokens('user-uuid-1', 'wrong-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear the refresh token', async () => {
      usersService.update!.mockResolvedValue(mockUser);

      const result = await service.logout('user-uuid-1');

      expect(usersService.update).toHaveBeenCalledWith('user-uuid-1', {
        refreshToken: undefined,
      });
      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
    });
  });
});
