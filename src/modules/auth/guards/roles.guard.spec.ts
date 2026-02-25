import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: { role: UserRole }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: UserRole.PLAYER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when roles list is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockContext({ role: UserRole.PLAYER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.CLUB_ADMIN]);
    const context = createMockContext({ role: UserRole.CLUB_ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.CLUB_ADMIN]);
    const context = createMockContext({ role: UserRole.PLAYER });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when there is no user in the request', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.CLUB_ADMIN]);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access when user has one of multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.PLAYER,
      UserRole.CLUB_ADMIN,
    ]);
    const context = createMockContext({ role: UserRole.PLAYER });

    expect(guard.canActivate(context)).toBe(true);
  });
});
