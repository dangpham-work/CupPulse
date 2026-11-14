import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

export const JWT_CONFIG = Symbol('JWT_CONFIG');

export interface JwtConfig {
  secret: string;
  expiresInSeconds: number;
}

export type RoleName = 'CUSTOMER' | 'STAFF' | 'MANAGER';

export interface TokenClaims {
  sub: string;
  role: RoleName;
}

/** Ký và kiểm tra JWT HS256 (ADR-006). Chỉ chấp nhận HS256 nên token alg=none bị loại. */
@Injectable()
export class TokenService {
  constructor(private readonly config: JwtConfig) {}

  get expiresIn(): number {
    return this.config.expiresInSeconds;
  }

  sign(claims: TokenClaims): string {
    return jwt.sign({ role: claims.role }, this.config.secret, {
      algorithm: 'HS256',
      subject: claims.sub,
      expiresIn: this.config.expiresInSeconds,
    });
  }

  verify(token: string): TokenClaims | null {
    try {
      const payload = jwt.verify(token, this.config.secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || typeof payload.sub !== 'string') return null;
      const role = payload.role;
      if (role !== 'CUSTOMER' && role !== 'STAFF' && role !== 'MANAGER') return null;
      return { sub: payload.sub, role };
    } catch {
      return null;
    }
  }
}
