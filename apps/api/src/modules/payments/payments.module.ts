import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { MockGateway, PAYMENT_GATEWAY } from './mock-gateway';
import { PaymentsController } from './payments.controller';
import { PAYMENT_TIMEOUT_MS, PaymentsService } from './payments.service';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_GATEWAY, useClass: MockGateway },
    { provide: PAYMENT_TIMEOUT_MS, useValue: Number(process.env.PAYMENT_TIMEOUT_MS ?? 10_000) },
  ],
})
export class PaymentsModule {}
