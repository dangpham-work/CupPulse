import { HttpStatus, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService, type RoleName } from './token.service';

const BCRYPT_COST = 12; // ADR-006

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
}

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
  user: PublicUser;
}

/** Băm giả để so sánh khi email không tồn tại, giữ thời gian phản hồi gần nhau (AC-10.2). */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5y1sK5q4Z2h1v3Yv8m1m0u3nQ6n4d0yaaaaaaaa';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  /** FR-09 */
  async register(dto: RegisterDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await hash(dto.password, BCRYPT_COST);
    try {
      const user = await this.prisma.user.create({
        data: { email, passwordHash, fullName: dto.fullName.trim(), phone: dto.phone ?? null },
      });
      return toPublic(user);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new AppException('EMAIL_TAKEN', 'Email đã được đăng ký', HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  /** FR-10 */
  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    const ok = await compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      throw new AppException('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng', HttpStatus.UNAUTHORIZED);
    }
    return {
      accessToken: this.tokens.sign({ sub: user.id, role: user.role }),
      expiresIn: this.tokens.expiresIn,
      user: toPublic(user),
    };
  }
}

function toPublic(user: { id: string; email: string; fullName: string; role: string }): PublicUser {
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role as RoleName };
}
