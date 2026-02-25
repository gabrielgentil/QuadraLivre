import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { User, UserRole } from '../../users/entities/user.entity';

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

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(() => {
    authService = {
      validateLocalUser: jest.fn(),
    };

    strategy = new LocalStrategy(authService as AuthService);
  });

  it('should return the user when credentials are valid', async () => {
    authService.validateLocalUser!.mockResolvedValue(mockUser);

    const result = await strategy.validate('joao@email.com', 'Senha@123');

    expect(authService.validateLocalUser).toHaveBeenCalledWith(
      'joao@email.com',
      'Senha@123',
    );
    expect(result).toEqual(mockUser);
  });

  it('should throw UnauthorizedException when credentials are invalid', async () => {
    authService.validateLocalUser!.mockResolvedValue(null);

    await expect(
      strategy.validate('joao@email.com', 'wrong-password'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
