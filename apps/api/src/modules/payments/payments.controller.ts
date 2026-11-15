import { Body, Controller, Headers, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard, type AuthUser } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/roles.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** AC-05.1: 201 thành công, 402 thất bại, 202 đang xử lý. Cần header Idempotency-Key (AC-06.1). */
  @Post()
  async pay(
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') key: string | undefined,
    @Body() dto: CreatePaymentDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    const result = await this.payments.pay(user.id, key, dto);
    res.status(result.status);
    return result.body;
  }
}
