import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';

const mockUser: User = {
  id: 'user-uuid-1',
  name: 'João Silva',
  email: 'joao@email.com',
  password: 'hashed',
  phone: '11999999999',
  role: UserRole.CLUB_ADMIN,
  googleId: null as unknown as string,
  avatarUrl: null as unknown as string,
  refreshToken: null as unknown as string,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      googleLogin: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/register', () => {
    it('should register a user and return tokens', async () => {
      const dto = {
        name: 'João',
        email: 'joao@email.com',
        password: 'Senha@123',
      };
      const expected = { user: mockUser, ...mockTokens };
      authService.register!.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('POST /auth/login', () => {
    it('should login and return tokens', async () => {
      const expected = { user: mockUser, ...mockTokens };
      authService.login!.mockResolvedValue(expected);

      const result = await controller.login({ user: mockUser });

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /auth/google', () => {
    it('should exist as a route (guard handles redirect)', () => {
      expect(controller.googleAuth).toBeDefined();
      expect(controller.googleAuth()).toBeUndefined();
    });
  });

  describe('GET /auth/google/callback', () => {
    it('should handle Google callback and return tokens', async () => {
      const profile = {
        googleId: 'g-123',
        email: 'maria@gmail.com',
        name: 'Maria',
        avatarUrl: 'https://photo.url',
      };
      const expected = { user: mockUser, ...mockTokens };
      authService.googleLogin!.mockResolvedValue(expected);

      const result = await controller.googleCallback({ user: profile });

      expect(authService.googleLogin).toHaveBeenCalledWith(profile);
      expect(result).toEqual(expected);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new tokens', async () => {
      authService.refreshTokens!.mockResolvedValue(mockTokens);

      const result = await controller.refresh({
        id: 'user-uuid-1',
        refreshToken: 'old-refresh',
      });

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'user-uuid-1',
        'old-refresh',
      );
      expect(result).toEqual(mockTokens);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout the user', async () => {
      const expected = { message: 'Logout realizado com sucesso' };
      authService.logout!.mockResolvedValue(expected);

      const result = await controller.logout('user-uuid-1');

      expect(authService.logout).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /auth/me', () => {
    it('should return the current user', () => {
      const result = controller.getProfile(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
});
