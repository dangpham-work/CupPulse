import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function ctx(role: string | undefined, required: string[] | undefined): [RolesGuard, ExecutionContext] {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(required) } as unknown as Reflector;
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { id: 'u1', role } : undefined }) }),
  } as unknown as ExecutionContext;
  return [new RolesGuard(reflector), context];
}

describe('RolesGuard (UNIT – FR-11, AC-11.2, AC-11.3)', () => {
  it('cho qua khi route không yêu cầu vai trò', () => {
    const [guard, context] = ctx('CUSTOMER', undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('CUSTOMER bị 403 trên route STAFF', () => {
    const [guard, context] = ctx('CUSTOMER', ['STAFF']);
    expect(() => guard.canActivate(context)).toThrow(expect.objectContaining({ status: 403 }));
  });

  it('STAFF bị 403 trên route MANAGER', () => {
    const [guard, context] = ctx('STAFF', ['MANAGER']);
    expect(() => guard.canActivate(context)).toThrow(expect.objectContaining({ status: 403 }));
  });

  it('MANAGER gọi được route STAFF', () => {
    const [guard, context] = ctx('MANAGER', ['STAFF']);
    expect(guard.canActivate(context)).toBe(true);
  });
});
