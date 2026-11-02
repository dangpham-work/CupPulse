import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/** GET /health – Render và smoke test dùng để kiểm tra API và kết nối DB (NFR-14, ADR-008). */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(@Res() res: Response): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.status(HttpStatus.OK).json({ status: 'ok', db: 'up' });
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({ status: 'error', db: 'down' });
    }
  }
}
