import { HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
import {
  MAX_CUPS_PER_ORDER,
  MAX_TOPPINGS_PER_LINE,
  ORDER_TRANSITIONS,
  type OrderListItem,
  type OrderPage,
  type OrderStatus,
  type OrderView,
} from '@brewlite/shared';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateOrderDto } from './dto/create-order.dto';

export const HOLD_MINUTES = 15; // BR-08
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export const CLOCK = Symbol('CLOCK');
type Clock = () => Date;

/** Kiểu tối thiểu của Prisma transaction client mà service dùng, để dễ giả lập khi test. */
type Tx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CLOCK) private readonly now: Clock = () => new Date(),
  ) {}

  /** FR-04: tạo đơn, kiểm tra và trừ kho trong một transaction (BR-05, BR-06, BR-07). */
  async create(userId: string, dto: CreateOrderDto): Promise<OrderView> {
    const cups = dto.items.reduce((n, i) => n + i.quantity, 0);
    if (cups > MAX_CUPS_PER_ORDER) {
      throw new AppException('ORDER_TOO_LARGE', `Một đơn tối đa ${MAX_CUPS_PER_ORDER} ly`, HttpStatus.BAD_REQUEST);
    }

    return this.prisma.$transaction(async (tx) => {
      const productIds = [...new Set(dto.items.map((i) => i.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { sizes: true, toppings: { include: { topping: true } } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      const unavailable = productIds.filter((id) => !byId.get(id)?.isActive);
      if (unavailable.length) {
        throw new AppException('PRODUCT_UNAVAILABLE', 'Có món đã ngừng bán', HttpStatus.CONFLICT, {
          productIds: unavailable,
        });
      }

      const lines = dto.items.map((item) => {
        const product = byId.get(item.productId)!;
        const size = product.sizes.find((s) => s.code === item.size);
        const toppingIds = item.toppingIds ?? [];
        const allowed = new Map(product.toppings.map((pt) => [pt.topping.id, pt.topping]));
        const toppings = toppingIds.map((id) => allowed.get(id));
        if (
          !size ||
          toppingIds.length > MAX_TOPPINGS_PER_LINE ||
          new Set(toppingIds).size !== toppingIds.length ||
          toppings.some((t) => !t || !t.isActive)
        ) {
          throw new AppException('INVALID_ITEM', 'Size hoặc topping không hợp lệ cho sản phẩm', HttpStatus.BAD_REQUEST, {
            productId: item.productId,
          });
        }
        const chosen = toppings.map((t) => ({ id: t!.id, name: t!.name, price: t!.price }));
        const unitPrice = product.basePrice + size.extraPrice + chosen.reduce((sum, t) => sum + t.price, 0);
        return {
          productId: product.id,
          productName: product.name,
          size: item.size,
          sizeExtra: size.extraPrice,
          toppings: chosen,
          note: item.note ?? '',
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
        };
      });

      const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
      const total = subtotal; // khuyến mãi/đổi điểm (Should) sẽ trừ ở đây
      if (dto.expectedTotal !== undefined && dto.expectedTotal !== total) {
        throw new AppException('PRICE_CHANGED', 'Giá đã thay đổi, vui lòng kiểm tra lại', HttpStatus.CONFLICT, {
          total,
          subtotal,
          discount: 0,
        });
      }

      // Trừ kho: một câu UPDATE có điều kiện cho mỗi sản phẩm nên không bao giờ âm và an toàn khi đặt đồng thời.
      const qtyByProduct = new Map<string, number>();
      for (const l of lines) qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) ?? 0) + l.quantity);
      const short: string[] = [];
      for (const [id, qty] of qtyByProduct) {
        const res = await tx.product.updateMany({
          where: { id, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        });
        if (res.count === 0) short.push(id);
      }
      if (short.length) {
        // Ném lỗi để transaction rollback: không món nào bị trừ kho (BR-07).
        throw new AppException('OUT_OF_STOCK', 'Có món không đủ tồn kho', HttpStatus.CONFLICT, { productIds: short });
      }

      const now = this.now();
      const day = vnDay(now);
      const counter = await tx.orderCounter.upsert({
        where: { day },
        create: { day, last: 1 },
        update: { last: { increment: 1 } },
      });
      const seq = String(counter.last).padStart(4, '0');

      const created = await tx.order.create({
        data: {
          code: `BL-${day}-${seq}`,
          userId,
          status: 'PENDING_PAYMENT',
          subtotal,
          discount: 0,
          total,
          expiresAt: new Date(now.getTime() + HOLD_MINUTES * 60_000),
          items: { create: lines },
          events: { create: [{ status: 'PENDING_PAYMENT' }] },
        },
        include: orderInclude,
      });
      return toView(created);
    });
  }

  /** FR-08: lịch sử đơn của chính người gọi, mới nhất trước (AC-08.1). */
  async list(userId: string, page: number, limit: number): Promise<OrderPage> {
    const where = { userId };
    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: { select: { quantity: true } } },
      }),
    ]);
    const items: OrderListItem[] = rows.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      total: o.total,
      cups: o.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: o.createdAt.toISOString(),
    }));
    return { items, total, page, limit };
  }

  /** FR-07: chủ đơn, Staff hoặc Manager; người khác nhận 404 (BR-17, AC-07.2). */
  async get(user: { id: string; role: string }, id: string): Promise<OrderView> {
    const row = await this.prisma.order.findFirst({
      where: user.role === 'CUSTOMER' ? { id, userId: user.id } : { id },
      include: orderInclude,
    });
    if (!row) throw notFound();
    return toView(row);
  }

  /** AC-12.1: đơn đã thanh toán trở đi, cũ nhất trước. */
  async listForStaff(statuses: OrderStatus[]): Promise<OrderView[]> {
    const rows = await this.prisma.order.findMany({
      where: { status: { in: statuses } },
      orderBy: { createdAt: 'asc' },
      include: orderInclude,
      take: 200,
    });
    return rows.map(toView);
  }

  /** FR-12: nhân viên đổi trạng thái theo BR-12. PENDING_PAYMENT/CANCELLED do hệ thống xử lý, không qua đây. */
  async advance(id: string, next: OrderStatus): Promise<OrderView> {
    if (next === 'PAID' || next === 'CANCELLED' || next === 'PENDING_PAYMENT') {
      throw new AppException('INVALID_TRANSITION', 'Nhân viên không đặt được trạng thái này', HttpStatus.CONFLICT);
    }
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw notFound();
      if (!ORDER_TRANSITIONS[order.status].includes(next)) {
        throw new AppException(
          'INVALID_TRANSITION',
          `Không thể chuyển đơn từ ${order.status} sang ${next}`,
          HttpStatus.CONFLICT,
          { from: order.status, to: next },
        );
      }
      // Điều kiện status giữ nguyên trong WHERE để hai nhân viên bấm cùng lúc không chuyển đúp.
      const res = await tx.order.updateMany({ where: { id, status: order.status }, data: { status: next } });
      if (res.count === 0) {
        throw new AppException('INVALID_TRANSITION', 'Đơn vừa được cập nhật bởi người khác', HttpStatus.CONFLICT);
      }
      await tx.orderStatusEvent.create({ data: { orderId: id, status: next } });
      const row = await tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
      return toView(row);
    });
  }

  /** Hủy đơn PENDING_PAYMENT và hoàn kho (BR-08, BR-09). Trả true nếu thật sự hủy. Gọi trong transaction. */
  async cancelAndRestock(tx: Tx, orderId: string): Promise<boolean> {
    const res = await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED' },
    });
    if (res.count === 0) return false;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    const qty = new Map<string, number>();
    for (const i of items) qty.set(i.productId, (qty.get(i.productId) ?? 0) + i.quantity);
    for (const [productId, n] of qty) {
      await tx.product.update({ where: { id: productId }, data: { stock: { increment: n } } });
    }
    await tx.orderStatusEvent.create({ data: { orderId, status: 'CANCELLED' } });
    return true;
  }

  /** BR-08: hủy mọi đơn PENDING_PAYMENT quá hạn giữ kho và hoàn kho. Trả số đơn đã hủy. */
  async expireOverdue(): Promise<number> {
    const overdue = await this.prisma.order.findMany({
      where: { status: 'PENDING_PAYMENT', expiresAt: { lt: this.now() } },
      select: { id: true },
      take: 100,
    });
    let cancelled = 0;
    for (const { id } of overdue) {
      if (await this.prisma.$transaction((tx) => this.cancelAndRestock(tx, id))) cancelled += 1;
    }
    return cancelled;
  }
}

