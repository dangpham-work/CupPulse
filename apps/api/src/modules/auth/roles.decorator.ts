import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AuthedRequest, AuthUser } from './jwt-auth.guard';
import type { RoleName } from './token.service';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user as AuthUser;
});
