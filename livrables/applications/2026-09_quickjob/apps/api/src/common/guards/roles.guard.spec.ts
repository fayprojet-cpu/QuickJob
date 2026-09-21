import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserStatus } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function buildContext(user: { roles: UserRole[] } | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows access when no roles are required', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext(undefined))).toBe(true);
  });

  it('throws ForbiddenException — e.g. POST /jobs without the RECRUITER role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.RECRUITER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const workerOnly = { id: 'user-1', roles: [UserRole.WORKER], status: UserStatus.ACTIVE };

    expect(() => guard.canActivate(buildContext(workerOnly))).toThrow(ForbiddenException);
  });

  it('allows access when the user has the required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.RECRUITER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const recruiter = { id: 'user-1', roles: [UserRole.RECRUITER], status: UserStatus.ACTIVE };

    expect(guard.canActivate(buildContext(recruiter))).toBe(true);
  });

  it('allows access for a dual-role account (WORKER + RECRUITER)', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.RECRUITER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const dualRole = {
      id: 'user-1',
      roles: [UserRole.WORKER, UserRole.RECRUITER],
      status: UserStatus.ACTIVE,
    };

    expect(guard.canActivate(buildContext(dualRole))).toBe(true);
  });
});
