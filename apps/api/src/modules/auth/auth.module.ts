import { Global, Module } from '@nestjs/common';
import { loadEnv } from '../../config/env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { JWT_CONFIG, TokenService, type JwtConfig } from './token.service';

/** Global để module khác dùng JwtAuthGuard/RolesGuard mà không phải import lại. */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: JWT_CONFIG,
      useFactory: (): JwtConfig => {
        const env = loadEnv();
        return { secret: env.JWT_SECRET, expiresInSeconds: env.JWT_EXPIRES_IN };
      },
    },
    { provide: TokenService, useFactory: (config: JwtConfig) => new TokenService(config), inject: [JWT_CONFIG] },
    AuthService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
