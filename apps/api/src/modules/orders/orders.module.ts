import { Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StaffOrdersController } from './staff.controller';

const SWEEP_EVERY_MS = 60_000;

@Module({
  controllers: [OrdersController, StaffOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private readonly logger = new Logger(OrdersModule.name);

  constructor(private readonly orders: OrdersService) {}

  /** BR-08: mỗi phút hủy đơn quá hạn giữ kho và hoàn kho. Tắt khi test (NODE_ENV=test). */
  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => {
      this.orders
        .expireOverdue()
        .then((n) => n > 0 && this.logger.log(`Đã hủy ${n} đơn quá hạn giữ kho`))
        .catch((e: unknown) => this.logger.error(`Lỗi quét đơn quá hạn: ${String(e)}`));
    }, SWEEP_EVERY_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
