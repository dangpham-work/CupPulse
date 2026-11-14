import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppException } from '../../common/app-exception';
import { TokenService, type RoleName } from './token.service';

export interface AuthUser {
  id: string;
  role: RoleName;
}

export type AuthedRequest = Request & { user?: AuthUser };

/** Yêu cầu header Authorization: Bearer <JWT> hợp lệ (AC-10.3). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    const claims = scheme === 'Bearer' && token ? this.tokens.verify(token) : null;
    if (!claims) {
      throw new AppException('UNAUTHORIZED', 'Cần đăng nhập để thực hiện thao tác này', HttpStatus.UNAUTHORIZED);
    }
    req.user = { id: claims.sub, role: claims.role };
    return true;
  }
}