const orderInclude = {
  items: true,
  events: { orderBy: { createdAt: 'asc' } },
  payments: { where: { status: 'SUCCEEDED' } },
} as const;

type OrderRow = {
  id: string;
  code: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  expiresAt: Date;
  createdAt: Date;
  items: {
    productId: string;
    productName: string;
    size: string;
    toppings: unknown;
    note: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  events: { status: OrderStatus; createdAt: Date }[];
  payments: { method: string; cardLast4: string | null }[];
};

function toView(o: OrderRow): OrderView {
  const payment = o.payments[0];
  return {
    id: o.id,
    code: o.code,
    callNumber: o.code.slice(-4),
    status: o.status,
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    expiresAt: o.expiresAt.toISOString(),
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      size: i.size as OrderView['items'][number]['size'],
      toppings: i.toppings as OrderView['items'][number]['toppings'],
      note: i.note,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    timeline: o.events.map((e) => ({ status: e.status, at: e.createdAt.toISOString() })),
    payment: payment
      ? { method: payment.method as 'CARD' | 'WALLET', cardLast4: payment.cardLast4 }
      : null,
  };
}

function notFound(): AppException {
  return new AppException('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng', HttpStatus.NOT_FOUND);
}

/** YYMMDD theo giờ Việt Nam (UTC+7) cho mã đơn BR-16. */
function vnDay(date: Date): string {
  const d = new Date(date.getTime() + VN_OFFSET_MS);
  const yy = String(d.getUTCFullYear()).slice(-2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}
