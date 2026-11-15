import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException } from '../../common/app-exception';
import type { AuthedRequest } from './jwt-auth.guard';
import { ROLES_KEY } from './roles.decorator';
import type { RoleName } from './token.service';

/** MANAGER làm được mọi việc của STAFF (AC-11.3). Dùng sau JwtAuthGuard. */
const IMPLIES: Record<RoleName, RoleName[]> = {
  CUSTOMER: ['CUSTOMER'],
  STAFF: ['STAFF'],
  MANAGER: ['MANAGER', 'STAFF'],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleName[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user || !required.some((r) => IMPLIES[user.role].includes(r))) {
      throw new AppException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này', HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
