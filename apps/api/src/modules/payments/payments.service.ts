import { HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  PAYMENT_FAIL_MESSAGES,
  cardBrand,
  validatePayment,
  type PaymentFailReason,
  type PaymentResponse,
} from '@brewlite/shared';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import { PAYMENT_GATEWAY, type GatewayOutcome, type PaymentGateway } from './mock-gateway';

const KEY_TTL_MS = 24 * 60 * 60 * 1000; // BR-11
const MAX_FAILED_ATTEMPTS = 3; // BR-09
export const PAYMENT_TIMEOUT_MS = Symbol('PAYMENT_TIMEOUT_MS');
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAID_STATES = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

export interface PaymentHttpResult {
  status: number;
  body: unknown;
}

interface StoredKey {
  userId: string;
  key: string;
  statusCode: number | null;
  responseBody: unknown;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @Optional() @Inject(PAYMENT_TIMEOUT_MS) private readonly timeoutMs: number = 10_000,
  ) {}

  /** FR-05 + FR-06. Mọi kết quả của cổng thanh toán (201/402/202) được lưu theo Idempotency-Key để phát lại. */
  async pay(userId: string, rawKey: string | undefined, dto: CreatePaymentDto): Promise<PaymentHttpResult> {
    if (!rawKey || !UUID_V4.test(rawKey)) {
      throw new AppException('IDEMPOTENCY_KEY_REQUIRED', 'Thiếu hoặc sai header Idempotency-Key (UUID v4)', HttpStatus.BAD_REQUEST);
    }
    const key = rawKey.toLowerCase();
    const errors = validatePayment(dto);
    if (Object.keys(errors).length) {
      throw new AppException('VALIDATION_FAILED', 'Thông tin thanh toán không hợp lệ', HttpStatus.BAD_REQUEST, { fields: errors });
    }

    const requestHash = fingerprint(dto);
    const existing = await this.claim(userId, key, requestHash);
    if (existing) return this.replay(existing);

    try {
      const result = await this.process(userId, dto);
      await this.store(userId, key, result);
      return result;
    } catch (error) {
      // Lỗi nghiệp vụ trước khi chạm cổng thanh toán: nhả khóa để client sửa rồi gửi lại cùng khóa được.
      await this.prisma.idempotencyKey.deleteMany({ where: { userId, key } });
      throw error;
    }
  }

  /** Tạo bản ghi khóa; nếu đã có thì trả bản ghi cũ (sau khi kiểm tra cùng nội dung). */
  private async claim(userId: string, key: string, requestHash: string): Promise<StoredKey | null> {
    try {
      await this.prisma.idempotencyKey.create({ data: { userId, key, requestHash } });
      return null;
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002') throw error;
    }
    const found = await this.prisma.idempotencyKey.findUnique({ where: { userId_key: { userId, key } } });
    if (!found) return this.claim(userId, key, requestHash); // bị xóa giữa chừng, thử lại
    if (Date.now() - found.createdAt.getTime() > KEY_TTL_MS) {
      await this.prisma.idempotencyKey.deleteMany({ where: { userId, key } });
      return this.claim(userId, key, requestHash);
    }
    if (found.requestHash !== requestHash) {
      throw new AppException('IDEMPOTENCY_KEY_REUSED', 'Khóa này đã dùng cho một yêu cầu khác', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (found.statusCode === null) {
      throw new AppException('REQUEST_IN_PROGRESS', 'Yêu cầu đang được xử lý', HttpStatus.CONFLICT);
    }
    return found;
  }

  private async replay(found: StoredKey): Promise<PaymentHttpResult> {
    const stored = { status: found.statusCode as number, body: found.responseBody };
    if (stored.status !== HttpStatus.ACCEPTED) return stored;
    // Đang PENDING: hỏi lại cổng để lấy kết quả cuối (AC-05.7).
    const { paymentId } = stored.body as PaymentResponse;
    const result = await this.resolvePending(paymentId);
    await this.store(found.userId, found.key, result);
    return result;
  }

  private async process(userId: string, dto: CreatePaymentDto): Promise<PaymentHttpResult> {
    const order = await this.prisma.order.findFirst({ where: { id: dto.orderId, userId } });
    if (!order) throw new AppException('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng', HttpStatus.NOT_FOUND);
    if (PAID_STATES.includes(order.status)) {
      throw new AppException('ORDER_ALREADY_PAID', 'Đơn đã được thanh toán', HttpStatus.CONFLICT);
    }
    if (order.status !== 'PENDING_PAYMENT' || order.expiresAt.getTime() <= Date.now()) {
      if (order.status === 'PENDING_PAYMENT') await this.prisma.$transaction((tx) => this.orders.cancelAndRestock(tx, order.id));
      throw new AppException('ORDER_NOT_PAYABLE', 'Đơn không còn có thể thanh toán', HttpStatus.CONFLICT);
    }

    const card = dto.method === 'CARD' ? dto.card : undefined;
    const digits = card?.number.replace(/\s/g, '');
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: dto.method,
        status: 'PENDING',
        amount: order.total, // BR-10: luôn bằng Order.total
        cardLast4: digits ? digits.slice(-4) : null,
        cardBrand: digits ? cardBrand(digits) : null,
      },
    });

    const outcome = await this.callGateway(payment.id, {
      method: dto.method,
      amount: order.total,
      card: card ? { number: digits as string } : undefined,
      wallet: dto.wallet,
    });
    return this.settle(payment.id, order.id, outcome);
  }

  private async callGateway(ref: string, request: Parameters<PaymentGateway['charge']>[1]): Promise<GatewayOutcome> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<GatewayOutcome>((resolve) => {
      timer = setTimeout(() => resolve({ state: 'PENDING' }), this.timeoutMs);
    });
    try {
      return await Promise.race([this.gateway.charge(ref, request), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  private async resolvePending(paymentId: string): Promise<PaymentHttpResult> {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (payment.status === 'PENDING') {
      const outcome = await this.gateway.status(payment.id);
      return this.settle(payment.id, payment.orderId, outcome);
    }
    return this.fromPayment(payment.id, payment.orderId, payment.status, payment.failReason);
  }

  /** Ghi kết quả cổng vào DB và dựng phản hồi HTTP. Chạy trong transaction để Payment và Order luôn khớp nhau. */
  private settle(paymentId: string, orderId: string, outcome: GatewayOutcome): Promise<PaymentHttpResult> {
    if (outcome.state === 'PENDING') {
      return Promise.resolve({
        status: HttpStatus.ACCEPTED,
        body: { paymentId, status: 'PENDING', orderStatus: 'PENDING_PAYMENT' } satisfies PaymentResponse,
      });
    }
    return this.prisma.$transaction(async (tx) => {
      // Chỉ chốt khi payment còn PENDING, tránh hai request cùng chốt một payment.
      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: {
          status: outcome.state,
          failReason: outcome.state === 'FAILED' ? outcome.reason : null,
        },
      });
      if (claimed.count === 0) {
        const current = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
        return this.fromPayment(current.id, orderId, current.status, current.failReason);
      }
      if (outcome.state === 'SUCCEEDED') {
        const paid = await tx.order.updateMany({ where: { id: orderId, status: 'PENDING_PAYMENT' }, data: { status: 'PAID' } });
        if (paid.count === 0) {
          // Đơn đã bị hủy/hết hạn trong lúc chờ cổng: không ghi nhận tiền vào đơn không còn hiệu lực.
          await tx.payment.update({ where: { id: paymentId }, data: { status: 'FAILED', failReason: 'ORDER_NOT_PAYABLE' } });
          throw new AppException('ORDER_NOT_PAYABLE', 'Đơn không còn có thể thanh toán', HttpStatus.CONFLICT);
        }
        await tx.orderStatusEvent.create({ data: { orderId, status: 'PAID' } });
        return this.fromPayment(paymentId, orderId, 'SUCCEEDED', null);
      }
      const failed = await tx.payment.count({ where: { orderId, status: 'FAILED' } });
      if (failed >= MAX_FAILED_ATTEMPTS) await this.orders.cancelAndRestock(tx, orderId); // BR-09
      return this.fromPayment(paymentId, orderId, 'FAILED', outcome.reason);
    });
  }

  private fromPayment(paymentId: string, _orderId: string, status: string, failReason: string | null): PaymentHttpResult {
    if (status === 'SUCCEEDED') {
      return {
        status: HttpStatus.CREATED,
        body: { paymentId, status: 'SUCCEEDED', orderStatus: 'PAID' } satisfies PaymentResponse,
      };
    }
    if (status === 'PENDING') {
      return {
        status: HttpStatus.ACCEPTED,
        body: { paymentId, status: 'PENDING', orderStatus: 'PENDING_PAYMENT' } satisfies PaymentResponse,
      };
    }
    const reason = (failReason ?? 'CARD_DECLINED') as PaymentFailReason;
    return {
      status: HttpStatus.PAYMENT_REQUIRED,
      body: {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        code: 'PAYMENT_FAILED',
        message: PAYMENT_FAIL_MESSAGES[reason] ?? 'Thanh toán thất bại',
        details: { reason, paymentId },
      },
    };
  }

  private store(userId: string, key: string, result: PaymentHttpResult) {
    return this.prisma.idempotencyKey.updateMany({
      where: { userId, key },
      data: { statusCode: result.status, responseBody: result.body as object },
    });
  }
}

/** Dấu vân tay nội dung yêu cầu (AC-06.3). Chỉ gồm 4 số cuối thẻ, không băm số thẻ đầy đủ (BR-18). */
function fingerprint(dto: CreatePaymentDto): string {
  const card = dto.card?.number.replace(/\s/g, '').slice(-4) ?? '';
  const wallet = dto.wallet?.phone ?? '';
  return createHash('sha256').update(JSON.stringify([dto.orderId, dto.method, card, wallet])).digest('hex');
}
